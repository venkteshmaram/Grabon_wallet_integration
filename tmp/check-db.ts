import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true }
    });
    console.log('--- USERS IN DB ---');
    console.log(JSON.stringify(users, null, 2));
    
    const wallets = await prisma.wallet.findMany();
    console.log('--- WALLETS IN DB ---');
    console.log(JSON.stringify(wallets, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
