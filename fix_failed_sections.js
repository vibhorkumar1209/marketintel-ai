
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixReport(jobId) {
    const report = await prisma.report.findUnique({ where: { jobId } });
    if (!report) {
        console.error('Report not found');
        return;
    }

    const sections = report.sections || [];
    let modified = false;

    const fixedSections = sections.map(section => {
        console.log(`Checking section: ${section.id}`);
        const hasFlag = section.flags && section.flags.some(f => f.includes('JSON parsing failed'));

        if (hasFlag) {
            console.log(`Found failed section: ${section.id}`);
            const rawText = section.content ? section.content[0] : '';
            console.log(`Content length: ${rawText ? rawText.length : 0}`);

            if (!rawText) return section;

            try {
                const start = rawText.indexOf('{');
                const end = rawText.lastIndexOf('}');
                if (start !== -1 && end !== -1) {
                    const jsonStr = rawText.slice(start, end + 1);
                    const parsed = JSON.parse(jsonStr);

                    console.log(`Successfully reparsed section: ${section.id}`);
                    modified = true;

                    return {
                        id: section.id,
                        title: parsed.section_title || section.title,
                        content: parsed.body_paragraphs || [],
                        keyTable: parsed.key_table ? {
                            title: parsed.key_table.title,
                            headers: parsed.key_table.headers,
                            rows: parsed.key_table.rows
                        } : undefined,
                        chartSpec: parsed.chart_spec ? {
                            type: parsed.chart_spec.type,
                            title: parsed.chart_spec.title,
                            xAxis: parsed.chart_spec.x_axis || parsed.chart_spec.xAxis,
                            yAxis: parsed.chart_spec.y_axis || parsed.chart_spec.yAxis,
                            dataSource: parsed.chart_spec.data_source || parsed.chart_spec.dataSource
                        } : undefined,
                        subsections: parsed.subsections?.map(sub => ({
                            title: sub.title,
                            content: sub.body_paragraphs || [],
                            keyTable: sub.key_table ? {
                                title: sub.key_table.title,
                                headers: sub.key_table.headers,
                                rows: sub.key_table.rows
                            } : undefined,
                            chartSpec: sub.chart_spec ? {
                                type: sub.chart_spec.type,
                                title: sub.chart_spec.title,
                                xAxis: sub.chart_spec.x_axis || sub.chart_spec.xAxis,
                                yAxis: sub.chart_spec.y_axis || sub.chart_spec.yAxis,
                                dataSource: sub.chart_spec.data_source || sub.chart_spec.dataSource
                            } : undefined,
                        })),
                        citations: parsed.citations || [],
                        flags: (parsed.section_flags || []).filter(f => !f.includes('JSON parsing failed')),
                        adminMethodology: parsed.admin_methodology
                    };
                } else {
                    console.log('No braces found in raw text');
                }
            } catch (e) {
                console.error(`Failed to parse section ${section.id}: ${e.message}`);
            }
        }
        return section;
    });

    if (modified) {
        console.log('Updating database...');
        await prisma.report.update({
            where: { id: report.id },
            data: {
                sections: fixedSections
            }
        });
        console.log('Report updated successfully.');
    } else {
        console.log('No sections could be fixed.');
    }
}

const jobId = 'cmmk6ybsr0001urxahby46ect';
fixReport(jobId).catch(console.error).finally(() => prisma.$disconnect());
