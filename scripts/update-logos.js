const fs = require('fs');
const path = require('path');

// Manually load .env variables
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    });
}

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const LOGO_MAPPING = {
    'Zomato': 'zomato.png',
    'Swiggy': 'swiggy.jpg',
    'BigBasket': 'bigbasket.jpg',
    'Blinkit': 'blinkit.png',
    'MakeMyTrip': 'makemytrip.jpg',
    'Cleartrip': 'cleartrip.jpg',
    'IRCTC': 'irctc.jpg',
    'Uber': 'uber.jpg',
    'Myntra': 'myntra.jpg',
    'Ajio': 'ajio.png',
    'Amazon': 'amazon.jpg',
    'Flipkart': 'flipkart.jpg',
    'BookMyShow': 'Bookmyshow.jpg',
    'Netflix': 'Netflix.jpg',
    'Disney+ Hotstar': 'hotstar.jpg',
    'Airtel': 'airtel.png',
    'Jio': 'jio.jpg',
    'Nykaa': 'nyka.jpg',
    'Cult.fit': 'cultfit.jpg',
};

async function main() {
    console.log('🚀 Updating merchant logos (JS Mode)...');

    for (const [name, filename] of Object.entries(LOGO_MAPPING)) {
        const logoUrl = `/merchants/${filename}`;
        
        const result = await prisma.merchant.updateMany({
            where: { name: { equals: name, mode: 'insensitive' } },
            data: { logoUrl }
        });

        if (result.count > 0) {
            console.log(`✅ Linked ${name} to ${logoUrl}`);
        } else {
            console.log(`❌ Merchant "${name}" not found in database`);
        }
    }

    console.log('\n✨ All updates complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
