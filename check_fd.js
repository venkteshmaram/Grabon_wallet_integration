
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const user = await prisma.user.findFirst({
            include: { wallet: true }
        });

        if (!user) {
            console.log('No user found');
            return;
        }

        console.log('USER_ID:', user.id);
        console.log('USER_NAME:', user.name);
        console.log('AVAILABLE_PAISA:', user.wallet?.availablePaisa);
        console.log('PENDING_PAISA:', user.wallet?.pendingPaisa);

        const ledger = await prisma.ledgerEntry.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            take: 10
        });

        console.log('--- RECENT LEDGER ---');
        ledger.forEach(e => {
            console.log(`${e.createdAt.toISOString()} | ${e.type} | ${e.direction} | ${e.amount} | ${e.status}`);
        });

        const fds = await prisma.fDRecord.findMany({
            where: { userId: user.id }
        });
        console.log('--- FDs ---');
        fds.forEach(f => {
            console.log(`${f.id} | ${f.principal} | ${f.status}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
