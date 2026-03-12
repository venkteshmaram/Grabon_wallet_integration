import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'
import {
  subDays,
  subHours,
  subMinutes,
  subSeconds,
  addHours,
  setHours,
  setMinutes,
} from 'date-fns'
import { USER_IDS } from './users'
import { MERCHANT_IDS } from './merchants'

// ============================================
// LEDGER ENTRIES — Source of truth for all balances
// All amounts in PAISA (₹1 = 100 paisa)
//
// IMPORTANT DESIGN NOTE:
// balanceAfter is calculated cumulatively as each entry is built.
// The final balance MUST match the wallet snapshot in users.ts.
// ============================================

interface LedgerSeed {
  id: string
  userId: string
  type: string
  direction: string
  amount: number
  balanceAfter: number
  status: string
  merchantId: string | null
  merchantName: string | null
  category: string | null
  description: string | null
  fdId: string | null
  isFlagged: boolean
  flagReason: string | null
  createdAt: Date
  settledAt: Date | null
}

const now = new Date()

// ============================================
// Helper: Merchant lookup for readable references
// ============================================
interface MerchantRef {
  id: string
  name: string
  category: string
  cashbackRate: number
}

const M: Record<string, MerchantRef> = {
  ZOMATO: { id: MERCHANT_IDS.ZOMATO, name: 'Zomato', category: 'FOOD', cashbackRate: 5.0 },
  SWIGGY: { id: MERCHANT_IDS.SWIGGY, name: 'Swiggy', category: 'FOOD', cashbackRate: 4.5 },
  DOMINOS: { id: MERCHANT_IDS.DOMINOS, name: "Domino's Pizza", category: 'FOOD', cashbackRate: 6.0 },
  BIGBASKET: { id: MERCHANT_IDS.BIGBASKET, name: 'BigBasket', category: 'FOOD', cashbackRate: 3.5 },
  BLINKIT: { id: MERCHANT_IDS.BLINKIT, name: 'Blinkit', category: 'FOOD', cashbackRate: 4.0 },
  MAKEMYTRIP: { id: MERCHANT_IDS.MAKEMYTRIP, name: 'MakeMyTrip', category: 'TRAVEL', cashbackRate: 3.0 },
  CLEARTRIP: { id: MERCHANT_IDS.CLEARTRIP, name: 'Cleartrip', category: 'TRAVEL', cashbackRate: 2.5 },
  IRCTC: { id: MERCHANT_IDS.IRCTC, name: 'IRCTC', category: 'TRAVEL', cashbackRate: 2.0 },
  UBER: { id: MERCHANT_IDS.UBER, name: 'Uber', category: 'TRAVEL', cashbackRate: 3.5 },
  MYNTRA: { id: MERCHANT_IDS.MYNTRA, name: 'Myntra', category: 'SHOPPING', cashbackRate: 4.0 },
  AJIO: { id: MERCHANT_IDS.AJIO, name: 'Ajio', category: 'SHOPPING', cashbackRate: 5.0 },
  AMAZON: { id: MERCHANT_IDS.AMAZON, name: 'Amazon', category: 'SHOPPING', cashbackRate: 2.5 },
  FLIPKART: { id: MERCHANT_IDS.FLIPKART, name: 'Flipkart', category: 'SHOPPING', cashbackRate: 3.0 },
  BOOKMYSHOW: { id: MERCHANT_IDS.BOOKMYSHOW, name: 'BookMyShow', category: 'ENTERTAINMENT', cashbackRate: 2.5 },
  NETFLIX: { id: MERCHANT_IDS.NETFLIX, name: 'Netflix', category: 'ENTERTAINMENT', cashbackRate: 2.0 },
  HOTSTAR: { id: MERCHANT_IDS.HOTSTAR, name: 'Disney+ Hotstar', category: 'ENTERTAINMENT', cashbackRate: 2.0 },
  AIRTEL: { id: MERCHANT_IDS.AIRTEL, name: 'Airtel', category: 'BILLS', cashbackRate: 1.0 },
  JIO: { id: MERCHANT_IDS.JIO, name: 'Jio', category: 'BILLS', cashbackRate: 1.0 },
  NYKAA: { id: MERCHANT_IDS.NYKAA, name: 'Nykaa', category: 'OTHERS', cashbackRate: 3.5 },
  CULTFIT: { id: MERCHANT_IDS.CULTFIT, name: 'Cult.fit', category: 'OTHERS', cashbackRate: 2.0 },
}

// Helper: Build a settled cashback credit entry
function settledCredit(
  userId: string,
  amount: number,
  merchant: MerchantRef,
  createdAt: Date,
  balanceAfter: number,
  description?: string,
): LedgerSeed {
  return {
    id: uuidv4(),
    userId,
    type: 'CASHBACK_CREDIT',
    direction: 'CREDIT',
    amount,
    balanceAfter,
    status: 'SETTLED',
    merchantId: merchant.id,
    merchantName: merchant.name,
    category: merchant.category,
    description: description || `Cashback from ${merchant.name}`,
    fdId: null,
    isFlagged: false,
    flagReason: null,
    createdAt,
    settledAt: addHours(createdAt, 24),
  }
}

// Helper: Build a spend (debit) entry
function spendEntry(
  userId: string,
  amount: number,
  merchant: MerchantRef,
  createdAt: Date,
  balanceAfter: number,
  description?: string,
): LedgerSeed {
  return {
    id: uuidv4(),
    userId,
    type: 'PAYU_SPEND',
    direction: 'DEBIT',
    amount,
    balanceAfter,
    status: 'SETTLED',
    merchantId: merchant.id,
    merchantName: merchant.name,
    category: merchant.category,
    description: description || `Payment to ${merchant.name}`,
    fdId: null,
    isFlagged: false,
    flagReason: null,
    createdAt,
    settledAt: createdAt,
  }
}

// Helper: FD lock entry
function fdLockEntry(
  userId: string,
  amount: number,
  fdId: string,
  createdAt: Date,
  balanceAfter: number,
): LedgerSeed {
  return {
    id: uuidv4(),
    userId,
    type: 'FD_LOCK',
    direction: 'DEBIT',
    amount,
    balanceAfter,
    status: 'SETTLED',
    merchantId: null,
    merchantName: null,
    category: null,
    description: `Locked ₹${(amount / 100).toFixed(2)} in GrabSave FD`,
    fdId,
    isFlagged: false,
    flagReason: null,
    createdAt,
    settledAt: createdAt,
  }
}

// Helper: Flagged spend (for Vikram fraud case)
function flaggedSpend(
  userId: string,
  amount: number,
  merchant: MerchantRef,
  createdAt: Date,
  balanceAfter: number,
  flagReason: string,
): LedgerSeed {
  return {
    id: uuidv4(),
    userId,
    type: 'PAYU_SPEND',
    direction: 'DEBIT',
    amount,
    balanceAfter,
    status: 'HELD',
    merchantId: merchant.id,
    merchantName: merchant.name,
    category: merchant.category,
    description: `Payment to ${merchant.name}`,
    fdId: null,
    isFlagged: true,
    flagReason,
    createdAt,
    settledAt: null,
  }
}

// ============================================
// FD IDs — exported for fds.ts to use
// ============================================
export const FD_IDS = {
  PRIYA_FD1: uuidv4(),
  PRIYA_FD2: uuidv4(),
  MEERA_FD1: uuidv4(),
  RAJAN_FD1: uuidv4(),
  RAJAN_FD2: uuidv4(),
  RAJAN_FD3: uuidv4(),
} as const

// ============================================
// PRIYA SHARMA — Power User (200+ entries, 6 months)
// Heavy Zomato (14-18/month), also Myntra, MakeMyTrip, Swiggy
// WHITELIST CRITICAL: Zomato must appear in 3+ of last 5 spends
// ============================================
function buildPriyaLedger(): LedgerSeed[] {
  const entries: LedgerSeed[] = []
  let balance = 0 // running available balance in paisa
  const userId = USER_IDS.PRIYA

  // Generate 6 months of transactions
  for (let monthsAgo = 6; monthsAgo >= 1; monthsAgo--) {
    const monthBase = subDays(now, monthsAgo * 30)

    // 15 Zomato orders per month (every 2 days, varying times)
    for (let day = 1; day <= 30; day += 2) {
      const orderDate = subDays(monthBase, 30 - day)
      const hour = 12 + (day % 10) // lunch or dinner time (12-22)
      const orderTime = setHours(setMinutes(orderDate, (day * 7) % 60), hour)

      // Order amount: ₹250 to ₹650 range
      const orderAmount = (25000 + ((day * monthsAgo * 137) % 40000))
      const cashbackAmount = Math.round(orderAmount * M.ZOMATO.cashbackRate / 100)

      balance += cashbackAmount
      entries.push(settledCredit(userId, cashbackAmount, M.ZOMATO, orderTime, balance))
    }

    // 3 Myntra orders per month
    for (let i = 0; i < 3; i++) {
      const shopDate = setHours(subDays(monthBase, 30 - (i * 10 + 3)), 15 + i)
      const orderAmount = (150000 + ((i * monthsAgo * 293) % 200000)) // ₹1500-₹3500
      const cashbackAmount = Math.round(orderAmount * M.MYNTRA.cashbackRate / 100)

      balance += cashbackAmount
      entries.push(settledCredit(userId, cashbackAmount, M.MYNTRA, shopDate, balance))
    }

    // 2 Swiggy orders per month
    for (let i = 0; i < 2; i++) {
      const swiggyDate = setHours(subDays(monthBase, 30 - (i * 14 + 5)), 20 + i)
      const orderAmount = (20000 + ((i * monthsAgo * 191) % 30000))
      const cashbackAmount = Math.round(orderAmount * M.SWIGGY.cashbackRate / 100)

      balance += cashbackAmount
      entries.push(settledCredit(userId, cashbackAmount, M.SWIGGY, swiggyDate, balance))
    }

    // 1 MakeMyTrip per month (travel)
    const travelDate = setHours(subDays(monthBase, 15), 10)
    const travelAmount = (300000 + ((monthsAgo * 571) % 500000)) // ₹3000-₹8000
    const travelCashback = Math.round(travelAmount * M.MAKEMYTRIP.cashbackRate / 100)
    balance += travelCashback
    entries.push(settledCredit(userId, travelCashback, M.MAKEMYTRIP, travelDate, balance))

    // 1 Airtel bill per month
    const billDate = setHours(subDays(monthBase, 1), 9)
    const billCashback = Math.round(49900 * M.AIRTEL.cashbackRate / 100) // ₹499 recharge
    balance += billCashback
    entries.push(settledCredit(userId, billCashback, M.AIRTEL, billDate, balance))

    // Spend some each month (Zomato spends — IMPORTANT for whitelist)
    for (let i = 0; i < 4; i++) {
      const spendDate = setHours(subDays(monthBase, 30 - (i * 7 + 2)), 19 + (i % 3))
      const spendAmount = (15000 + ((i * monthsAgo * 113) % 25000))
      if (balance >= spendAmount) {
        balance -= spendAmount
        entries.push(spendEntry(userId, spendAmount, M.ZOMATO, spendDate, balance))
      }
    }

    // 1 Myntra spend per month  
    const myntraSpendDate = setHours(subDays(monthBase, 12), 16)
    const myntraSpendAmount = (80000 + ((monthsAgo * 311) % 120000))
    if (balance >= myntraSpendAmount) {
      balance -= myntraSpendAmount
      entries.push(spendEntry(userId, myntraSpendAmount, M.MYNTRA, myntraSpendDate, balance))
    }
  }

  // FD Locks — 2 FDs of ₹1,000 each
  const fd1Date = subDays(now, 90)
  const fd1Amount = 100000 // ₹1,000
  if (balance >= fd1Amount) {
    balance -= fd1Amount
    entries.push(fdLockEntry(userId, fd1Amount, FD_IDS.PRIYA_FD1, fd1Date, balance))
  }

  const fd2Date = subDays(now, 45)
  const fd2Amount = 100000 // ₹1,000
  if (balance >= fd2Amount) {
    balance -= fd2Amount
    entries.push(fdLockEntry(userId, fd2Amount, FD_IDS.PRIYA_FD2, fd2Date, balance))
  }

  // Final recent Zomato spends — CRITICAL for whitelist
  // Last 5 spends must have Zomato in at least 3 positions
  const recentSpends = [
    { merchant: M.ZOMATO, daysAgo: 1, amount: 35000 },
    { merchant: M.ZOMATO, daysAgo: 2, amount: 28000 },
    { merchant: M.MYNTRA, daysAgo: 3, amount: 95000 },
    { merchant: M.ZOMATO, daysAgo: 4, amount: 42000 },
    { merchant: M.SWIGGY, daysAgo: 5, amount: 31000 },
  ]

  for (const s of recentSpends) {
    const d = setHours(subDays(now, s.daysAgo), 19)
    if (balance >= s.amount) {
      balance -= s.amount
      entries.push(spendEntry(userId, s.amount, s.merchant, d, balance))
    }
  }

  // Adjust final balance to match wallet snapshot (₹4,280 = 428000 paisa)
  // Add a "correction" cashback credit to match target
  const targetAvailable = 428000
  if (balance !== targetAvailable) {
    const diff = targetAvailable - balance
    if (diff > 0) {
      balance = targetAvailable
      entries.push(settledCredit(
        userId, diff, M.ZOMATO,
        setHours(subDays(now, 1), 12),
        balance,
        'Monthly bonus cashback from Zomato',
      ))
    }
  }

  return entries
}

// ============================================
// ARJUN MEHTA — New User (3 entries, 5 days old)
// Below FD threshold. New user fraud rule active.
// ============================================
function buildArjunLedger(): LedgerSeed[] {
  const entries: LedgerSeed[] = []
  let balance = 0
  const userId = USER_IDS.ARJUN

  // Transaction 1: First cashback — ₹120 from Amazon, 4 days ago
  const t1Amount = 12000
  balance += t1Amount
  entries.push(settledCredit(
    userId, t1Amount, M.AMAZON,
    setHours(subDays(now, 4), 14),
    balance,
    'Welcome cashback from Amazon',
  ))

  // Transaction 2: Small Swiggy cashback — ₹60, 2 days ago
  const t2Amount = 6000
  balance += t2Amount
  entries.push(settledCredit(
    userId, t2Amount, M.SWIGGY,
    setHours(subDays(now, 2), 20),
    balance,
    'Cashback from Swiggy order',
  ))

  // Transaction 3: Zomato cashback — ₹90, 1 day ago (SETTLED)
  const t3Amount = 9000
  balance += t3Amount
  entries.push(settledCredit(
    userId, t3Amount, M.ZOMATO,
    setHours(subDays(now, 1), 13),
    balance,
    'Cashback from Zomato order',
  ))

  // Small spend to bring balance to ₹180
  const spendAmount = balance - 18000
  if (spendAmount > 0) {
    balance -= spendAmount
    entries.push(spendEntry(
      userId, spendAmount, M.SWIGGY,
      setHours(subDays(now, 1), 21),
      balance,
      'Dinner on Swiggy',
    ))
  }

  return entries
}

// ============================================
// MEERA NAIR — Traveler (80+ entries, 1 year)
// Heavy MakeMyTrip in Dec/Jan. Diverse merchants.
// ============================================
function buildMeeraLedger(): LedgerSeed[] {
  const entries: LedgerSeed[] = []
  let balance = 0
  const userId = USER_IDS.MEERA

  for (let monthsAgo = 12; monthsAgo >= 1; monthsAgo--) {
    const monthBase = subDays(now, monthsAgo * 30)

    // Determine if Dec/Jan travel season (heavy MakeMyTrip)
    const currentMonth = new Date(monthBase).getMonth()
    const isTravelSeason = currentMonth === 11 || currentMonth === 0 // Dec or Jan

    // MakeMyTrip — 4-5 in travel season, 1 otherwise
    const travelCount = isTravelSeason ? 5 : 1
    for (let i = 0; i < travelCount; i++) {
      const travelDate = setHours(subDays(monthBase, 30 - (i * 6 + 2)), 11)
      const travelAmount = isTravelSeason
        ? (500000 + ((i * monthsAgo * 419) % 1000000)) // ₹5000-₹15000 in season
        : (200000 + ((monthsAgo * 317) % 300000))       // ₹2000-₹5000 off season
      const cashback = Math.round(travelAmount * M.MAKEMYTRIP.cashbackRate / 100)
      balance += cashback
      entries.push(settledCredit(userId, cashback, M.MAKEMYTRIP, travelDate, balance))
    }

    // Cleartrip — 1-2 per month in season
    if (isTravelSeason) {
      for (let i = 0; i < 2; i++) {
        const d = setHours(subDays(monthBase, 20 - i * 8), 15)
        const amt = (300000 + ((i * monthsAgo * 251) % 400000))
        const cb = Math.round(amt * M.CLEARTRIP.cashbackRate / 100)
        balance += cb
        entries.push(settledCredit(userId, cb, M.CLEARTRIP, d, balance))
      }
    }

    // Regular: 3 Zomato per month
    for (let i = 0; i < 3; i++) {
      const d = setHours(subDays(monthBase, 30 - (i * 9 + 1)), 19 + i)
      const amt = (25000 + ((i * monthsAgo * 163) % 35000))
      const cb = Math.round(amt * M.ZOMATO.cashbackRate / 100)
      balance += cb
      entries.push(settledCredit(userId, cb, M.ZOMATO, d, balance))
    }

    // 1 Netflix per month
    const netflixDate = setHours(subDays(monthBase, 5), 22)
    const netflixCb = Math.round(64900 * M.NETFLIX.cashbackRate / 100)
    balance += netflixCb
    entries.push(settledCredit(userId, netflixCb, M.NETFLIX, netflixDate, balance))

    // 1 Uber per month
    const uberDate = setHours(subDays(monthBase, 10), 8)
    const uberAmt = (15000 + ((monthsAgo * 89) % 25000))
    const uberCb = Math.round(uberAmt * M.UBER.cashbackRate / 100)
    balance += uberCb
    entries.push(settledCredit(userId, uberCb, M.UBER, uberDate, balance))

    // Spends — 2 per month
    for (let i = 0; i < 2; i++) {
      const spendDate = setHours(subDays(monthBase, 30 - (i * 14 + 7)), 17)
      const spendAmt = (20000 + ((i * monthsAgo * 197) % 60000))
      if (balance >= spendAmt) {
        balance -= spendAmt
        entries.push(spendEntry(userId, spendAmt, M.MAKEMYTRIP, spendDate, balance))
      }
    }
  }

  // FD Lock — 1 FD of ₹1,000
  const fdDate = subDays(now, 60)
  const fdAmount = 100000
  if (balance >= fdAmount) {
    balance -= fdAmount
    entries.push(fdLockEntry(userId, fdAmount, FD_IDS.MEERA_FD1, fdDate, balance))
  }

  // Adjust to target ₹3,100 = 310000 paisa
  const targetAvailable = 310000
  if (balance !== targetAvailable) {
    const diff = targetAvailable - balance
    if (diff > 0) {
      balance = targetAvailable
      entries.push(settledCredit(userId, diff, M.MAKEMYTRIP,
        setHours(subDays(now, 1), 10), balance,
        'Travel rewards bonus'))
    } else if (diff < 0) {
      const spendDiff = Math.abs(diff)
      balance = targetAvailable
      entries.push(spendEntry(userId, spendDiff, M.UBER,
        setHours(subDays(now, 1), 18), balance,
        'Airport cab ride'))
    }
  }

  return entries
}

// ============================================
// RAJAN KUMAR — Saver (60+ entries, 1.5 years)
// Minimal spending. Creates FD every time balance hits ₹1,000.
// 3 active FDs. One matures within 7 days.
// ============================================
function buildRajanLedger(): LedgerSeed[] {
  const entries: LedgerSeed[] = []
  let balance = 0
  const userId = USER_IDS.RAJAN

  for (let monthsAgo = 18; monthsAgo >= 1; monthsAgo--) {
    const monthBase = subDays(now, monthsAgo * 30)

    // Rajan earns steady cashback but rarely spends
    // 4 transactions per month from different sources

    // BigBasket grocery (weekly)
    for (let i = 0; i < 4; i++) {
      const d = setHours(subDays(monthBase, 30 - (i * 7)), 10)
      const amt = (100000 + ((i * monthsAgo * 127) % 80000)) // ₹1000-₹1800 grocery
      const cb = Math.round(amt * M.BIGBASKET.cashbackRate / 100)
      balance += cb
      entries.push(settledCredit(userId, cb, M.BIGBASKET, d, balance))
    }

    // 1 Flipkart purchase per month
    const flipDate = setHours(subDays(monthBase, 15), 14)
    const flipAmt = (200000 + ((monthsAgo * 373) % 300000))
    const flipCb = Math.round(flipAmt * M.FLIPKART.cashbackRate / 100)
    balance += flipCb
    entries.push(settledCredit(userId, flipCb, M.FLIPKART, flipDate, balance))

    // 1 Airtel bill per month
    const airtelDate = setHours(subDays(monthBase, 3), 9)
    const airtelCb = Math.round(69900 * M.AIRTEL.cashbackRate / 100)
    balance += airtelCb
    entries.push(settledCredit(userId, airtelCb, M.AIRTEL, airtelDate, balance))

    // Very occasional small spend (1 every 3 months)
    if (monthsAgo % 3 === 0) {
      const spendDate = setHours(subDays(monthBase, 20), 19)
      const spendAmt = (10000 + ((monthsAgo * 83) % 15000))
      if (balance >= spendAmt) {
        balance -= spendAmt
        entries.push(spendEntry(userId, spendAmt, M.AMAZON, spendDate, balance))
      }
    }
  }

  // 3 FD Locks at different times
  // FD1: ₹1,500 locked 200 days ago (90 day tenure — already would have matured,
  //       but we'll set it as a longer tenure for demo)
  const fd1Date = subDays(now, 120)
  const fd1Amount = 150000
  if (balance >= fd1Amount) {
    balance -= fd1Amount
    entries.push(fdLockEntry(userId, fd1Amount, FD_IDS.RAJAN_FD1, fd1Date, balance))
  }

  // FD2: ₹2,000 locked 60 days ago
  const fd2Date = subDays(now, 60)
  const fd2Amount = 200000
  if (balance >= fd2Amount) {
    balance -= fd2Amount
    entries.push(fdLockEntry(userId, fd2Amount, FD_IDS.RAJAN_FD2, fd2Date, balance))
  }

  // FD3: ₹1,500 locked 30 days ago (short tenure — matures within 7 days for alert)
  const fd3Date = subDays(now, 30)
  const fd3Amount = 150000
  if (balance >= fd3Amount) {
    balance -= fd3Amount
    entries.push(fdLockEntry(userId, fd3Amount, FD_IDS.RAJAN_FD3, fd3Date, balance))
  }

  // Adjust to target ₹620 = 62000 paisa
  const targetAvailable = 62000
  if (balance !== targetAvailable) {
    const diff = targetAvailable - balance
    if (diff > 0) {
      balance = targetAvailable
      entries.push(settledCredit(userId, diff, M.BIGBASKET,
        setHours(subDays(now, 1), 10), balance,
        'Loyalty bonus cashback'))
    } else if (diff < 0) {
      balance = targetAvailable
      entries.push(spendEntry(userId, Math.abs(diff), M.AMAZON,
        setHours(subDays(now, 1), 15), balance,
        'Amazon essentials order'))
    }
  }

  return entries
}

// ============================================
// VIKRAM SINGH — Fraud Case (20 entries, 60 days)
// 3 engineered rapid-spend-after-credit at DIFFERENT merchants
// Whitelist MUST NOT protect him
// ============================================
function buildVikramLedger(): LedgerSeed[] {
  const entries: LedgerSeed[] = []
  let balance = 0
  const userId = USER_IDS.VIKRAM

  // Regular cashback earnings spread across 60 days
  const normalCredits = [
    { merchant: M.AMAZON, daysAgo: 55, amount: 50000 },
    { merchant: M.FLIPKART, daysAgo: 50, amount: 45000 },
    { merchant: M.ZOMATO, daysAgo: 45, amount: 15000 },
    { merchant: M.SWIGGY, daysAgo: 42, amount: 12000 },
    { merchant: M.MYNTRA, daysAgo: 38, amount: 60000 },
    { merchant: M.BIGBASKET, daysAgo: 35, amount: 20000 },
    { merchant: M.AIRTEL, daysAgo: 30, amount: 5000 },
    { merchant: M.UBER, daysAgo: 27, amount: 8000 },
    { merchant: M.BOOKMYSHOW, daysAgo: 22, amount: 15000 },
    { merchant: M.NYKAA, daysAgo: 18, amount: 25000 },
    { merchant: M.FLIPKART, daysAgo: 14, amount: 35000 },
    { merchant: M.ZOMATO, daysAgo: 10, amount: 18000 },
    { merchant: M.AMAZON, daysAgo: 7, amount: 40000 },
  ]

  for (const c of normalCredits) {
    balance += c.amount
    entries.push(settledCredit(
      userId, c.amount, c.merchant,
      setHours(subDays(now, c.daysAgo), 14), balance,
    ))
  }

  // Some normal spends (different merchants — NOT building whitelist)
  const normalSpends = [
    { merchant: M.AMAZON, daysAgo: 48, amount: 30000 },
    { merchant: M.SWIGGY, daysAgo: 40, amount: 8000 },
    { merchant: M.ZOMATO, daysAgo: 33, amount: 12000 },
    { merchant: M.FLIPKART, daysAgo: 25, amount: 20000 },
  ]

  for (const s of normalSpends) {
    if (balance >= s.amount) {
      balance -= s.amount
      entries.push(spendEntry(
        userId, s.amount, s.merchant,
        setHours(subDays(now, s.daysAgo), 18), balance,
      ))
    }
  }

  // ── ENGINEERED FRAUD ENTRIES ─────────────────────
  // 3 rapid credit → spend pairs at DIFFERENT merchants within 60 seconds
  // These are historical — they were flagged but released (for demonstration)

  // Fraud Event 1: Credit from Myntra, spend at Flipkart 45 seconds later
  const fraud1CreditTime = setHours(subDays(now, 20), 23) // late night
  const fraud1Credit = 30000
  balance += fraud1Credit
  entries.push(settledCredit(userId, fraud1Credit, M.MYNTRA, fraud1CreditTime, balance))

  const fraud1SpendTime = subSeconds(addHours(fraud1CreditTime, 0), -45) // 45 sec after
  // Actually: addSeconds(fraud1CreditTime, 45)
  const fraud1SpendTimeFixed = new Date(fraud1CreditTime.getTime() + 45 * 1000)
  const fraud1Spend = 25000
  if (balance >= fraud1Spend) {
    balance -= fraud1Spend
    entries.push({
      ...flaggedSpend(userId, fraud1Spend, M.FLIPKART, fraud1SpendTimeFixed, balance,
        'Speed rule: spend within 90s of credit'),
      status: 'SETTLED', // was released after OTP
      settledAt: new Date(fraud1SpendTimeFixed.getTime() + 300 * 1000), // 5 min later
    })
  }

  // Fraud Event 2: Credit from Amazon, spend at BigBasket 30 seconds later
  const fraud2CreditTime = setHours(subDays(now, 12), 2) // 2 AM (also night rule)
  const fraud2Credit = 35000
  balance += fraud2Credit
  entries.push(settledCredit(userId, fraud2Credit, M.AMAZON, fraud2CreditTime, balance))

  const fraud2SpendTime = new Date(fraud2CreditTime.getTime() + 30 * 1000)
  const fraud2Spend = 28000
  if (balance >= fraud2Spend) {
    balance -= fraud2Spend
    entries.push({
      ...flaggedSpend(userId, fraud2Spend, M.BIGBASKET, fraud2SpendTime, balance,
        'Speed rule + Night rule: spend within 90s of credit during quiet hours'),
      status: 'SETTLED',
      settledAt: new Date(fraud2SpendTime.getTime() + 180 * 1000),
    })
  }

  // Fraud Event 3: Credit from Uber, spend at BookMyShow 55 seconds later
  const fraud3CreditTime = setHours(subDays(now, 5), 15)
  const fraud3Credit = 20000
  balance += fraud3Credit
  entries.push(settledCredit(userId, fraud3Credit, M.UBER, fraud3CreditTime, balance))

  const fraud3SpendTime = new Date(fraud3CreditTime.getTime() + 55 * 1000)
  const fraud3Spend = 18000
  if (balance >= fraud3Spend) {
    balance -= fraud3Spend
    entries.push({
      ...flaggedSpend(userId, fraud3Spend, M.BOOKMYSHOW, fraud3SpendTime, balance,
        'Speed rule: spend within 90s of credit'),
      status: 'SETTLED',
      settledAt: new Date(fraud3SpendTime.getTime() + 240 * 1000),
    })
  }

  // Adjust to target ₹1,500 = 150000 paisa
  const targetAvailable = 150000
  if (balance !== targetAvailable) {
    const diff = targetAvailable - balance
    if (diff > 0) {
      balance = targetAvailable
      entries.push(settledCredit(userId, diff, M.AMAZON,
        setHours(subDays(now, 1), 14), balance,
        'Refund cashback'))
    } else if (diff < 0) {
      balance = targetAvailable
      entries.push(spendEntry(userId, Math.abs(diff), M.ZOMATO,
        setHours(subDays(now, 1), 20), balance,
        'Dinner on Zomato'))
    }
  }

  return entries
}

// ============================================
// MAIN EXPORT
// ============================================
export async function seedTransactions(prisma: PrismaClient): Promise<void> {
  const allEntries: LedgerSeed[] = [
    ...buildPriyaLedger(),
    ...buildArjunLedger(),
    ...buildMeeraLedger(),
    ...buildRajanLedger(),
    ...buildVikramLedger(),
  ]

  // Sort all entries by createdAt to ensure insertion order
  allEntries.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())

  // Batch insert for performance
  const batchSize = 50
  for (let i = 0; i < allEntries.length; i += batchSize) {
    const batch = allEntries.slice(i, i + batchSize)
    await prisma.ledgerEntry.createMany({
      data: batch,
    })
  }

  console.log(`✅ Seeded ${allEntries.length} ledger entries`)

  // Log per-user counts
  const userCounts: Record<string, number> = {}
  for (const e of allEntries) {
    userCounts[e.userId] = (userCounts[e.userId] || 0) + 1
  }
  console.log('   Per-user breakdown:')
  console.log(`   - Priya:  ${userCounts[USER_IDS.PRIYA] || 0} entries`)
  console.log(`   - Arjun:  ${userCounts[USER_IDS.ARJUN] || 0} entries`)
  console.log(`   - Meera:  ${userCounts[USER_IDS.MEERA] || 0} entries`)
  console.log(`   - Rajan:  ${userCounts[USER_IDS.RAJAN] || 0} entries`)
  console.log(`   - Vikram: ${userCounts[USER_IDS.VIKRAM] || 0} entries`)
}
