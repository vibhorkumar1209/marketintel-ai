const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const reports = await prisma.report.findMany({ orderBy: { createdAt: 'desc' }, take: 1 });
    if (reports.length === 0) return;
    const sections = reports[0].sections;
    const reg = sections.find(s => s.id === 'regulatory');
    console.log(JSON.stringify(reg, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
