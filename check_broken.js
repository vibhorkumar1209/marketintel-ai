
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkFailed() {
    const reports = await prisma.report.findMany();
    const failed = reports.filter(r =>
        r.sections && r.sections.some(s => s.flags && s.flags.some(f => f.includes('JSON parsing failed')))
    );
    console.log('Broken reports:', failed.length);
    failed.forEach(r => console.log(`- ${r.title} (ID: ${r.id})`));
}

checkFailed().catch(console.error).finally(() => prisma.$disconnect());
