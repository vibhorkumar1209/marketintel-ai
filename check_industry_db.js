const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    const reports = await prisma.report.findMany({
        where: { reportType: 'industry_report' },
        take: 1
    });
    if (reports.length > 0) {
        const r = reports[0];
        const s = r.sections[0];
        console.log(JSON.stringify({ title: s.title, content: s.content }).substring(0, 1000));
    }
}
run().catch(console.error).finally(() => prisma.$disconnect());
