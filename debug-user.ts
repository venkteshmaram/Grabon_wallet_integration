
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const userId = '8b26ad69-e7b6-4b0d-8e23-2290756e0b90';
  console.log(`Checking user ${userId}...`);
  
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (user) {
      console.log('User found:', user.name, user.email);
    } else {
      console.log('User NOT found in users table.');
    }
    
    const count = await prisma.user.count();
    console.log(`Total users in DB: ${count}`);
    
    const lastOTP = await prisma.oTPVerification.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' }
    });
    console.log('Last OTP for user:', lastOTP);

  } catch (error) {
    console.error('Database check failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
