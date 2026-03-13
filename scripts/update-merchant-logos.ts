import { PrismaClient } from '@prisma/client/index';

const prisma = new PrismaClient();

/**
 * UTILITY: Update Merchant Logos
 * 
 * 1. Place your images in: /public/merchants/
 * 2. Update the mapping below with your filenames
 * 3. Run with: npx ts-node scripts/update-merchant-logos.ts
 */
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
    console.log('🚀 Updating merchant logos...');

    for (const [name, filename] of Object.entries(LOGO_MAPPING)) {
        const logoUrl = `/merchants/${filename}`;
        
        const merchant = await prisma.merchant.updateMany({
            where: { name: { equals: name, mode: 'insensitive' } },
            data: { logoUrl }
        });

        if (merchant.count > 0) {
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
