const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

function heuristicFixJson(raw) {
    let clean = raw.trim();
    if (clean.startsWith('```json')) {
        const start = clean.indexOf('{');
        const end = clean.lastIndexOf('}');
        if (start !== -1 && end !== -1) {
            clean = clean.substring(start, end + 1);
        } else if (start !== -1) {
            clean = clean.substring(start);
        } else {
            clean = clean.replace(/```json/g, '').replace(/```/g, '').trim();
        }
    }

    // Step 1: Handle unterminated strings
    let inString = false;
    let escaped = false;
    for (let i = 0; i < clean.length; i++) {
        const char = clean[i];
        if (char === '\\' && !escaped) {
            escaped = true;
        } else if (char === '"' && !escaped) {
            inString = !inString;
            escaped = false;
        } else {
            escaped = false;
        }
    }

    if (inString) {
        clean += '"';
    }

    // Step 2: Handle unclosed arrays/objects
    // We should be careful not to count braces inside strings.
    let balance = [];
    inString = false;
    escaped = false;
    for (let i = 0; i < clean.length; i++) {
        const char = clean[i];
        if (char === '\\' && !escaped) {
            escaped = true;
        } else if (char === '"' && !escaped) {
            inString = !inString;
            escaped = false;
        } else if (!inString) {
            if (char === '{' || char === '[') {
                balance.push(char);
            } else if (char === '}') {
                if (balance[balance.length - 1] === '{') balance.pop();
            } else if (char === ']') {
                if (balance[balance.length - 1] === '[') balance.pop();
            }
            escaped = false;
        } else {
            escaped = false;
        }
    }

    while (balance.length > 0) {
        const last = balance.pop();
        if (last === '{') clean += '}';
        else if (last === '[') clean += ']';
    }

    return clean;
}

async function run() {
    const reports = await prisma.report.findMany({
        orderBy: { createdAt: 'desc' }
    });

    console.log(`Analyzing ${reports.length} reports for broken sections...`);

    for (const r of reports) {
        let sections = r.sections || [];
        let updated = false;

        for (let i = 0; i < sections.length; i++) {
            const sec = sections[i];
            if (sec.content && sec.content.length === 1 && typeof sec.content[0] === 'string') {
                const rawStr = sec.content[0].trim();

                // Check if it's a JSON block
                if (rawStr.startsWith('{') || rawStr.startsWith('```json')) {
                    console.log(`Report [${r.id}] ${r.title} has JSON in section ${sec.id || sec.title}`);

                    try {
                        const jsonStr = heuristicFixJson(rawStr);
                        console.log("   Attempting to parse patched JSON (size: " + jsonStr.length + ")...");
                        const parsed = JSON.parse(jsonStr);

                        // Map fields robustly
                        const newSec = {
                            id: parsed.section_id || sec.id || 'section_' + i,
                            title: parsed.section_title || parsed.title || sec.title || (sec.id === 'dynamics' ? 'Trends' : 'Section'),
                            content: parsed.body_paragraphs || parsed.content || [],
                            keyTable: parsed.key_table || parsed.keyTable || undefined,
                            chartSpec: parsed.chart_spec || parsed.chartSpec || undefined,
                            subsections: (parsed.subsections || []).map((sub, idx) => ({
                                title: sub.title || `Subsection ${idx + 1}`,
                                content: sub.body_paragraphs || sub.content || [],
                                keyTable: sub.key_table || sub.keyTable || undefined,
                                chartSpec: sub.chart_spec || sub.chartSpec || undefined,
                                adminMethodology: sub.admin_methodology || sub.adminMethodology || ""
                            })),
                            citations: parsed.citations || sec.citations || [],
                            flags: parsed.section_flags || parsed.flags || sec.flags || [],
                            adminMethodology: parsed.admin_methodology || parsed.adminMethodology || sec.adminMethodology || ""
                        };

                        // Cleanup chartSpec fields
                        const cleanupChart = (spec) => {
                            if (!spec || typeof spec !== 'object') return spec;
                            return {
                                ...spec,
                                xAxis: spec.xAxis || spec.x_axis,
                                yAxis: spec.yAxis || spec.y_axis,
                                dataSource: spec.dataSource || spec.data_source
                            };
                        };

                        newSec.chartSpec = cleanupChart(newSec.chartSpec);
                        if (newSec.subsections) {
                            newSec.subsections = newSec.subsections.map(sub => ({
                                ...sub,
                                chartSpec: cleanupChart(sub.chartSpec)
                            }));
                        }

                        // If content is empty but it has body_paragraphs, fix it
                        if (newSec.content.length === 0 && parsed.body_paragraphs) {
                            newSec.content = parsed.body_paragraphs;
                        }

                        sections[i] = newSec;
                        updated = true;
                        console.log(`   Processed section ${sec.id || sec.title} successfully.`);
                    } catch (err) {
                        console.error(`   Failed to parse/fix section ${sec.id || sec.title}:`, err.message);
                    }
                }
            }
        }

        if (updated) {
            await prisma.report.update({
                where: { id: r.id },
                data: { sections }
            });
            console.log(`   Updated report [${r.id}] in database.`);

            // Invalidate Redis cache
            try {
                let redisUrl = process.env.REDIS_URL;
                if (!redisUrl && fs.existsSync('.env.local')) {
                    const envLines = fs.readFileSync('.env.local', 'utf8').split('\n');
                    for (const line of envLines) {
                        if (line.startsWith('REDIS_URL=')) {
                            redisUrl = line.split('=')[1].replace(/"/g, '').replace(/'/g, '').trim();
                            break;
                        }
                    }
                }

                if (redisUrl) {
                    const Redis = require('ioredis');
                    const redis = new Redis(redisUrl);
                    await redis.del(`report:${r.id}`);
                    await redis.quit();
                    console.log(`   Cleared Redis cache.`);
                }
            } catch (cacheErr) { }
        }
    }
}

run().catch(console.error).finally(() => prisma.$disconnect());
