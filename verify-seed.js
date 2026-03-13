
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const wallets = await prisma.wallet.findMany();
    console.log('Seed verification - Wallets found:', wallets.length);
    wallets.forEach(w => console.log(`User: ${w.userId}, Balance: ${w.availableBalance}`));
  } catch (e) {
    console.error('Verification failed:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
