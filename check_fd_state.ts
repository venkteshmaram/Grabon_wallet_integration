
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Checking User and Wallet ---');
    const user = await prisma.user.findFirst({
        include: {
            wallet: true,
        }
    });

    if (!user) {
        console.log('No user found');
        return;
    }

    console.log(`User: ${user.name} (${user.id})`);
    console.log(`Wallet Balance: ₹${(user.wallet?.availableBalance ?? 0) / 100}`);
    console.log(`Pending Balance: ₹${(user.wallet?.pendingBalance ?? 0) / 100}`);

    console.log('\n--- Recent Ledger Entries ---');
    const ledger = await prisma.ledgerEntry.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 10,
    });

    ledger.forEach(entry => {
        console.log(`[${entry.createdAt.toISOString()}] ${entry.type} | ${entry.direction} | ₹${entry.amount / 100} | ${entry.status}`);
    });

    console.log('\n--- Active FDs ---');
    const fds = await prisma.fDRecord.findMany({
        where: { userId: user.id },
    });
    fds.forEach(fd => {
        console.log(`ID: ${fd.id} | Amount: ₹${fd.principal / 100} | Status: ${fd.status}`);
    });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
