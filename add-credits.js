const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany();
  for (const user of users) {
    const credits = await prisma.credits.upsert({
      where: { userId: user.id },
      update: { balance: { increment: 10000 } },
      create: { userId: user.id, balance: 10000 }
    });
    console.log(`Updated credits for ${user.email} -> Balance: ${credits.balance}`);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
