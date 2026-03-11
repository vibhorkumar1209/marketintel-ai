const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    const reports = await prisma.report.findMany({
        where: { reportType: 'industry_report' },
        orderBy: { createdAt: 'desc' }
    });

    for (const r of reports) {
        let sections = r.sections || [];
        let updated = false;

        for (let i = 0; i < sections.length; i++) {
            const sec = sections[i];
            if (sec.content && sec.content.length === 1 && typeof sec.content[0] === 'string' && sec.content[0].startsWith('```json')) {
                console.log(`Report ${r.title} has raw JSON block in section ${sec.id}`);

                const rawStr = sec.content[0];
                const match = rawStr.match(/\{[\s\S]*/); // Match from { to end
                if (match) {
                    try {
                        let cleanJson = match[0].replace(/```$/g, '').trim();

                        // Rudimentary JSON fixer
                        let openBraces = (cleanJson.match(/\{/g) || []).length;
                        let closeBraces = (cleanJson.match(/\}/g) || []).length;
                        let openBrackets = (cleanJson.match(/\[/g) || []).length;
                        let closeBrackets = (cleanJson.match(/\]/g) || []).length;

                        // Just append whatever is missing
                        if (openBrackets > closeBrackets) {
                            cleanJson += '"]'.repeat(openBrackets - closeBrackets);
                        }
                        if (openBraces > closeBraces) {
                            cleanJson += '}'.repeat(openBraces - closeBraces);
                        }
                        console.log("Trying to parse patched JSON...", cleanJson.substring(0, 100));

                        const parsed = JSON.parse(cleanJson);

                        const newSec = {
                            id: parsed.section_id || sec.id,
                            title: parsed.section_title || sec.title,
                            content: parsed.body_paragraphs || [""],
                            keyTable: parsed.key_table ? {
                                title: parsed.key_table.title,
                                headers: parsed.key_table.headers,
                                rows: parsed.key_table.rows
                            } : undefined,
                            chartSpec: parsed.chart_spec ? {
                                type: parsed.chart_spec.type,
                                title: parsed.chart_spec.title,
                                xAxis: parsed.chart_spec.xAxis || parsed.chart_spec.x_axis,
                                yAxis: parsed.chart_spec.yAxis || parsed.chart_spec.y_axis,
                                dataSource: parsed.chart_spec.dataSource || parsed.chart_spec.data_source
                            } : undefined,
                            subsections: parsed.subsections ? parsed.subsections.map((sub, idx) => ({
                                title: sub ? sub.title : `Sub ${idx}`,
                                content: sub ? sub.body_paragraphs || [] : [],
                                keyTable: sub && sub.key_table ? {
                                    title: sub.key_table.title,
                                    headers: sub.key_table.headers,
                                    rows: sub.key_table.rows
                                } : undefined,
                                chartSpec: sub && sub.chart_spec ? {
                                    type: sub.chart_spec.type,
                                    title: sub.chart_spec.title,
                                    xAxis: sub.chart_spec.xAxis || sub.chart_spec.x_axis,
                                    yAxis: sub.chart_spec.yAxis || sub.chart_spec.y_axis,
                                    dataSource: sub.chart_spec.dataSource || sub.chart_spec.data_source
                                } : undefined
                            })) : undefined,
                            citations: parsed.citations || sec.citations || [],
                            flags: parsed.section_flags || sec.flags || [],
                            adminMethodology: parsed.admin_methodology || sec.adminMethodology || ""
                        };

                        sections[i] = newSec;
                        updated = true;
                        console.log(`Successfully parsed and normalized section ${newSec.id}`);
                    } catch (err) {
                        console.log("Failed to JSON.parse the extracted block for section", sec.id);
                        console.log("Error:", err.message);
                        let plain = rawStr.replace(/```json/g, '').replace(/```/g, '').trim();
                        sections[i].content = [plain];
                        updated = true;
                    }
                }
            }
        }

        if (updated) {
            await prisma.report.update({
                where: { id: r.id },
                data: { sections }
            });
            console.log(`Updated report ${r.id} in DB.`);

            const fs = require('fs');
            const envLocal = fs.readFileSync('.env.local', 'utf8');
            let redisUrl = '';
            for (const line of envLocal.split('\n')) {
                if (line.startsWith('REDIS_URL=')) redisUrl = line.split('=')[1].replace(/"/g, '');
            }
            if (redisUrl) {
                const Redis = require('ioredis');
                const redis = new Redis(redisUrl);
                await redis.del(`report:${r.id}`);
                await redis.quit();
                console.log('Cleared redis cache for report', r.id);
            }
        }
    }
}

run().catch(console.error).finally(() => prisma.$disconnect());
