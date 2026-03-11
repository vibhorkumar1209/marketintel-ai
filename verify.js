const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    const reports = await prisma.report.findMany({
        where: { id: "cmmjb37ad0005ouuk7bkxdd1z" }
    });
    console.log(reports.map(r => ({ title: r.title, reportType: r.reportType })));
}

run().catch(console.error).finally(() => prisma.$disconnect());
