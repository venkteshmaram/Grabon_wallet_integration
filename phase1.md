# Phase 1 — Foundation Setup

> Complete these 7 steps before writing any business logic. No exceptions.

---

## Step 1: Dependencies

Install everything upfront. No mid-build surprises.

```bash
cd grabcash-wallet

# Core Next.js + React
npm install next@14 react@18 react-dom@18

# TypeScript
npm install -D typescript @types/node @types/react @types/react-dom

# Styling
npm install tailwindcss postcss autoprefixer
npm install -D @tailwindcss/typography

# Prisma ORM
npm install prisma @prisma/client
npm install -D ts-node

# Validation
npm install zod

# Authentication
npm install jsonwebtoken
npm install -D @types/jsonwebtoken
npm install bcryptjs
npm install -D @types/bcryptjs

# HTTP Client
npm install axios

# State Management
npm install zustand

# Date Handling
npm install date-fns

# Charts
npm install recharts

# UI Components (shadcn/ui base)
npm install class-variance-authority clsx tailwind-merge
npm install lucide-react

# Utilities
npm install uuid
npm install -D @types/uuid

# Testing
npm install -D jest @testing-library/react @testing-library/jest-dom @types/jest

# Cron Jobs
npm install node-cron
npm install -D @types/node-cron

# Logging
npm install winston
```

---

## Step 2: .env.example

Fill all keys before writing a single service. Copy to `.env.local` and add real values.

```env
# ============================================
# DATABASE
# ============================================
DATABASE_URL="file:./dev.db"

# ============================================
# AUTHENTICATION (JWT)
# ============================================
JWT_SECRET="your-super-secret-jwt-key-min-32-chars-long"
JWT_EXPIRY="24h"

# ============================================
# ANTHROPIC CLAUDE API
# Get from: console.anthropic.com
# Model: claude-sonnet-4-20250514
# ============================================
ANTHROPIC_API_KEY="sk-ant-api03-..."

# ============================================
# PAYU SANDBOX
# Get from: developer.payumoney.com → Test Merchant Account
# ============================================
PAYU_KEY="your-payu-test-key"
PAYU_SALT="your-payu-test-salt"
PAYU_BASE_URL="https://test.payu.in/_payment"

# Callback URLs - MUST use public HTTPS URL (PayU rejects localhost)
# Use ngrok to create a public tunnel to your local dev server:
#   1. Install ngrok: https://ngrok.com/download
#   2. Start your dev server: npm run dev (on port 3000)
#   3. In another terminal: ngrok http 3000
#   4. Copy the https URL (e.g., https://abc123.ngrok.io)
#   5. Update URLs below with your ngrok URL
# IMPORTANT: Update these every time you restart ngrok (URL changes)
PAYU_SUCCESS_URL="https://your-ngrok-url.ngrok.io/api/payu/success"
PAYU_FAILURE_URL="https://your-ngrok-url.ngrok.io/api/payu/failure"

# ============================================
# APP CONFIG
# ============================================
NODE_ENV="development"
PORT="3000"
APP_URL="http://localhost:3000"

# ============================================
# FRAUD DETECTION CONFIG
# ============================================
FRAUD_SPEED_THRESHOLD_SECONDS="90"
FRAUD_AMOUNT_THRESHOLD_PERCENT="80"
FRAUD_FREQUENCY_WINDOW_MINUTES="5"
FRAUD_FREQUENCY_THRESHOLD="3"
FRAUD_NEW_USER_DAYS="7"
FRAUD_NEW_USER_AMOUNT="2000"
FRAUD_NIGHT_HOUR_START="1"
FRAUD_NIGHT_HOUR_END="4"
FRAUD_NIGHT_AMOUNT="2000"

# ============================================
# FD CONFIG
# ============================================
FD_MIN_AMOUNT="500"
FD_MIN_TENURE_DAYS="30"
FD_MAX_TENURE_DAYS="365"
FD_INTEREST_RATE="7.5"
FD_EARLY_BREAK_LOCK_DAYS="7"
FD_PREMATURE_PENALTY_PERCENT="1"

# ============================================
# CASHBACK CONFIG
# ============================================
CASHBACK_SETTLEMENT_HOURS="24"
```

---

## Step 3: Prisma Schema

All models defined before any service touches DB. Financial amounts use Decimal(10,2).

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

// ============================================
// USER & AUTH
// ============================================
model User {
  id            String   @id @default(uuid())
  email         String   @unique
  phone         String?
  name          String
  passwordHash  String   @map("password_hash")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  // Relations
  wallet        Wallet?
  ledgerEntries LedgerEntry[]
  fds           FDRecord[]
  recommendations AdvisorRecommendation[]

  @@map("users")
}

// ============================================
// WALLET (Four Balance States)
// ============================================
// SNAPSHOT APPROACH: Balance stored for fast reads, but EVERY transaction
// must atomically update BOTH Wallet (snapshot) AND LedgerEntry (audit).
// If either fails, both roll back. This keeps them always in sync.
// ============================================
model Wallet {
  id                String   @id @default(uuid())
  userId            String   @unique @map("user_id")
  
  // Snapshot balances — fast to read, always atomically updated with ledger
  availableBalance  Decimal  @map("available_balance") @db.Decimal(10, 2)
  pendingBalance    Decimal  @map("pending_balance") @db.Decimal(10, 2)
  lockedBalance     Decimal  @map("locked_balance") @db.Decimal(10, 2)
  lifetimeEarned    Decimal  @map("lifetime_earned") @db.Decimal(10, 2)
  
  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")

  // Relations
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("wallets")
}

// ============================================
// LEDGER (Source of Truth)
// ============================================
model LedgerEntry {
  id              String        @id @default(uuid())
  userId          String        @map("user_id")
  
  // Transaction Details
  type            TransactionType
  direction       Direction     // CREDIT or DEBIT
  amount          Decimal       @db.Decimal(10, 2)
  
  // Balance snapshot at moment of transaction
  balanceAfter    Decimal       @map("balance_after") @db.Decimal(10, 2)
  
  // Status for pending/settled flows
  status          LedgerStatus  @default(PENDING)
  
  // Context
  merchantId      String?       @map("merchant_id")
  merchantName    String?       @map("merchant_name")
  category        String?
  description     String?
  
  // FD Reference (if applicable)
  fdId            String?       @map("fd_id")
  
  // Fraud Detection
  isFlagged       Boolean       @default(false) @map("is_flagged")
  flagReason      String?       @map("flag_reason")
  
  // Timestamps
  createdAt       DateTime      @default(now()) @map("created_at")
  settledAt       DateTime?     @map("settled_at")

  // Relations
  user            User          @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([type])
  @@index([status])
  @@index([createdAt])
  @@map("ledger_entries")
}

enum TransactionType {
  CASHBACK_CREDIT
  CASHBACK_SETTLEMENT
  PAYU_SPEND
  FD_LOCK
  FD_UNLOCK
  FD_INTEREST
  FRAUD_HOLD
  FRAUD_RELEASE
}

enum Direction {
  CREDIT
  DEBIT
}

enum LedgerStatus {
  PENDING
  SETTLED
  HELD
  RELEASED
  FAILED
}

// ============================================
// FIXED DEPOSIT (FD) RECORDS
// ============================================
model FDRecord {
  id                String     @id @default(uuid())
  userId            String     @map("user_id")
  
  // Principal & Interest
  principal         Decimal    @db.Decimal(10, 2)
  interestRate      Decimal    @map("interest_rate") @db.Decimal(5, 2)
  tenureDays        Int        @map("tenure_days")
  
  // Calculated Values
  maturityAmount    Decimal    @map("maturity_amount") @db.Decimal(10, 2)
  interestEarned    Decimal    @map("interest_earned") @db.Decimal(10, 2)
  
  // Dates
  startDate         DateTime   @map("start_date")
  maturityDate      DateTime   @map("maturity_date")
  brokenAt          DateTime?  @map("broken_at")
  
  // Status
  status            FDStatus   @default(ACTIVE)
  
  // Early Break (if applicable)
  penaltyAmount     Decimal?   @map("penalty_amount") @db.Decimal(10, 2)
  actualReturn      Decimal?   @map("actual_return") @db.Decimal(10, 2)
  
  createdAt         DateTime   @default(now()) @map("created_at")
  updatedAt         DateTime   @updatedAt @map("updated_at")

  // Relations
  user              User       @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([status])
  @@index([maturityDate])
  @@map("fd_records")
}

enum FDStatus {
  ACTIVE
  MATURED
  BROKEN
}

// ============================================
// CLAUDE ADVISOR RECOMMENDATIONS
// ============================================
model AdvisorRecommendation {
  id              String   @id @default(uuid())
  userId          String   @map("user_id")
  
  // Recommendation Content
  summary         String
  recommendation  String
  actionItems     String   @map("action_items") // JSON array
  alert           String?
  
  // Context used (for debugging)
  contextUsed     String   @map("context_used") // JSON object
  
  // Metadata
  generatedAt     DateTime @default(now()) @map("generated_at")
  isFresh         Boolean  @default(true) @map("is_fresh")

  // Relations
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([generatedAt])
  @@map("advisor_recommendations")
}

// ============================================
// MERCHANT CATALOG
// ============================================
model Merchant {
  id            String   @id @default(uuid())
  name          String
  category      String
  logoUrl       String?  @map("logo_url")
  cashbackRate  Decimal  @map("cashback_rate") @db.Decimal(5, 2)
  isActive      Boolean  @default(true) @map("is_active")
  
  createdAt     DateTime @default(now()) @map("created_at")

  @@index([category])
  @@index([isActive])
  @@map("merchants")
}

// ============================================
// OTP VERIFICATION (Fraud)
// ============================================
model OTPVerification {
  id            String    @id @default(uuid())
  userId        String    @map("user_id")
  
  // OTP Details
  code          String
  purpose       String    // TRANSACTION, PASSWORD_RESET, etc.
  
  // Expiry
  expiresAt     DateTime  @map("expires_at")
  
  // Usage
  isUsed        Boolean   @default(false) @map("is_used")
  usedAt        DateTime? @map("used_at")
  
  // Attempt tracking
  attempts      Int       @default(0)
  
  createdAt     DateTime  @default(now()) @map("created_at")

  @@index([userId])
  @@index([code])
  @@map("otp_verifications")
}
```

---

## Step 4: Prisma Migrations

Run and verify DB is created correctly.

```bash
# Initialize Prisma
npx prisma init

# Generate migration
npx prisma migrate dev --name init

# Verify schema is applied
npx prisma db pull

# Generate Prisma Client
npx prisma generate
```

---

## Step 5: Seed Data

All 5 personas loaded and queryable.

```typescript
// prisma/seed/index.ts
import { PrismaClient } from '@prisma/client'
import { seedUsers } from './users'
import { seedTransactions } from './transactions'
import { seedFDs } from './fds'
import { seedMerchants } from './merchants'
import { seedCashback } from './cashback'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')
  
  // Clear existing data (order matters for foreign keys)
  await prisma.advisorRecommendation.deleteMany()
  await prisma.otpVerification.deleteMany()
  await prisma.ledgerEntry.deleteMany()
  await prisma.fDRecord.deleteMany()
  await prisma.wallet.deleteMany()
  await prisma.user.deleteMany()
  await prisma.merchant.deleteMany()
  
  // Seed in order
  await seedUsers(prisma)
  await seedMerchants(prisma)
  await seedTransactions(prisma)
  await seedFDs(prisma)
  await seedCashback(prisma)
  
  console.log('✅ Seed complete')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

```typescript
// prisma/seed/users.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

export async function seedUsers(prisma: PrismaClient) {
  const users = [
    {
      // Priya Sharma — Power User
      email: 'priya.sharma@email.com',
      name: 'Priya Sharma',
      phone: '+91-98765-43210',
      wallet: {
        availableBalance: 4280.00,
        pendingBalance: 340.00,
        lockedBalance: 2000.00,
        lifetimeEarned: 15000.00,
      }
    },
    {
      // Arjun Mehta — New User
      email: 'arjun.mehta@email.com',
      name: 'Arjun Mehta',
      phone: '+91-98765-43211',
      wallet: {
        availableBalance: 180.00,
        pendingBalance: 90.00,
        lockedBalance: 0.00,
        lifetimeEarned: 270.00,
      }
    },
    {
      // Meera Nair — Traveler
      email: 'meera.nair@email.com',
      name: 'Meera Nair',
      phone: '+91-98765-43212',
      wallet: {
        availableBalance: 3100.00,
        pendingBalance: 500.00,
        lockedBalance: 1000.00,
        lifetimeEarned: 12000.00,
      }
    },
    {
      // Rajan Kumar — Saver
      email: 'rajan.kumar@email.com',
      name: 'Rajan Kumar',
      phone: '+91-98765-43213',
      wallet: {
        availableBalance: 620.00,
        pendingBalance: 200.00,
        lockedBalance: 5000.00,
        lifetimeEarned: 25000.00,
      }
    },
    {
      // Vikram Singh — Fraud Case
      email: 'vikram.singh@email.com',
      name: 'Vikram Singh',
      phone: '+91-98765-43214',
      wallet: {
        availableBalance: 1500.00,
        pendingBalance: 500.00,
        lockedBalance: 0.00,
        lifetimeEarned: 4500.00,
      }
    },
  ]

  for (const userData of users) {
    const { wallet, ...userFields } = userData
    
    await prisma.user.create({
      data: {
        ...userFields,
        passwordHash: await bcrypt.hash('password123', 10),
        wallet: {
          create: wallet
        }
      }
    })
  }

  console.log(`✅ Seeded ${users.length} users`)
}
```

```bash
# Run seed
npx prisma db seed

# Verify seed worked
npx prisma studio
```

---

## Step 6: lib/prisma.ts

Single DB client instance — prevents connection exhaustion in dev.

```typescript
// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

---

## Step 7: config/ files

All rules and constants defined. No magic numbers anywhere else.

First, create the env validator that runs on startup:

```typescript
// src/config/env.ts
import { z } from 'zod'

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1),
  
  // Auth
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRY: z.string().default('24h'),
  
  // Claude API
  ANTHROPIC_API_KEY: z.string().min(1, 'ANTHROPIC_API_KEY is required'),
  
  // PayU
  PAYU_KEY: z.string().min(1, 'PAYU_KEY is required'),
  PAYU_SALT: z.string().min(1, 'PAYU_SALT is required'),
  PAYU_BASE_URL: z.string().url().default('https://test.payu.in/_payment'),
  PAYU_SUCCESS_URL: z.string().min(1, 'PAYU_SUCCESS_URL is required'),
  PAYU_FAILURE_URL: z.string().min(1, 'PAYU_FAILURE_URL is required'),

  // App
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  APP_URL: z.string().url().default('http://localhost:3000'),
  
  // Fraud Rules
  FRAUD_SPEED_THRESHOLD_SECONDS: z.string().default('90'),
  FRAUD_AMOUNT_THRESHOLD_PERCENT: z.string().default('80'),
  FRAUD_FREQUENCY_WINDOW_MINUTES: z.string().default('5'),
  FRAUD_FREQUENCY_THRESHOLD: z.string().default('3'),
  FRAUD_NEW_USER_DAYS: z.string().default('7'),
  FRAUD_NEW_USER_AMOUNT: z.string().default('2000'),
  FRAUD_NIGHT_HOUR_START: z.string().default('1'),
  FRAUD_NIGHT_HOUR_END: z.string().default('4'),
  FRAUD_NIGHT_AMOUNT: z.string().default('2000'),
  
  // FD Rules
  FD_MIN_AMOUNT: z.string().default('500'),
  FD_MIN_TENURE_DAYS: z.string().default('30'),
  FD_MAX_TENURE_DAYS: z.string().default('365'),
  FD_INTEREST_RATE: z.string().default('7.5'),
  FD_EARLY_BREAK_LOCK_DAYS: z.string().default('7'),
  FD_PREMATURE_PENALTY_PERCENT: z.string().default('1'),
  
  // Cashback
  CASHBACK_SETTLEMENT_HOURS: z.string().default('24'),
})

const parsedEnv = envSchema.safeParse(process.env)

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:')
  parsedEnv.error.errors.forEach((err) => {
    console.error(`  - ${err.path.join('.')}: ${err.message}`)
  })
  process.exit(1)
}

export const ENV = parsedEnv.data
```

```typescript
// src/config/fraud-rules.ts
export const FRAUD_RULES = {
  // Speed Rule: Spend within N seconds of credit
  SPEED_THRESHOLD_SECONDS: parseInt(process.env.FRAUD_SPEED_THRESHOLD_SECONDS || '90'),
  
  // Whitelist Override: Same merchant 3+ times in last 5 debits
  WHITELIST_MIN_MATCHES: 3,
  WHITELIST_LOOKBACK_COUNT: 5,
  
  // Amount Rule: Transaction exceeds X% of available balance
  AMOUNT_THRESHOLD_PERCENT: parseInt(process.env.FRAUD_AMOUNT_THRESHOLD_PERCENT || '80'),
  
  // Frequency Rule: Multiple transactions in short window
  FREQUENCY_WINDOW_MINUTES: parseInt(process.env.FRAUD_FREQUENCY_WINDOW_MINUTES || '5'),
  FREQUENCY_THRESHOLD: parseInt(process.env.FRAUD_FREQUENCY_THRESHOLD || '3'),
  
  // New User Rule: Large spend on new account
  NEW_USER_DAYS: parseInt(process.env.FRAUD_NEW_USER_DAYS || '7'),
  NEW_USER_AMOUNT: parseInt(process.env.FRAUD_NEW_USER_AMOUNT || '2000'),
  
  // Night Rule: High-value transaction in quiet hours
  NIGHT_HOUR_START: parseInt(process.env.FRAUD_NIGHT_HOUR_START || '1'),
  NIGHT_HOUR_END: parseInt(process.env.FRAUD_NIGHT_HOUR_END || '4'),
  NIGHT_AMOUNT: parseInt(process.env.FRAUD_NIGHT_AMOUNT || '2000'),
} as const
```

```typescript
// src/config/fd-rules.ts
export const FD_RULES = {
  // Investment Limits
  MIN_AMOUNT: parseInt(process.env.FD_MIN_AMOUNT || '500'),
  MIN_TENURE_DAYS: parseInt(process.env.FD_MIN_TENURE_DAYS || '30'),
  MAX_TENURE_DAYS: parseInt(process.env.FD_MAX_TENURE_DAYS || '365'),
  
  // Interest Rate (7.5% p.a.)
  INTEREST_RATE: parseFloat(process.env.FD_INTEREST_RATE || '7.5'),
  
  // Early Break Conditions
  EARLY_BREAK_LOCK_DAYS: parseInt(process.env.FD_EARLY_BREAK_LOCK_DAYS || '7'),
  PREMATURE_PENALTY_PERCENT: parseFloat(process.env.FD_PREMATURE_PENALTY_PERCENT || '1'),
} as const
```

```typescript
// src/config/cashback-rules.ts
export const CASHBACK_RULES = {
  // Settlement Period
  SETTLEMENT_HOURS: parseInt(process.env.CASHBACK_SETTLEMENT_HOURS || '24'),
  
  // Default Rates by Category
  DEFAULT_RATES: {
    FOOD: 5.0,
    TRAVEL: 3.0,
    SHOPPING: 4.0,
    ENTERTAINMENT: 2.5,
    BILLS: 1.0,
    OTHERS: 1.5,
  } as const,
  
  // Expiry (in days from credit)
  EXPIRY_DAYS: 90,
} as const
```

```typescript
// src/config/auth.ts
export const AUTH_CONFIG = {
  JWT_SECRET: process.env.JWT_SECRET!,
  JWT_EXPIRY: process.env.JWT_EXPIRY || '24h',
  
  // Password requirements
  MIN_PASSWORD_LENGTH: 8,
  
  // OTP expiry
  OTP_EXPIRY_MINUTES: 5,
  MAX_OTP_ATTEMPTS: 3,
} as const
```

```typescript
// src/config/payu.ts
export const PAYU_CONFIG = {
  KEY: process.env.PAYU_KEY!,
  SALT: process.env.PAYU_SALT!,
  BASE_URL: process.env.PAYU_BASE_URL || 'https://test.payu.in/_payment',
  SUCCESS_URL: process.env.PAYU_SUCCESS_URL!,
  FAILURE_URL: process.env.PAYU_FAILURE_URL!,
  
  // Test card details (for reference)
  TEST_CARD: {
    NUMBER: '5123456789012346',
    EXPIRY: '05/25',
    CVV: '123',
    OTP: '123456',
  },
} as const
```

```typescript
// src/config/claude.ts
export const CLAUDE_CONFIG = {
  API_KEY: process.env.ANTHROPIC_API_KEY!,
  MODEL: 'claude-sonnet-4-20250514',
  
  // Request timeout
  TIMEOUT_MS: 30000,
  
  // Rate limiting
  MAX_REQUESTS_PER_MINUTE: 10,
} as const
```

```typescript
// src/config/index.ts
export * from './fraud-rules'
export * from './fd-rules'
export * from './cashback-rules'
export * from './auth'
export * from './payu'
export * from './claude'
```

---

## Phase 1 Verification Checklist

Before moving to Phase 2, verify:

- [ ] `npm install` completed without errors
- [ ] `.env.local` created from `.env.example` with real values
- [ ] Prisma schema has all 7 models (User, Wallet, LedgerEntry, FDRecord, AdvisorRecommendation, Merchant, OTPVerification)
- [ ] `npx prisma migrate dev` ran successfully
- [ ] `npx prisma db seed` created all 5 personas
- [ ] `npx prisma studio` shows all seeded data
- [ ] `src/lib/prisma.ts` exports a singleton PrismaClient
- [ ] All 6 config files export constants (no undefined values)
- [ ] `npm run dev` starts the Next.js dev server without errors

---

## Next: Phase 2

Once Phase 1 is complete, move to:
- Wallet Service (balance calculations, ledger operations)
- Fraud Engine (all 6 rules with whitelist logic)
- FD Service (interest calculations, maturity logic)
