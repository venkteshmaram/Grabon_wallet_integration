import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { seedUsers } from './users'
import { seedMerchants } from './merchants'
import { seedTransactions } from './transactions'
import { seedFDs } from './fds'
import { seedCashback } from './cashback'

// ============================================
// SEED ORCHESTRATOR
// Run: npx prisma db seed
//
// Order matters — foreign keys require:
// 1. Delete in reverse dependency order
// 2. Seed in forward dependency order
//
// Idempotent: safe to run multiple times
// ============================================

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main(): Promise<void> {
  console.log('🌱 Starting seed...')
  console.log('─'.repeat(50))

  // ── STEP 1: Clear existing data ─────────────────
  // Order: deepest dependencies first
  console.log('🗑️  Clearing existing data...')
  await prisma.advisorRecommendation.deleteMany()
  await prisma.oTPVerification.deleteMany()
  await prisma.ledgerEntry.deleteMany()
  await prisma.fDRecord.deleteMany()
  await prisma.wallet.deleteMany()
  await prisma.user.deleteMany()
  await prisma.merchant.deleteMany()
  console.log('   Done\n')

  // ── STEP 2: Seed in dependency order ────────────
  await seedMerchants(prisma)
  await seedUsers(prisma)
  await seedTransactions(prisma)
  await seedFDs(prisma)
  await seedCashback(prisma)

  // ── STEP 3: Verification summary ────────────────
  console.log('\n' + '─'.repeat(50))
  console.log('📊 Verification:')

  const userCount = await prisma.user.count()
  const walletCount = await prisma.wallet.count()
  const ledgerCount = await prisma.ledgerEntry.count()
  const fdCount = await prisma.fDRecord.count()
  const merchantCount = await prisma.merchant.count()
  const pendingCount = await prisma.ledgerEntry.count({
    where: { status: 'PENDING' },
  })

  console.log(`   Users:      ${userCount}`)
  console.log(`   Wallets:    ${walletCount}`)
  console.log(`   Ledger:     ${ledgerCount} entries (${pendingCount} pending)`)
  console.log(`   FDs:        ${fdCount} active`)
  console.log(`   Merchants:  ${merchantCount}`)
  console.log('─'.repeat(50))
  console.log('✅ Seed complete!\n')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
