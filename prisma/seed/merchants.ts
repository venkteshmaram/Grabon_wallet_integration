import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'

// ============================================
// 20 Real Indian Merchants across 6 categories
// Cashback rates are realistic GrabOn-style percentages
// ============================================

interface MerchantSeed {
  id: string
  name: string
  category: string
  logoUrl: string | null
  cashbackRate: number
  isActive: boolean
}

// Pre-generate stable UUIDs so other seed files can reference merchants by ID
export const MERCHANT_IDS = {
  // FOOD (5)
  ZOMATO: uuidv4(),
  SWIGGY: uuidv4(),
  DOMINOS: uuidv4(),
  BIGBASKET: uuidv4(),
  BLINKIT: uuidv4(),

  // TRAVEL (4)
  MAKEMYTRIP: uuidv4(),
  CLEARTRIP: uuidv4(),
  IRCTC: uuidv4(),
  UBER: uuidv4(),

  // SHOPPING (4)
  MYNTRA: uuidv4(),
  AJIO: uuidv4(),
  AMAZON: uuidv4(),
  FLIPKART: uuidv4(),

  // ENTERTAINMENT (3)
  BOOKMYSHOW: uuidv4(),
  NETFLIX: uuidv4(),
  HOTSTAR: uuidv4(),

  // BILLS (2)
  AIRTEL: uuidv4(),
  JIO: uuidv4(),

  // OTHERS (2)
  NYKAA: uuidv4(),
  CULTFIT: uuidv4(),
} as const

const merchants: MerchantSeed[] = [
  // ── FOOD ──────────────────────────────────────
  {
    id: MERCHANT_IDS.ZOMATO,
    name: 'Zomato',
    category: 'FOOD',
    logoUrl: null,
    cashbackRate: 5.0,
    isActive: true,
  },
  {
    id: MERCHANT_IDS.SWIGGY,
    name: 'Swiggy',
    category: 'FOOD',
    logoUrl: null,
    cashbackRate: 4.5,
    isActive: true,
  },
  {
    id: MERCHANT_IDS.DOMINOS,
    name: "Domino's Pizza",
    category: 'FOOD',
    logoUrl: null,
    cashbackRate: 6.0,
    isActive: true,
  },
  {
    id: MERCHANT_IDS.BIGBASKET,
    name: 'BigBasket',
    category: 'FOOD',
    logoUrl: null,
    cashbackRate: 3.5,
    isActive: true,
  },
  {
    id: MERCHANT_IDS.BLINKIT,
    name: 'Blinkit',
    category: 'FOOD',
    logoUrl: null,
    cashbackRate: 4.0,
    isActive: true,
  },

  // ── TRAVEL ────────────────────────────────────
  {
    id: MERCHANT_IDS.MAKEMYTRIP,
    name: 'MakeMyTrip',
    category: 'TRAVEL',
    logoUrl: null,
    cashbackRate: 3.0,
    isActive: true,
  },
  {
    id: MERCHANT_IDS.CLEARTRIP,
    name: 'Cleartrip',
    category: 'TRAVEL',
    logoUrl: null,
    cashbackRate: 2.5,
    isActive: true,
  },
  {
    id: MERCHANT_IDS.IRCTC,
    name: 'IRCTC',
    category: 'TRAVEL',
    logoUrl: null,
    cashbackRate: 2.0,
    isActive: true,
  },
  {
    id: MERCHANT_IDS.UBER,
    name: 'Uber',
    category: 'TRAVEL',
    logoUrl: null,
    cashbackRate: 3.5,
    isActive: true,
  },

  // ── SHOPPING ──────────────────────────────────
  {
    id: MERCHANT_IDS.MYNTRA,
    name: 'Myntra',
    category: 'SHOPPING',
    logoUrl: null,
    cashbackRate: 4.0,
    isActive: true,
  },
  {
    id: MERCHANT_IDS.AJIO,
    name: 'Ajio',
    category: 'SHOPPING',
    logoUrl: null,
    cashbackRate: 5.0,
    isActive: true,
  },
  {
    id: MERCHANT_IDS.AMAZON,
    name: 'Amazon',
    category: 'SHOPPING',
    logoUrl: null,
    cashbackRate: 2.5,
    isActive: true,
  },
  {
    id: MERCHANT_IDS.FLIPKART,
    name: 'Flipkart',
    category: 'SHOPPING',
    logoUrl: null,
    cashbackRate: 3.0,
    isActive: true,
  },

  // ── ENTERTAINMENT ─────────────────────────────
  {
    id: MERCHANT_IDS.BOOKMYSHOW,
    name: 'BookMyShow',
    category: 'ENTERTAINMENT',
    logoUrl: null,
    cashbackRate: 2.5,
    isActive: true,
  },
  {
    id: MERCHANT_IDS.NETFLIX,
    name: 'Netflix',
    category: 'ENTERTAINMENT',
    logoUrl: null,
    cashbackRate: 2.0,
    isActive: true,
  },
  {
    id: MERCHANT_IDS.HOTSTAR,
    name: 'Disney+ Hotstar',
    category: 'ENTERTAINMENT',
    logoUrl: null,
    cashbackRate: 2.0,
    isActive: true,
  },

  // ── BILLS ─────────────────────────────────────
  {
    id: MERCHANT_IDS.AIRTEL,
    name: 'Airtel',
    category: 'BILLS',
    logoUrl: null,
    cashbackRate: 1.0,
    isActive: true,
  },
  {
    id: MERCHANT_IDS.JIO,
    name: 'Jio',
    category: 'BILLS',
    logoUrl: null,
    cashbackRate: 1.0,
    isActive: true,
  },

  // ── OTHERS ────────────────────────────────────
  {
    id: MERCHANT_IDS.NYKAA,
    name: 'Nykaa',
    category: 'OTHERS',
    logoUrl: null,
    cashbackRate: 3.5,
    isActive: true,
  },
  {
    id: MERCHANT_IDS.CULTFIT,
    name: 'Cult.fit',
    category: 'OTHERS',
    logoUrl: null,
    cashbackRate: 2.0,
    isActive: true,
  },
]

export async function seedMerchants(prisma: PrismaClient): Promise<void> {
  for (const m of merchants) {
    await prisma.merchant.create({ data: m })
  }
  console.log(`✅ Seeded ${merchants.length} merchants`)
}
