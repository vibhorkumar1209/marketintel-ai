const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    const reports = await prisma.report.findMany({
        where: { id: "cmmjb37ad0005ouuk7bkxdd1z" }
    });
    if (reports.length > 0) {
        const r = reports[0];
        const sections = r.sections;
        const s = sections.find(x => x.id === 'trends_drivers_barriers' || x.section_id === 'trends_drivers_barriers');
        console.log(JSON.stringify(s.subsections.map(x => x.title), null, 2));
    }
}

run().catch(console.error).finally(() => prisma.$disconnect());
