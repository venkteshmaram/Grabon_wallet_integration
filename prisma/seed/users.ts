import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { subDays, subMonths } from 'date-fns'

// ============================================
// 5 User Personas — each engineered for a specific demo scenario
// All amounts in PAISA (₹1 = 100 paisa)
// createdAt dates set to match persona age requirements
// ============================================

interface UserSeedData {
  id: string
  email: string
  phone: string
  name: string
  createdAt: Date
  wallet: {
    id: string
    availableBalance: number   // paisa
    pendingBalance: number     // paisa
    lockedBalance: number      // paisa
    lifetimeEarned: number     // paisa
  }
}

const now = new Date()

// Pre-generate stable UUIDs so transaction/FD seeds can reference users
export const USER_IDS = {
  PRIYA: uuidv4(),
  ARJUN: uuidv4(),
  MEERA: uuidv4(),
  RAJAN: uuidv4(),
  VIKRAM: uuidv4(),
} as const

export const WALLET_IDS = {
  PRIYA: uuidv4(),
  ARJUN: uuidv4(),
  MEERA: uuidv4(),
  RAJAN: uuidv4(),
  VIKRAM: uuidv4(),
} as const

const users: UserSeedData[] = [
  {
    // ── Priya Sharma — Power User ──────────────────
    // 6 months old. Heavy Zomato usage (14-18 orders/month).
    // Whitelist rule MUST pass her — same merchant repeatedly.
    // Claude advisor must reference Zomato specifically.
    id: USER_IDS.PRIYA,
    email: 'priya.sharma@email.com',
    name: 'Priya Sharma',
    phone: '+91-98765-43210',
    createdAt: subMonths(now, 6),
    wallet: {
      id: WALLET_IDS.PRIYA,
      availableBalance: 428000,   // ₹4,280.00
      pendingBalance: 34000,      // ₹340.00
      lockedBalance: 200000,      // ₹2,000.00 (2 active FDs)
      lifetimeEarned: 1500000,    // ₹15,000.00
    },
  },
  {
    // ── Arjun Mehta — New User ─────────────────────
    // 5 days old. Only 3 transactions. Below ₹500 FD threshold.
    // New user fraud rule must block spends > ₹2,000.
    // Claude advisor must give onboarding guidance, NOT investment advice.
    id: USER_IDS.ARJUN,
    email: 'arjun.mehta@email.com',
    name: 'Arjun Mehta',
    phone: '+91-98765-43211',
    createdAt: subDays(now, 5),
    wallet: {
      id: WALLET_IDS.ARJUN,
      availableBalance: 18000,    // ₹180.00
      pendingBalance: 9000,       // ₹90.00
      lockedBalance: 0,           // No FDs
      lifetimeEarned: 27000,      // ₹270.00
    },
  },
  {
    // ── Meera Nair — Traveler ──────────────────────
    // 1 year old. Heavy MakeMyTrip with seasonal spikes (Dec/Jan).
    // Claude advisor should recommend liquid balance for travel.
    id: USER_IDS.MEERA,
    email: 'meera.nair@email.com',
    name: 'Meera Nair',
    phone: '+91-98765-43212',
    createdAt: subMonths(now, 12),
    wallet: {
      id: WALLET_IDS.MEERA,
      availableBalance: 310000,   // ₹3,100.00
      pendingBalance: 50000,      // ₹500.00
      lockedBalance: 100000,      // ₹1,000.00 (1 active FD)
      lifetimeEarned: 1200000,    // ₹12,000.00
    },
  },
  {
    // ── Rajan Kumar — Saver ────────────────────────
    // 1.5 years old. Minimal spending, maximum FD investment.
    // Creates FD every time balance hits ₹1,000.
    // 3 active FDs, one maturing within 7 days for advisor alert.
    id: USER_IDS.RAJAN,
    email: 'rajan.kumar@email.com',
    name: 'Rajan Kumar',
    phone: '+91-98765-43213',
    createdAt: subMonths(now, 18),
    wallet: {
      id: WALLET_IDS.RAJAN,
      availableBalance: 62000,    // ₹620.00
      pendingBalance: 20000,      // ₹200.00
      lockedBalance: 500000,      // ₹5,000.00 (3 active FDs)
      lifetimeEarned: 2500000,    // ₹25,000.00
    },
  },
  {
    // ── Vikram Singh — Fraud Case ──────────────────
    // 60 days old. 3 engineered rapid-spend-after-credit events
    // at DIFFERENT merchants each time (no whitelist protection).
    // When a new rapid spend is attempted during demo, OTP must fire.
    id: USER_IDS.VIKRAM,
    email: 'vikram.singh@email.com',
    name: 'Vikram Singh',
    phone: '+91-98765-43214',
    createdAt: subDays(now, 60),
    wallet: {
      id: WALLET_IDS.VIKRAM,
      availableBalance: 150000,   // ₹1,500.00
      pendingBalance: 50000,      // ₹500.00
      lockedBalance: 0,           // No FDs
      lifetimeEarned: 450000,     // ₹4,500.00
    },
  },
]

const DEFAULT_PASSWORD = 'password123'

export async function seedUsers(prisma: PrismaClient): Promise<void> {
  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10)

  for (const userData of users) {
    const { wallet, createdAt, ...userFields } = userData

    await prisma.user.create({
      data: {
        ...userFields,
        passwordHash: hashedPassword,
        createdAt,
        wallet: {
          create: {
            id: wallet.id,
            availableBalance: wallet.availableBalance,
            pendingBalance: wallet.pendingBalance,
            lockedBalance: wallet.lockedBalance,
            lifetimeEarned: wallet.lifetimeEarned,
          },
        },
      },
    })
  }

  console.log(`✅ Seeded ${users.length} users with wallets`)
}
