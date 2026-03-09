const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const result = await prisma.job.updateMany({
        where: {
            status: {
                in: ['running', 'queued', 'processing']
            }
        },
        data: {
            status: 'failed',
            errorMessage: 'Generation timed out and was manually cancelled.'
        }
    });
    console.log(`Updated ${result.count} stuck jobs to failed.`);
}
main().catch(console.error).finally(() => prisma.$disconnect());
