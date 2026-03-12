import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'
import { subHours, subMinutes } from 'date-fns'
import { USER_IDS } from './users'
import { MERCHANT_IDS } from './merchants'

// ============================================
// PENDING CASHBACK — Entries not yet settled (< 24 hours old)
// These represent the pendingBalance for each user's wallet.
// All amounts in PAISA.
//
// The settlement cron job will find these and move them
// from pending → available after 24 hours.
// ============================================

const now = new Date()

interface PendingCashbackSeed {
  id: string
  userId: string
  type: string
  direction: string
  amount: number
  balanceAfter: number
  status: string
  merchantId: string
  merchantName: string
  category: string
  description: string
  fdId: null
  isFlagged: boolean
  flagReason: null
  createdAt: Date
  settledAt: null
}

function pendingEntry(
  userId: string,
  amount: number,
  merchantId: string,
  merchantName: string,
  category: string,
  createdAt: Date,
  balanceAfter: number,
): PendingCashbackSeed {
  return {
    id: uuidv4(),
    userId,
    type: 'CASHBACK_CREDIT',
    direction: 'CREDIT',
    amount,
    balanceAfter,
    status: 'PENDING',
    merchantId,
    merchantName,
    category,
    description: `Pending cashback from ${merchantName}`,
    fdId: null,
    isFlagged: false,
    flagReason: null,
    createdAt,
    settledAt: null,
  }
}

export async function seedCashback(prisma: PrismaClient): Promise<void> {
  const entries: PendingCashbackSeed[] = []

  // ── PRIYA — ₹340 pending (34000 paisa) ─────────
  // 2 recent Zomato orders that haven't settled yet
  // Available: 428000, these add to pending
  entries.push(pendingEntry(
    USER_IDS.PRIYA,
    19000,                        // ₹190 cashback
    MERCHANT_IDS.ZOMATO,
    'Zomato',
    'FOOD',
    subHours(now, 8),             // 8 hours ago — not yet 24h
    428000 + 19000,               // available + this pending
  ))

  entries.push(pendingEntry(
    USER_IDS.PRIYA,
    15000,                        // ₹150 cashback
    MERCHANT_IDS.SWIGGY,
    'Swiggy',
    'FOOD',
    subHours(now, 3),             // 3 hours ago
    428000 + 19000 + 15000,
  ))

  // Total Priya pending: 19000 + 15000 = 34000 ✓

  // ── ARJUN — ₹90 pending (9000 paisa) ───────────
  // 1 recent order
  entries.push(pendingEntry(
    USER_IDS.ARJUN,
    9000,                         // ₹90 cashback
    MERCHANT_IDS.ZOMATO,
    'Zomato',
    'FOOD',
    subHours(now, 6),
    18000 + 9000,
  ))

  // Total Arjun pending: 9000 ✓

  // ── MEERA — ₹500 pending (50000 paisa) ──────────
  // 1 MakeMyTrip booking + 1 Uber ride
  entries.push(pendingEntry(
    USER_IDS.MEERA,
    38000,                        // ₹380 from MakeMyTrip
    MERCHANT_IDS.MAKEMYTRIP,
    'MakeMyTrip',
    'TRAVEL',
    subHours(now, 12),
    310000 + 38000,
  ))

  entries.push(pendingEntry(
    USER_IDS.MEERA,
    12000,                        // ₹120 from Uber
    MERCHANT_IDS.UBER,
    'Uber',
    'TRAVEL',
    subHours(now, 5),
    310000 + 38000 + 12000,
  ))

  // Total Meera pending: 38000 + 12000 = 50000 ✓

  // ── RAJAN — ₹200 pending (20000 paisa) ──────────
  // 1 BigBasket grocery run
  entries.push(pendingEntry(
    USER_IDS.RAJAN,
    20000,                        // ₹200 from BigBasket
    MERCHANT_IDS.BIGBASKET,
    'BigBasket',
    'FOOD',
    subHours(now, 10),
    62000 + 20000,
  ))

  // Total Rajan pending: 20000 ✓

  // ── VIKRAM — ₹500 pending (50000 paisa) ─────────
  // 2 recent credits — one very recent (for demo fraud trigger)
  entries.push(pendingEntry(
    USER_IDS.VIKRAM,
    30000,                        // ₹300 from Amazon
    MERCHANT_IDS.AMAZON,
    'Amazon',
    'SHOPPING',
    subHours(now, 15),
    150000 + 30000,
  ))

  entries.push(pendingEntry(
    USER_IDS.VIKRAM,
    20000,                        // ₹200 from Flipkart
    MERCHANT_IDS.FLIPKART,
    'Flipkart',
    'SHOPPING',
    subMinutes(now, 30),          // ⚡ Only 30 minutes ago — speed rule can trigger
    150000 + 30000 + 20000,
  ))

  // Total Vikram pending: 30000 + 20000 = 50000 ✓

  // Insert all pending entries
  await prisma.ledgerEntry.createMany({ data: entries })

  console.log(`✅ Seeded ${entries.length} pending cashback entries`)
  console.log('   Pending balances:')
  console.log('   - Priya:  ₹340.00')
  console.log('   - Arjun:  ₹90.00')
  console.log('   - Meera:  ₹500.00')
  console.log('   - Rajan:  ₹200.00')
  console.log('   - Vikram: ₹500.00 (latest: 30 min ago — speed rule ready)')
}
