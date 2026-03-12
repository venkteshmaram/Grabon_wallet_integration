import { PrismaClient } from '@prisma/client'
import { subDays, addDays } from 'date-fns'
import { USER_IDS } from './users'
import { FD_IDS } from './transactions'

// ============================================
// FD RECORDS — Fixed Deposits
// All amounts in PAISA (₹1 = 100 paisa)
// Interest: 7.5% p.a. simple interest
// Formula: maturityAmount = principal * (1 + (7.5 * tenureDays) / 36500)
// ============================================

const now = new Date()

// Helper: Calculate maturity amount using simple interest (paisa precision)
function calcMaturity(principalPaisa: number, tenureDays: number): number {
  return Math.round(principalPaisa * (1 + (7.5 * tenureDays) / 36500))
}

// Helper: Calculate interest earned
function calcInterest(principalPaisa: number, tenureDays: number): number {
  return calcMaturity(principalPaisa, tenureDays) - principalPaisa
}

interface FDSeed {
  id: string
  userId: string
  principal: number
  interestRate: number
  tenureDays: number
  maturityAmount: number
  interestEarned: number
  startDate: Date
  maturityDate: Date
  brokenAt: Date | null
  status: string
  penaltyAmount: number | null
  actualReturn: number | null
}

export async function seedFDs(prisma: PrismaClient): Promise<void> {
  const fds: FDSeed[] = [
    // ── PRIYA — 2 Active FDs ────────────────────────
    {
      // FD1: ₹1,000 locked 90 days ago, 180 day tenure
      id: FD_IDS.PRIYA_FD1,
      userId: USER_IDS.PRIYA,
      principal: 100000,            // ₹1,000 in paisa
      interestRate: 7.5,
      tenureDays: 180,
      maturityAmount: calcMaturity(100000, 180),   // ₹1,036.99
      interestEarned: calcInterest(100000, 180),
      startDate: subDays(now, 90),
      maturityDate: addDays(subDays(now, 90), 180), // 90 days from now
      brokenAt: null,
      status: 'ACTIVE',
      penaltyAmount: null,
      actualReturn: null,
    },
    {
      // FD2: ₹1,000 locked 45 days ago, 120 day tenure
      id: FD_IDS.PRIYA_FD2,
      userId: USER_IDS.PRIYA,
      principal: 100000,
      interestRate: 7.5,
      tenureDays: 120,
      maturityAmount: calcMaturity(100000, 120),   // ₹1,024.66
      interestEarned: calcInterest(100000, 120),
      startDate: subDays(now, 45),
      maturityDate: addDays(subDays(now, 45), 120), // 75 days from now
      brokenAt: null,
      status: 'ACTIVE',
      penaltyAmount: null,
      actualReturn: null,
    },

    // ── MEERA — 1 Active FD ─────────────────────────
    {
      // FD1: ₹1,000 locked 60 days ago, 90 day tenure
      id: FD_IDS.MEERA_FD1,
      userId: USER_IDS.MEERA,
      principal: 100000,
      interestRate: 7.5,
      tenureDays: 90,
      maturityAmount: calcMaturity(100000, 90),    // ₹1,018.49
      interestEarned: calcInterest(100000, 90),
      startDate: subDays(now, 60),
      maturityDate: addDays(subDays(now, 60), 90), // 30 days from now
      brokenAt: null,
      status: 'ACTIVE',
      penaltyAmount: null,
      actualReturn: null,
    },

    // ── RAJAN — 3 Active FDs ────────────────────────
    {
      // FD1: ₹1,500 locked 120 days ago, 180 day tenure
      id: FD_IDS.RAJAN_FD1,
      userId: USER_IDS.RAJAN,
      principal: 150000,
      interestRate: 7.5,
      tenureDays: 180,
      maturityAmount: calcMaturity(150000, 180),
      interestEarned: calcInterest(150000, 180),
      startDate: subDays(now, 120),
      maturityDate: addDays(subDays(now, 120), 180), // 60 days from now
      brokenAt: null,
      status: 'ACTIVE',
      penaltyAmount: null,
      actualReturn: null,
    },
    {
      // FD2: ₹2,000 locked 60 days ago, 90 day tenure
      id: FD_IDS.RAJAN_FD2,
      userId: USER_IDS.RAJAN,
      principal: 200000,
      interestRate: 7.5,
      tenureDays: 90,
      maturityAmount: calcMaturity(200000, 90),
      interestEarned: calcInterest(200000, 90),
      startDate: subDays(now, 60),
      maturityDate: addDays(subDays(now, 60), 90), // 30 days from now
      brokenAt: null,
      status: 'ACTIVE',
      penaltyAmount: null,
      actualReturn: null,
    },
    {
      // FD3: ₹1,500 locked 30 days ago, 35 day tenure
      // ⚠️ MATURES WITHIN 5 DAYS — triggers advisor alert
      id: FD_IDS.RAJAN_FD3,
      userId: USER_IDS.RAJAN,
      principal: 150000,
      interestRate: 7.5,
      tenureDays: 35,
      maturityAmount: calcMaturity(150000, 35),
      interestEarned: calcInterest(150000, 35),
      startDate: subDays(now, 30),
      maturityDate: addDays(subDays(now, 30), 35), // 5 days from now!
      brokenAt: null,
      status: 'ACTIVE',
      penaltyAmount: null,
      actualReturn: null,
    },
  ]

  for (const fd of fds) {
    await prisma.fDRecord.create({ data: fd })
  }

  console.log(`✅ Seeded ${fds.length} FD records`)
  console.log('   - Priya: 2 active FDs (₹1,000 + ₹1,000)')
  console.log('   - Meera: 1 active FD (₹1,000)')
  console.log('   - Rajan: 3 active FDs (₹1,500 + ₹2,000 + ₹1,500)')
  console.log('   - Rajan FD3 matures in ~5 days (advisor alert trigger)')
}
