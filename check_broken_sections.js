const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    const reports = await prisma.report.findMany({
        orderBy: { createdAt: 'desc' }
    });

    console.log(`Analyzing ${reports.length} reports...`);

    for (const r of reports) {
        let sections = r.sections || [];
        let brokenSections = [];

        for (let i = 0; i < sections.length; i++) {
            const sec = sections[i];
            if (sec.content && sec.content.length === 1 && typeof sec.content[0] === 'string') {
                const first = sec.content[0].trim();
                if (first.startsWith('{') || first.startsWith('```json')) {
                    brokenSections.push(sec.id || sec.title);
                }
            }
        }

        if (brokenSections.length > 0) {
            console.log(`REPORT [${r.id}] ${r.title}: Broken sections -> ${brokenSections.join(', ')}`);
        }
    }
}

run().catch(console.error).finally(() => prisma.$disconnect());
