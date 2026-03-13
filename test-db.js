
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:Venkatesh%402284@localhost:5432/grabcash"
    }
  }
});

async function main() {
  try {
    console.log('Attempting to connect to database...');
    const result = await prisma.$queryRaw`SELECT current_database() as db`;
    console.log('Connection successful:', result);
  } catch (e) {
    console.error('Connection failed:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
