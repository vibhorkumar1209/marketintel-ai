const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    const reports = await prisma.report.findMany({
        where: { reportType: 'industry_report' },
        orderBy: { createdAt: 'desc' },
        take: 3
    });
    if (reports.length > 0) {
        for (const r of reports) {
            console.log('Report Title:', r.title);
            const sections = r.sections || [];
            for (const sec of sections) {
                if (sec.id === 'dynamics' || sec.id === 'regulatory' || sec.id === 'intro') {
                    console.log("  Section:", sec.title);
                    console.log("  Content array length:", Array.isArray(sec.content) ? sec.content.length : "Not array");

                    if (sec.content && sec.content.length > 0) {
                        console.log("  Sample para:", String(sec.content[0]).substring(0, 50));
                    }
                    if (sec.subsections && sec.subsections.length > 0) {
                        console.log("  Has subsections:", sec.subsections.length);
                        for (let sub of sec.subsections) {
                            console.log("    Subsection:", sub.title, "Content array length:", Array.isArray(sub.content) ? sub.content.length : "Not array");
                            if (sub.content && sub.content.length > 10) {
                                console.log("    Sample sub para 0:", String(sub.content[0]));
                                console.log("    Sample sub para 1:", String(sub.content[1]));
                            }
                        }
                    }
                }
            }
        }
    } else {
        console.log('No industry reports found.');
    }
}
run().catch(console.error).finally(() => prisma.$disconnect());
