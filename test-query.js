const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const r = await prisma.report.findFirst({ orderBy: { createdAt: 'desc' } });
  const section = r.sections.find(s => s.id === 'intro');
  const content = section.content[0];
  console.log("Length:", content.length);
  console.log("Ends with:", JSON.stringify(content.slice(-50)));
}
main().catch(console.error).finally(() => prisma.$disconnect());
