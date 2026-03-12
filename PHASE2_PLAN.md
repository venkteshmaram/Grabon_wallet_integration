# GrabCash Wallet Intelligence Platform — Phase 2 Implementation Plan

> **Status:** Phase 1 Complete — Prisma schema (PostgreSQL), migrations, seed data (5 personas), config files, and auth scaffolding all exist.
> **Goal:** Implement all business logic, services, API routes, cron jobs, and tests. Zero code changes when live data is connected.

---

## Critical Architecture Decisions (Read Before Anything Else)

### Currency: Integer Paisa (Not Decimal)
The actual database stores amounts as **integers in paisa** (₹1 = 100 paisa). The schema uses `Int` fields, not `Decimal`. All service functions receive and return **paisa integers**. The display layer converts to rupees. This eliminates floating-point errors entirely.

- `₹500` is stored as `50000`
- `₹1,006.16` is stored as `100616`
- All arithmetic uses integer math — no `.toFixed()`, no `parseFloat()`

### Snapshot + Atomic Approach
Every wallet mutation must:
1. Read the current wallet snapshot inside a transaction
2. Compute the new balance
3. Write the new `LedgerEntry` AND update the `Wallet` snapshot atomically
4. If either write fails, both roll back — no partial states ever

### Rules.md Compliance
- All business logic lives in `src/services/` — routes are thin wrappers
- `userId` always comes from the verified JWT token — never from request body
- Every async function wrapped in try-catch
- All errors return `{ error: { message, code } }` shape
- No hardcoded secrets — all from `.env`
- No function longer than 40 lines — split if needed
- Named constants for all thresholds (no magic numbers)

---

## Phase 1 Deliverables (Already Complete)

| Item | Status | Location |
|------|--------|----------|
| Prisma schema (PostgreSQL) | ✅ Done | `prisma/schema.prisma` |
| Migration `20260311091144_init` | ✅ Done | `prisma/migrations/` |
| Seed data — 5 personas | ✅ Done | `prisma/seed/` |
| `.env` + `.env.example` | ✅ Done | `grabcash-wallet/` |
| Auth routes (login, register) | ✅ Done | `src/app/api/auth/` |
| All route file stubs (empty) | ✅ Done | `src/app/api/` |
| All action file stubs (empty) | ✅ Done | `src/actions/` |
| All component stubs (empty) | ✅ Done | `src/components/` |
| `src/lib/prisma.ts` | ✅ Done | `src/lib/prisma.ts` |

---

## Phase 2 Overview — 9 Steps

```
Step 1: Wallet Service          → wallet-service.ts, ledger-service.ts
Step 2: FD Service              → fd-calculator.ts, fd-service.ts
Step 3: Fraud Engine            → fraud-engine.ts + 6 rule files
Step 4: PayU Hash Service       → payu-hash.ts, payu-service.ts
Step 5: OTP Service             → otp-service.ts
Step 6: All API Routes          → wallet, fd, fraud, payu, advisor routes
Step 7: Auth Hardening          → JWT middleware, Zod validation on login/register
Step 8: Cron Jobs               → settle-pending, mature-fds, weekly-advisor
Step 9: Tests                   → fraud whitelist, FD calculator, PayU hash
```

---

## Step 1 — Wallet Service

### Files to Create

| File | Purpose |
|------|---------|
| `src/services/wallet/wallet-service.ts` | All wallet mutation operations |
| `src/services/wallet/ledger-service.ts` | Ledger query and analytics operations |
| `src/services/wallet/wallet-types.ts` | TypeScript types for wallet operations |
| `src/lib/constants.ts` | All named constants (thresholds, config values) |

### Functions in `wallet-service.ts`

**`getWalletBalance(userId: string)`**
Fetches the wallet row for the given user and returns all four balance states: available, pending, locked, and lifetime earned. Converts from paisa integers to rupee display values. Returns a structured balance object. Throws a typed error if the wallet does not exist.

**`creditCashback(userId: string, amountPaisa: number, merchantId: string, merchantName: string, category: string, description: string)`**
Creates a new `CASHBACK_CREDIT` ledger entry with status `PENDING`. Does NOT touch the available balance — only increments `pendingBalance` on the wallet snapshot. Uses a Prisma transaction to atomically write both the ledger entry and the wallet update. Records `balanceAfter` as the new pending balance total. Returns the created ledger entry.

**`settlePendingEntry(ledgerEntryId: string)`**
Converts a single `PENDING` cashback entry to `SETTLED`. Atomically: decrements `pendingBalance`, increments `availableBalance`, increments `lifetimeEarned`, sets `settledAt` to now, and updates the ledger entry status to `SETTLED`. Records the new `balanceAfter` as the updated available balance. Throws if the entry is not found or is already settled.

**`spendBalance(userId: string, amountPaisa: number, merchantId: string, merchantName: string, description: string)`**
Deducts from available balance for a PayU spend. First validates that `availableBalance >= amountPaisa` — rejects with `INSUFFICIENT_BALANCE` error if not. Atomically creates a `PAYU_SPEND` ledger entry (direction: `DEBIT`, status: `SETTLED`) and decrements `availableBalance` on the wallet. Returns the ledger entry.

**`lockForFD(userId: string, amountPaisa: number, fdId: string)`**
Moves funds from available to locked when an FD is created. Validates `availableBalance >= amountPaisa`. Atomically: decrements `availableBalance`, increments `lockedBalance`, creates an `FD_LOCK` ledger entry (direction: `DEBIT`, status: `SETTLED`, fdId set). Returns the ledger entry.

**`unlockFromFD(userId: string, principalPaisa: number, interestPaisa: number, fdId: string)`**
Releases locked funds back to available on FD maturity. Atomically: decrements `lockedBalance` by principal, increments `availableBalance` by principal + interest, increments `lifetimeEarned` by interest, creates two ledger entries — `FD_UNLOCK` (CREDIT) and `FD_INTEREST` (CREDIT). Returns both ledger entries.

**`holdForFraud(userId: string, ledgerEntryId: string, flagReason: string)`**
Marks a ledger entry as `HELD` and sets `isFlagged = true` with the flag reason. Does not move any balance — the hold is a status flag only. Returns the updated entry.

**`releaseFromFraudHold(userId: string, ledgerEntryId: string)`**
Lifts a fraud hold by setting the ledger entry status from `HELD` to `SETTLED`. Proceeds with the original spend deduction that was held. Atomically updates the entry and deducts from available balance. Returns the updated entry.

### Functions in `ledger-service.ts`

**`getLedgerEntries(userId: string, filters: LedgerFilters)`**
Returns paginated ledger entries for a user. Supports filtering by type (All, Credits, Spends, FD, Flagged), date range, and status. Orders by `createdAt` descending (newest first). Returns entries with merchant name, amount in paisa, status badge data, and timestamps.

**`getWalletAnalytics(userId: string)`**
Computes two analytics views from the ledger:
1. Category breakdown — sum of cashback earned per category for the last 30 days
2. Monthly trend — total cashback earned per calendar month for the last 6 months
3. Top 5 merchants by cashback this month
4. Savings rate — lifetime earned as a percentage of total spend
Returns all four as a structured analytics object.

**`getPendingEntriesOlderThan(hours: number)`**
Queries all `CASHBACK_CREDIT` entries with status `PENDING` where `createdAt` is older than the given number of hours. Used by the settlement cron job. Returns an array of entry IDs and user IDs.

### `wallet-types.ts`

Defines TypeScript interfaces for:
- `WalletBalance` — the four balance states in both paisa and rupee display
- `LedgerEntryResponse` — the shape returned from ledger queries
- `LedgerFilters` — filter options for ledger queries
- `WalletAnalytics` — the analytics response shape
- `CreditCashbackInput` — validated input for crediting cashback
- `SpendBalanceInput` — validated input for spending

### `src/lib/constants.ts`

All named constants pulled from environment variables with typed defaults:

```
CASHBACK_SETTLEMENT_HOURS — from env, default 24
FD_MIN_AMOUNT_PAISA — from env FD_MIN_AMOUNT (₹500 = 50000 paisa)
FD_MIN_TENURE_DAYS — from env, default 30
FD_MAX_TENURE_DAYS — from env, default 365
FD_INTEREST_RATE — from env, default 7.5
FD_EARLY_BREAK_LOCK_DAYS — from env, default 7
FD_PREMATURE_PENALTY_PERCENT — from env, default 1
FRAUD_SPEED_THRESHOLD_SECONDS — from env, default 90
FRAUD_AMOUNT_THRESHOLD_PERCENT — from env, default 80
FRAUD_FREQUENCY_WINDOW_MINUTES — from env, default 5
FRAUD_FREQUENCY_THRESHOLD — from env, default 3
FRAUD_NEW_USER_DAYS — from env, default 7
FRAUD_NEW_USER_AMOUNT_PAISA — from env FD_NEW_USER_AMOUNT (₹2000 = 200000 paisa)
FRAUD_NIGHT_HOUR_START — from env, default 1
FRAUD_NIGHT_HOUR_END — from env, default 4
FRAUD_NIGHT_AMOUNT_PAISA — from env (₹2000 = 200000 paisa)
FRAUD_WHITELIST_MATCH_COUNT — hardcoded 3
FRAUD_WHITELIST_HISTORY_WINDOW — hardcoded 5 (last 5 debits)
OTP_EXPIRY_MINUTES — hardcoded 5
OTP_MAX_ATTEMPTS — hardcoded 3
```

### Dependencies from Phase 1
- `src/lib/prisma.ts` — Prisma client singleton
- `prisma/schema.prisma` — Wallet, LedgerEntry models
- `.env` — `CASHBACK_SETTLEMENT_HOURS`, `FD_MIN_AMOUNT`, etc.

### Business Rules to Enforce
- Available balance must never go below zero — reject with `INSUFFICIENT_BALANCE`
- Pending balance is never spendable — `spendBalance` only touches `availableBalance`
- Locked balance is never spendable — `spendBalance` only touches `availableBalance`
- Every multi-table write uses `prisma.$transaction()`
- `balanceAfter` on every ledger entry must equal the wallet snapshot after the operation
- `lifetimeEarned` increments on cashback settlement and FD interest — never on spend

### What Can Go Wrong
| Risk | Handling |
|------|---------|
| Wallet not found for userId | Throw `WALLET_NOT_FOUND` error with 404 code |
| Concurrent spend causing negative balance | Prisma transaction with optimistic locking — re-read balance inside transaction |
| Ledger entry and wallet update partially fail | Prisma `$transaction` rolls both back atomically |
| Invalid amount (zero or negative) | Validate at service entry — throw `INVALID_AMOUNT` before DB touch |
| `settledAt` set on already-settled entry | Check status before settling — throw `ALREADY_SETTLED` |

### Estimated Complexity: **High**
Reason: Atomic snapshot + ledger pattern requires careful transaction design. All downstream services depend on this being correct.

---

## Step 2 — FD Service

### Files to Create

| File | Purpose |
|------|---------|
| `src/services/fd/fd-calculator.ts` | Pure math functions for FD calculations |
| `src/services/fd/fd-service.ts` | FD lifecycle operations (create, break, mature) |
| `src/services/fd/fd-types.ts` | TypeScript types for FD operations |

### Functions in `fd-calculator.ts`

**`calculateMaturityAmount(principalPaisa: number, interestRate: number, tenureDays: number): number`**
Computes the maturity amount using simple interest formula:
`Maturity = Principal × (1 + (Rate × TenureDays) / 36500)`
All arithmetic in integer paisa. Returns maturity amount in paisa. This is a pure function — no database access, no side effects. Example: ₹1,000 (100000 paisa) for 30 days at 7.5% returns 100616 paisa (₹1,006.16).

**`calculateInterestEarned(principalPaisa: number, interestRate: number, tenureDays: number): number`**
Returns only the interest portion: `maturityAmount - principal`. Pure function.

**`calculateAccruedInterest(principalPaisa: number, interestRate: number, startDate: Date): number`**
Computes interest accrued from `startDate` to today. Uses the same formula with `daysSinceStart` as the tenure. Used for dashboard display of "interest so far". Pure function.

**`calculatePenaltyAmount(principalPaisa: number, penaltyPercent: number): number`**
Returns `principal × penaltyPercent / 100`. Used when breaking an FD early. Pure function.

**`calculateEarlyBreakReturn(principalPaisa: number, interestRate: number, startDate: Date, penaltyPercent: number): { accruedInterest: number, penalty: number, actualReturn: number }`**
Combines accrued interest calculation and penalty deduction. Returns the net amount the user receives when breaking early. Pure function.

**`validateFDInput(principalPaisa: number, tenureDays: number): { valid: boolean, error?: string }`**
Validates that principal meets `FD_MIN_AMOUNT_PAISA` and tenure is within `FD_MIN_TENURE_DAYS` to `FD_MAX_TENURE_DAYS`. Returns a validation result object. Pure function.

**`calculateMaturityDate(startDate: Date, tenureDays: number): Date`**
Adds `tenureDays` to `startDate` and returns the maturity date. Pure function using `date-fns`.

### Functions in `fd-service.ts`

**`createFD(userId: string, principalPaisa: number, tenureDays: number)`**
Orchestrates FD creation:
1. Validates input using `validateFDInput`
2. Checks user's available balance is sufficient
3. Computes maturity amount, interest, and maturity date using calculator functions
4. Opens a Prisma transaction that atomically:
   - Creates the `FDRecord` with status `ACTIVE`
   - Calls `lockForFD` from wallet-service (deducts available, increments locked)
5. Returns the created FD record with all computed values

**`getFDById(fdId: string, userId: string)`**
Fetches a single FD record by ID. Verifies the FD belongs to the requesting user (security check). Computes current accrued interest using `calculateAccruedInterest`. Returns the FD with live accrued interest appended.

**`getUserFDs(userId: string)`**
Returns all FD records for a user ordered by `createdAt` descending. For each active FD, appends live accrued interest. Returns a summary object with total portfolio value (sum of all maturity amounts for active FDs).

**`breakFDEarly(fdId: string, userId: string)`**
Handles premature FD closure:
1. Fetches the FD and verifies ownership
2. Checks FD status is `ACTIVE` — rejects if already matured or broken
3. Checks that `daysSinceStart >= FD_EARLY_BREAK_LOCK_DAYS` — rejects with `FD_LOCK_PERIOD_ACTIVE` if within first 7 days
4. Computes early break return using `calculateEarlyBreakReturn`
5. Opens a Prisma transaction that atomically:
   - Updates `FDRecord` status to `BROKEN`, sets `brokenAt`, `penaltyAmount`, `actualReturn`
   - Calls `unlockFromFD` from wallet-service with the actual return amount (not full principal + interest)
6. Returns the updated FD record with penalty details

**`matureFD(fdId: string)`**
Called by the cron job when an FD reaches its maturity date:
1. Fetches the FD and verifies status is `ACTIVE`
2. Opens a Prisma transaction that atomically:
   - Updates `FDRecord` status to `MATURED`
   - Calls `unlockFromFD` from wallet-service with full principal + interest
3. Returns the matured FD record

**`getFDsDueForMaturity()`**
Queries all `FDRecord` entries with status `ACTIVE` where `maturityDate <= now()`. Used by the maturity cron job. Returns an array of FD IDs and user IDs.

### Dependencies from Previous Steps
- Step 1: `wallet-service.ts` — `lockForFD`, `unlockFromFD`
- Step 1: `constants.ts` — all FD threshold constants
- Phase 1: `prisma/schema.prisma` — `FDRecord` model

### Business Rules to Enforce
- Minimum investment: ₹500 (50000 paisa) — reject below this
- Minimum tenure: 30 days — reject below this
- Maximum tenure: 365 days — reject above this
- Interest rate: 7.5% per annum (fixed, from constants)
- Cannot break within first 7 days — reject with lock period error
- Premature break penalty: 1% of principal deducted from return
- FD creation must atomically deduct available and increment locked — no partial states
- `maturityAmount` stored at creation time — never recalculated on read (immutable)
- `interestEarned` stored at creation time — `accruedInterest` is computed live for display only

### What Can Go Wrong
| Risk | Handling |
|------|---------|
| Principal below minimum | `validateFDInput` returns error before DB touch |
| Tenure out of range | `validateFDInput` returns error before DB touch |
| Insufficient available balance | `lockForFD` throws `INSUFFICIENT_BALANCE` |
| Breaking within lock period | Check `daysSinceStart < FD_EARLY_BREAK_LOCK_DAYS` — throw `FD_LOCK_PERIOD_ACTIVE` |
| Breaking already-broken FD | Check status before proceeding — throw `FD_NOT_ACTIVE` |
| Maturity cron running twice on same FD | Check status is `ACTIVE` before maturing — idempotent |
| Integer overflow on large amounts | Use JavaScript `BigInt` for intermediate calculations if principal > ₹99,999 |

### Estimated Complexity: **Medium**
Reason: Calculator functions are pure and testable. Service functions follow the same atomic pattern as wallet-service. The early break logic has the most edge cases.

---

## Step 3 — Fraud Engine

### Files to Create

| File | Purpose |
|------|---------|
| `src/services/fraud/fraud-engine.ts` | Orchestrator — runs all rules, returns verdict |
| `src/services/fraud/rules/speed-rule.ts` | Spend within 90s of credit |
| `src/services/fraud/rules/whitelist-rule.ts` | Recognised pattern override |
| `src/services/fraud/rules/amount-rule.ts` | Transaction > 80% of available balance |
| `src/services/fraud/rules/frequency-rule.ts` | 3+ transactions in 5 minutes |
| `src/services/fraud/rules/new-user-rule.ts` | Large spend on new account |
| `src/services/fraud/rules/night-rule.ts` | High-value transaction in quiet hours |
| `src/services/fraud/fraud-types.ts` | TypeScript types for fraud operations |

### Functions in `fraud-engine.ts`

**`checkTransaction(userId: string, amountPaisa: number, merchantId: string, merchantName: string)`**
The main entry point. Runs all six rules in a defined order. Returns a `FraudCheckResult` object containing:
- `isFlagged: boolean`
- `flagReason: string | null`
- `action: 'ALLOW' | 'REQUIRE_OTP' | 'BLOCK' | 'FREEZE'`
- `ruleTriggered: string | null`

**Rule execution order:**
1. Run `checkWhitelistRule` first — if it returns `ALLOW`, skip all other rules immediately
2. Run `checkNewUserRule` — if triggered, return `BLOCK` immediately (no OTP, hard block)
3. Run `checkFrequencyRule` — if triggered, return `FREEZE` immediately
4. Run `checkSpeedRule` — if triggered, flag for OTP
5. Run `checkAmountRule` — if triggered, flag for OTP
6. Run `checkNightRule` — if triggered, flag for OTP
7. If no rule triggered, return `ALLOW`

**`buildFraudContext(userId: string)`**
Fetches all data needed by the rules in a single batch:
- User's account creation date
- Last 5 debit ledger entries (for whitelist check)
- All debit entries in the last 5 minutes (for frequency check)
- Most recent credit entry (for speed check)
- Current available balance (for amount check)
- Current server time (for night check)
Returns a `FraudContext` object passed to all rules.

### Functions in Individual Rule Files

**`speed-rule.ts` — `checkSpeedRule(context: FraudContext, amountPaisa: number)`**
Looks at the most recent `CASHBACK_CREDIT` entry for the user. If the time between that credit's `createdAt` and now is less than `FRAUD_SPEED_THRESHOLD_SECONDS` (90 seconds), returns `{ triggered: true, reason: 'SPEED_VIOLATION' }`. Otherwise returns `{ triggered: false }`.

**`whitelist-rule.ts` — `checkWhitelistRule(context: FraudContext, merchantId: string, amountPaisa: number)`**
Examines the last 5 debit ledger entries. Counts how many match both the same `merchantId` AND an amount within ±10% of the current amount. If the count is 3 or more, returns `{ triggered: true, action: 'ALLOW' }` — this is an override that bypasses all other rules. This is the rule that protects Priya (Power User) from being flagged for her regular Zomato purchases.

**`amount-rule.ts` — `checkAmountRule(context: FraudContext, amountPaisa: number)`**
Computes `amountPaisa / context.availableBalance * 100`. If this percentage exceeds `FRAUD_AMOUNT_THRESHOLD_PERCENT` (80%), returns `{ triggered: true, reason: 'LARGE_AMOUNT_RATIO' }`.

**`frequency-rule.ts` — `checkFrequencyRule(context: FraudContext)`**
Counts debit entries in the last `FRAUD_FREQUENCY_WINDOW_MINUTES` (5 minutes). If count is `>= FRAUD_FREQUENCY_THRESHOLD` (3), returns `{ triggered: true, reason: 'HIGH_FREQUENCY', action: 'FREEZE' }`. The FREEZE action is more severe than OTP — it locks the account.

**`new-user-rule.ts` — `checkNewUserRule(context: FraudContext, amountPaisa: number)`**
Computes days since account creation. If `daysSinceCreation < FRAUD_NEW_USER_DAYS` (7) AND `amountPaisa > FRAUD_NEW_USER_AMOUNT_PAISA` (₹2,000), returns `{ triggered: true, reason: 'NEW_USER_LARGE_SPEND', action: 'BLOCK' }`. This is a hard block — no OTP option.

**`night-rule.ts` — `checkNightRule(context: FraudContext, amountPaisa: number)`**
Gets the current hour in IST (UTC+5:30). If hour is between `FRAUD_NIGHT_HOUR_START` (1am) and `FRAUD_NIGHT_HOUR_END` (4am) AND `amountPaisa > FRAUD_NIGHT_AMOUNT_PAISA` (₹2,000), returns `{ triggered: true, reason: 'NIGHT_HIGH_VALUE' }`.

### Dependencies from Previous Steps
- Step 1: `ledger-service.ts` — to fetch recent transactions for context
- Step 1: `wallet-service.ts` — to fetch current available balance
- Step 1: `constants.ts` — all fraud threshold constants
- Phase 1: `prisma/schema.prisma` — `LedgerEntry`, `User` models

### Business Rules to Enforce
- Whitelist check ALWAYS runs first — it can override all other rules
- New user block is a hard block — no OTP path, transaction is rejected
- Frequency freeze locks the account — requires manual review (out of scope for Phase 2, but flag is set)
- Speed rule + whitelist interaction: Priya buys Zomato quickly after cashback → whitelist fires → speed rule never evaluated → transaction allowed
- Vikram buys at different merchants quickly → whitelist does NOT fire (different merchants) → speed rule fires → OTP required
- Amount rule uses available balance at time of check — not total balance

### What Can Go Wrong
| Risk | Handling |
|------|---------|
| `buildFraudContext` DB query fails | Wrap in try-catch — on failure, default to `REQUIRE_OTP` (fail safe) |
| Available balance is zero (division by zero in amount rule) | Check for zero before computing percentage — if zero, any spend triggers amount rule |
| Whitelist match with no transaction history | If fewer than 3 historical debits exist, whitelist cannot trigger — proceed to other rules |
| Night rule timezone error | Always convert to IST explicitly using UTC offset — never rely on server timezone |
| Concurrent fraud checks for same user | Each check is read-only — no race condition risk |

### Estimated Complexity: **High**
Reason: Six rules with interaction logic (whitelist override), persona-specific edge cases (Priya vs Vikram), and the whitelist similarity matching require careful implementation and thorough testing.

---

## Step 4 — PayU Hash Service

### Files to Create

| File | Purpose |
|------|---------|
| `src/services/payu/payu-hash.ts` | SHA512 hash generation and verification |
| `src/services/payu/payu-service.ts` | PayU transaction lifecycle |
| `src/services/payu/payu-types.ts` | TypeScript types for PayU operations |

### Functions in `payu-hash.ts`

**`generatePayUHash(params: PayUHashParams): string`**
Builds the SHA512 hash for a PayU payment initiation request. The hash string is constructed by concatenating these fields in this exact order, separated by pipe characters:
`key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt`
The amount must be formatted as a decimal string with exactly 2 decimal places (e.g., `"500.00"`). Computes SHA512 of the concatenated string. Returns the hex digest. Reads `PAYU_KEY` and `PAYU_SALT` from environment — never accepts them as parameters.

**`verifyPayUResponseHash(responseParams: PayUResponseParams): boolean`**
Verifies PayU's response hash to confirm the payment result is authentic. The reverse hash string is:
`salt|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key`
Computes SHA512 of this string and compares it to the `hash` field in PayU's response. Returns `true` only if they match exactly. If they do not match, the response must be rejected — never trust PayU's success status without this verification.

**`buildPayUFormParams(userId: string, amountPaisa: number, txnId: string, productInfo: string, userEmail: string, userName: string): PayUFormParams`**
Assembles the complete parameter object needed to redirect to PayU's payment page. Converts `amountPaisa` to rupees with 2 decimal places. Sets `surl` (success URL) and `furl` (failure URL) from environment variables. Calls `generatePayUHash` to compute the hash. Returns the complete form params object ready for the frontend redirect.

### Functions in `payu-service.ts`

**`initiatePayment(userId: string, amountPaisa: number, merchantId: string, merchantName: string)`**
Orchestrates the payment initiation flow:
1. Fetches user details (name, email) from database
2. Verifies available balance is sufficient
3. Runs fraud check via `fraud-engine.ts` — if flagged, returns fraud result instead of PayU params
4. Generates a unique transaction ID using UUID
5. Calls `buildPayUFormParams` to get the complete PayU redirect parameters
6. Stores the pending transaction in a temporary record (or uses the ledger with `HELD` status)
7. Returns the PayU form params for the frontend to redirect

**`handlePayUSuccess(responseParams: PayUResponseParams)`**
Processes PayU's success webhook callback:
1. Verifies the response hash using `verifyPayUResponseHash` — rejects immediately if hash mismatch
2. Looks up the transaction by `txnid` to get the original amount (never trusts the amount in the response)
3. Calls `spendBalance` from wallet-service to deduct the verified amount
4. Returns success confirmation

**`handlePayUFailure(responseParams: PayUResponseParams)`**
Processes PayU's failure webhook callback:
1. Verifies the response hash
2. Logs the failure with transaction ID and reason
3. Releases any held balance if applicable
4. Returns failure confirmation

**`getPayUBaseUrl(): string`**
Returns `PAYU_BASE_URL` from environment. Throws if not set. Used by the route to know where to redirect.

### Dependencies from Previous Steps
- Step 1: `wallet-service.ts` — `spendBalance`, `getWalletBalance`
- Step 3: `fraud-engine.ts` — `checkTransaction`
- Step 1: `constants.ts` — no specific constants, but pattern follows
- Phase 1: `.env` — `PAYU_KEY`, `PAYU_SALT`, `PAYU_BASE_URL`, `PAYU_SUCCESS_URL`, `PAYU_FAILURE_URL`

### Business Rules to Enforce
- Amount for hash must come from the database — never from the client request
- Response hash must be verified before any wallet update — no exceptions
- `PAYU_KEY` and `PAYU_SALT` are never logged, never returned to client, never passed as function parameters
- Transaction ID must be unique per request — use UUID v4
- Fraud check runs before PayU hash generation — flagged transactions never reach PayU
- Success URL and failure URL must be HTTPS (ngrok URLs in development)

### What Can Go Wrong
| Risk | Handling |
|------|---------|
| Hash mismatch on response | Reject with `HASH_VERIFICATION_FAILED` — log the txnid but not the hash |
| PayU webhook arrives before user returns | Webhook is the authoritative source — process it regardless of user redirect |
| Duplicate webhook delivery | Check if ledger entry for txnid already exists — if yes, return 200 without re-processing |
| `PAYU_KEY` or `PAYU_SALT` not set in env | Throw at startup — fail fast rather than silently using wrong values |
| Amount in PayU response differs from stored amount | Always use stored amount — never the response amount |
| ngrok URL changes between sessions | Document in README — update `PAYU_SUCCESS_URL` and `PAYU_FAILURE_URL` in `.env` |

### Estimated Complexity: **High**
Reason: The hash construction is exact and unforgiving — one wrong character breaks the integration. Response verification is a security requirement. Webhook idempotency requires careful handling.

---

## Step 5 — OTP Service

### Files to Create

| File | Purpose |
|------|---------|
| `src/services/otp/otp-service.ts` | OTP generation, delivery, and verification |
| `src/services/otp/otp-types.ts` | TypeScript types for OTP operations |

### Functions in `otp-service.ts`

**`generateOTP(userId: string, purpose: string): string`**
Creates a new OTP record in the `OTPVerification` table:
1. Generates a 6-digit numeric code using `Math.random()` (cryptographically sufficient for demo)
2. Sets `expiresAt` to now + `OTP_EXPIRY_MINUTES` (5 minutes)
3. Sets `isUsed = false`, `attempts = 0`
4. Invalidates any existing unused OTPs for the same user and purpose (sets them as used)
5. Saves the new OTP record
6. Returns the OTP code (for display on screen or Twilio delivery)
Never logs the OTP code.

**`deliverOTP(userId: string, otpCode: string, userPhone: string)`**
Attempts to send the OTP via Twilio WhatsApp if `TWILIO_SID`, `TWILIO_TOKEN`, and `TWILIO_FROM` are all set in environment. If any Twilio env var is missing, falls back to returning the OTP in the API response (display on screen mode). Wraps the Twilio call in try-catch — if Twilio fails, falls back to display mode rather than blocking the transaction. Never logs the OTP code.

**`verifyOTP(userId: string, code: string, purpose: string): OTPVerificationResult`**
Validates a submitted OTP:
1. Fetches the most recent unused OTP for the user and purpose
2. Checks if it exists — returns `OTP_NOT_FOUND` if not
3. Checks if it has expired — returns `OTP_EXPIRED` if `expiresAt < now`
4. Increments `attempts` counter
5. If `attempts >= OTP_MAX_ATTEMPTS` (3), marks the OTP as used and returns `ACCOUNT_FROZEN` — the account must be frozen
6. Compares the submitted code to the stored code
7. If match: marks OTP as used, sets `usedAt`, returns `{ verified: true }`
8. If no match: returns `{ verified: false, attemptsRemaining: OTP_MAX_ATTEMPTS - attempts }`

**`freezeAccount(userId: string)`**
Called when OTP attempts are exhausted. Creates a `FRAUD_HOLD` ledger entry for all pending transactions. Logs the freeze event with userId and timestamp. In Phase 2, this is a flag — full account freeze UI is Phase 3.

**`checkOTPStatus(userId: string, purpose: string): OTPStatus`**
Returns whether an active (unexpired, unused) OTP exists for the user and purpose. Used by the fraud flow to check if OTP is pending before allowing a transaction.

### Dependencies from Previous Steps
- Step 1: `wallet-service.ts` — `holdForFraud` (called on account freeze)
- Step 1: `constants.ts` — `OTP_EXPIRY_MINUTES`, `OTP_MAX_ATTEMPTS`
- Phase 1: `prisma/schema.prisma` — `OTPVerification` model
- Phase 1: `.env` — `TWILIO_SID`, `TWILIO_TOKEN`, `TWILIO_FROM`

### Business Rules to Enforce
- OTP expires in exactly 5 minutes — no extensions
- Three wrong attempts freezes the account — no fourth attempt allowed
- Only one active OTP per user per purpose at a time — previous ones invalidated on new generation
- OTP code is never logged anywhere — only the userId and purpose are logged
- Twilio is optional — system must work without it (display mode fallback)

### What Can Go Wrong
| Risk | Handling |
|------|---------|
| Twilio API call fails | Catch error, fall back to display mode, log the failure (not the OTP) |
| OTP expired before user submits | Return `OTP_EXPIRED` — user must request a new one |
| Race condition on attempt counter | Prisma atomic increment: `{ attempts: { increment: 1 } }` |
| User submits OTP for wrong purpose | Purpose is checked in the query — returns `OTP_NOT_FOUND` |
| `TWILIO_SID` set but invalid | Twilio throws — catch and fall back to display mode |

### Estimated Complexity: **Low**
Reason: Straightforward CRUD with a few business rules. The Twilio integration is optional and has a clear fallback.

---

## Step 6 — All API Routes

### Files to Implement (Currently Empty Stubs)

#### Wallet Routes
| File | Method | Endpoint | Handler |
|------|--------|----------|---------|
| `src/app/api/wallet/[userId]/route.ts` | GET | `/api/wallet/:userId` | Returns all four balance types |
| `src/app/api/wallet/[userId]/ledger/route.ts` | GET | `/api/wallet/:userId/ledger` | Full ledger with filters |
| `src/app/api/wallet/[userId]/credit/route.ts` | POST | `/api/wallet/:userId/credit` | Creates pending cashback entry |
| `src/app/api/wallet/[userId]/settle/route.ts` | POST | `/api/wallet/:userId/settle` | Converts pending to available |
| `src/app/api/wallet/[userId]/spend/route.ts` | POST | `/api/wallet/:userId/spend` | Deducts available for PayU |
| `src/app/api/wallet/[userId]/analytics/route.ts` | GET | `/api/wallet/:userId/analytics` | Category breakdown and monthly trend |

#### FD Routes
| File | Method | Endpoint | Handler |
|------|--------|----------|---------|
| `src/app/api/fd/create/route.ts` | POST | `/api/fd/create` | Create new FD |
| `src/app/api/fd/[fdId]/route.ts` | GET | `/api/fd/:fdId` | Get FD status and accrued interest |
| `src/app/api/fd/user/[userId]/route.ts` | GET | `/api/fd/user/:userId` | All FDs for a user |
| `src/app/api/fd/[fdId]/break/route.ts` | POST | `/api/fd/:fdId/break` | Break FD early with penalty |

#### Fraud Routes
| File | Method | Endpoint | Handler |
|------|--------|----------|---------|
| `src/app/api/fraud/check/route.ts` | POST | `/api/fraud/check` | Run fraud check on a transaction |
| `src/app/api/fraud/otp/generate/route.ts` | POST | `/api/fraud/otp/generate` | Generate and deliver OTP |
| `src/app/api/fraud/otp/verify/route.ts` | POST | `/api/fraud/otp/verify` | Verify submitted OTP |

#### PayU Routes
| File | Method | Endpoint | Handler |
|------|--------|----------|---------|
| `src/app/api/payu/initiate/route.ts` | POST | `/api/payu/initiate` | Build PayU form params |
| `src/app/api/payu/webhook/route.ts` | POST | `/api/payu/webhook` | Handle PayU success/failure callback |
| `src/app/api/payu/verify/route.ts` | POST | `/api/payu/verify` | Manual hash verification endpoint |

#### Advisor Routes (Stub)
| File | Method | Endpoint | Handler |
|------|--------|----------|---------|
| `src/app/api/advisor/[userId]/route.ts` | GET | `/api/advisor/:userId` | Get latest recommendation |
| `src/app/api/advisor/[userId]/refresh/route.ts` | POST | `/api/advisor/:userId/refresh` | Trigger new Claude analysis |

#### Cron Routes
| File | Method | Endpoint | Handler |
|------|--------|----------|---------|
| `src/app/api/cron/settle-pending/route.ts` | POST | `/api/cron/settle-pending` | Trigger settlement job |
| `src/app/api/cron/mature-fds/route.ts` | POST | `/api/cron/mature-fds` | Trigger FD maturity job |
| `src/app/api/cron/weekly-advisor/route.ts` | POST | `/api/cron/weekly-advisor` | Trigger weekly advisor job |

### Route Implementation Pattern (All Routes Follow This)

Every route file follows this exact structure:
1. Import the relevant service function
2. Import `withAuth` middleware (from Step 7) — extract `userId` from JWT
3. Define a Zod schema for the request body (if POST/PUT)
4. Parse and validate the request body — return 400 if invalid
5. Verify the `userId` from JWT matches the resource being accessed (authorization check)
6. Call the service function
7. Return the result in `{ data: ... }` shape on success
8. Catch errors and return `{ error: { message, code } }` shape

### Zod Schemas Required

**`creditCashbackSchema`**
```
amount: positive integer (paisa)
merchantId: non-empty string
merchantName: non-empty string
category: non-empty string
description: optional string
```

**`spendBalanceSchema`**
```
amount: positive integer (paisa)
merchantId: non-empty string
merchantName: non-empty string
description: optional string
```

**`createFDSchema`**
```
principal: integer >= FD_MIN_AMOUNT_PAISA
tenureDays: integer between FD_MIN_TENURE_DAYS and FD_MAX_TENURE_DAYS
```

**`fraudCheckSchema`**
```
amount: positive integer (paisa)
merchantId: non-empty string
merchantName: non-empty string
```

**`verifyOTPSchema`**
```
code: string of exactly 6 digits
purpose: enum ['TRANSACTION', 'PASSWORD_RESET']
```

**`initiatePaymentSchema`**
```
amount: positive integer (paisa)
merchantId: non-empty string
merchantName: non-empty string
productInfo: non-empty string
```

### Authorization Rules
- `GET /api/wallet/:userId` — JWT userId must match route userId
- `POST /api/wallet/:userId/credit` — JWT userId must match route userId
- `POST /api/fd/create` — userId comes from JWT only, never from body
- `GET /api/fd/:fdId` — service verifies FD belongs to JWT userId
- `POST /api/fraud/check` — userId comes from JWT only
- `POST /api/payu/webhook` — no JWT required (PayU calls this), but hash verification is mandatory
- `POST /api/cron/*` — protected by a `CRON_SECRET` header check (not JWT)

### Dependencies from Previous Steps
- Step 1: `wallet-service.ts`, `ledger-service.ts`
- Step 2: `fd-service.ts`
- Step 3: `fraud-engine.ts`
- Step 4: `payu-service.ts`
- Step 5: `otp-service.ts`
- Step 7: `withAuth` middleware (auth hardening)

### What Can Go Wrong
| Risk | Handling |
|------|---------|
| Zod validation fails | Return 400 with field-level error messages |
| JWT userId doesn't match route userId | Return 403 `FORBIDDEN` |
| Service throws known error | Map error code to HTTP status (404, 400, 409, etc.) |
| Service throws unknown error | Return 500 with generic message — never expose stack trace |
| PayU webhook called without valid hash | Return 400 `HASH_VERIFICATION_FAILED` |

### Estimated Complexity: **Medium**
Reason: Routes are thin by design. The complexity is in getting the Zod schemas right and the authorization checks consistent across all routes.

---

## Step 7 — Auth Hardening

### Files to Create / Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/middleware/auth.ts` | Create | JWT verification middleware |
| `src/app/api/auth/login/route.ts` | Modify | Add Zod validation |
| `src/app/api/auth/register/route.ts` | Modify | Add Zod validation |
| `src/app/api/auth/refresh/route.ts` | Implement | Token refresh endpoint |

### Functions in `src/middleware/auth.ts`

**`withAuth(handler: RouteHandler): RouteHandler`**
A higher-order function that wraps any Next.js route handler with JWT verification:
1. Extracts the `Authorization` header from the request
2. Checks it follows the `Bearer <token>` format — returns 401 if missing or malformed
3. Verifies the token using `JWT_SECRET` from environment
4. If verification fails (expired, invalid signature), returns 401 `UNAUTHORIZED`
5. Extracts `userId` and `email` from the verified token payload
6. Attaches them to the request context for the handler to use
7. Calls the original handler with the enriched context
Never logs the token itself.

**`extractUserId(request: NextRequest): string`**
Helper that extracts the verified `userId` from the request context set by `withAuth`. Throws if called outside of an authenticated route (programming error guard).

### Modifications to Existing Auth Routes

**`login/route.ts` — Add Zod validation**
Add a `loginSchema` that validates:
- `email`: valid email format
- `password`: non-empty string, minimum 8 characters
Parse and validate before any database access. Return 400 with field errors if invalid.
Also fix the current issue: `process.env.JWT_SECRET || 'fallback-secret'` must be replaced with a hard throw if `JWT_SECRET` is not set — never use a fallback secret in any environment.

**`register/route.ts` — Add Zod validation**
Add a `registerSchema` that validates:
- `email`: valid email format
- `password`: minimum 8 characters, at least one number
- `name`: non-empty string, minimum 2 characters
- `phone`: optional, but if provided must match Indian phone format
Parse and validate before any database access.

**`refresh/route.ts` — Implement token refresh**
Accepts a valid (non-expired) JWT. Issues a new JWT with a fresh expiry. Returns the new token. This allows the frontend to silently refresh sessions without re-login.

### Dependencies from Previous Steps
- Phase 1: `src/lib/prisma.ts`
- Phase 1: `.env` — `JWT_SECRET`, `JWT_EXPIRY`

### Business Rules to Enforce
- `JWT_SECRET` must be set — throw at startup if missing, never use fallback
- `userId` always comes from the verified token — never from request body or query params
- Token expiry is enforced — expired tokens return 401, not 403
- Password is never returned in any response — not even hashed
- Login failure returns the same error message for "user not found" and "wrong password" — prevents user enumeration

### What Can Go Wrong
| Risk | Handling |
|------|---------|
| `JWT_SECRET` not set in env | Throw `MISSING_JWT_SECRET` at startup — fail fast |
| Token expired | Return 401 with `TOKEN_EXPIRED` code — frontend handles refresh |
| Token tampered | `jwt.verify` throws — return 401 `INVALID_TOKEN` |
| `Authorization` header missing | Return 401 `MISSING_AUTH_HEADER` |
| Zod validation fails on login | Return 400 with field-level errors |

### Estimated Complexity: **Low**
Reason: Auth pattern is well-established. The main work is adding Zod validation to existing routes and fixing the JWT_SECRET fallback issue.

---

## Step 8 — Cron Jobs

### Files to Create

| File | Purpose |
|------|---------|
| `src/cron/settle-pending.ts` | Daily midnight — settle cashback older than 24h |
| `src/cron/mature-fds.ts` | Daily 1am — mature FDs past their maturity date |
| `src/cron/weekly-advisor.ts` | Monday 9am — run Claude advisor for all users |
| `src/cron/index.ts` | Registers all cron jobs on server startup |

### Functions in `settle-pending.ts`

**`runSettlePendingJob()`**
The main cron job function:
1. Calls `getPendingEntriesOlderThan(CASHBACK_SETTLEMENT_HOURS)` from ledger-service
2. For each entry returned, calls `settlePendingEntry(entryId)` from wallet-service
3. Logs the result: `{ operation: 'settle-pending', processed: N, failed: M, duration: Xms }`
4. If any individual entry fails, logs the error with `{ userId, entryId, error }` and continues to the next entry — one failure must never stop the batch
5. Returns a summary object with counts

**`scheduleSettlePendingJob()`**
Registers the cron schedule: `0 0 * * *` (daily at midnight). Wraps `runSettlePendingJob` in try-catch at the schedule level. Logs job start and completion.

### Functions in `mature-fds.ts`

**`runMatureFDsJob()`**
The main cron job function:
1. Calls `getFDsDueForMaturity()` from fd-service
2. For each FD returned, calls `matureFD(fdId)` from fd-service
3. Logs the result: `{ operation: 'mature-fds', processed: N, failed: M, duration: Xms }`
4. If any individual FD fails, logs the error with `{ userId, fdId, error }` and continues
5. Returns a summary object with counts

**`scheduleMatureFDsJob()`**
Registers the cron schedule: `0 1 * * *` (daily at 1am). Wraps `runMatureFDsJob` in try-catch.

### Functions in `weekly-advisor.ts`

**`runWeeklyAdvisorJob()`**
The main cron job function (stub in Phase 2 — Claude integration is Phase 3):
1. Fetches all user IDs from the database
2. For each user, logs `{ operation: 'weekly-advisor', userId, status: 'STUB' }`
3. Returns a summary indicating the job ran but Claude calls are pending Phase 3
4. Structure is complete — only the Claude API call is stubbed

**`scheduleWeeklyAdvisorJob()`**
Registers the cron schedule: `0 9 * * 1` (Monday at 9am). Wraps `runWeeklyAdvisorJob` in try-catch.

### Functions in `cron/index.ts`

**`startCronJobs()`**
Calls all three schedule functions. Logs `{ operation: 'cron-startup', jobs: ['settle-pending', 'mature-fds', 'weekly-advisor'] }`. This function is called once when the Next.js server starts (via a server-side initialization file).

### Cron API Routes (Already Stubbed — Implement These)

The cron routes at `src/app/api/cron/*/route.ts` allow manual triggering for testing:
- They call the same `run*Job()` functions as the scheduled cron
- Protected by a `CRON_SECRET` header check (not JWT — cron jobs are server-to-server)
- Return the job summary object

### Dependencies from Previous Steps
- Step 1: `wallet-service.ts` — `settlePendingEntry`
- Step 1: `ledger-service.ts` — `getPendingEntriesOlderThan`
- Step 2: `fd-service.ts` — `matureFD`, `getFDsDueForMaturity`
- Step 1: `constants.ts` — `CASHBACK_SETTLEMENT_HOURS`

### Business Rules to Enforce
- One failed user/FD must never stop the entire batch — always continue
- Cron jobs log errors but do not throw — they are fire-and-forget
- Settlement is idempotent — running it twice on the same entry is safe (status check prevents double-settlement)
- FD maturity is idempotent — running it twice on the same FD is safe (status check prevents double-maturity)
- Cron API routes require `CRON_SECRET` header — not accessible without it

### What Can Go Wrong
| Risk | Handling |
|------|---------|
| Database connection lost during batch | Log the error, the next cron run will pick up unprocessed entries |
| Cron job runs while previous run is still executing | node-cron does not prevent overlap — add a `isRunning` flag to prevent concurrent runs |
| Settlement cron runs before 24 hours have passed | `getPendingEntriesOlderThan` uses exact timestamp comparison — safe |
| FD maturity cron misses a day | Next run will pick up all overdue FDs — `maturityDate <= now()` catches all |
| Weekly advisor cron fails entirely | Log the failure — users keep their last recommendation until next Monday |

### Estimated Complexity: **Low**
Reason: Cron jobs are thin orchestrators that call existing service functions. The complexity is in the error handling pattern (continue on individual failure).

---

## Step 9 — Tests

### Files to Create

| File | What It Tests |
|------|--------------|
| `src/__tests__/fraud-whitelist.test.ts` | Whitelist rule — Priya passes, Vikram fails |
| `src/__tests__/fd-calculator.test.ts` | All FD math functions with known inputs/outputs |
| `src/__tests__/payu-hash.test.ts` | Hash generation and response verification |

### `fraud-whitelist.test.ts` — Test Cases

**Test 1: Priya passes whitelist check**
Setup: Create a mock fraud context where the last 5 debit entries all have `merchantId = 'zomato'` and amounts within ±10% of ₹200 (20000 paisa). Call `checkWhitelistRule` with `merchantId = 'zomato'` and `amount = 19500`. Assert: returns `{ triggered: true, action: 'ALLOW' }`.

**Test 2: Vikram fails whitelist check (different merchants)**
Setup: Create a mock fraud context where the last 5 debit entries have 5 different merchant IDs. Call `checkWhitelistRule` with any merchantId. Assert: returns `{ triggered: false }`.

**Test 3: Whitelist requires 3 matches minimum**
Setup: Create a mock fraud context where only 2 of the last 5 entries match the merchant. Assert: returns `{ triggered: false }`.

**Test 4: Full fraud engine — Priya is allowed despite speed violation**
Setup: Mock `buildFraudContext` to return a context where the last credit was 30 seconds ago (speed violation would trigger) AND the last 5 debits are all Zomato at similar amounts. Call `checkTransaction`. Assert: returns `{ action: 'ALLOW' }` — whitelist overrides speed rule.

**Test 5: Full fraud engine — Vikram is flagged**
Setup: Mock `buildFraudContext` to return a context where the last credit was 30 seconds ago AND the last 5 debits are at different merchants. Call `checkTransaction`. Assert: returns `{ action: 'REQUIRE_OTP', ruleTriggered: 'SPEED_VIOLATION' }`.

### `fd-calculator.test.ts` — Test Cases

**Test 1: Standard maturity calculation**
Input: principal = 100000 paisa (₹1,000), rate = 7.5, tenure = 30 days.
Expected output: 100616 paisa (₹1,006.16).
Formula: `100000 × (1 + (7.5 × 30) / 36500) = 100616.44` → floor to 100616.

**Test 2: Minimum investment maturity**
Input: principal = 50000 paisa (₹500), rate = 7.5, tenure = 30 days.
Expected output: 50308 paisa (₹503.08).

**Test 3: Maximum tenure maturity**
Input: principal = 100000 paisa (₹1,000), rate = 7.5, tenure = 365 days.
Expected output: 107500 paisa (₹1,075.00).
Formula: `100000 × (1 + (7.5 × 365) / 36500) = 107500`.

**Test 4: Early break penalty calculation**
Input: principal = 100000 paisa, penalty = 1%.
Expected output: 1000 paisa (₹10).

**Test 5: Validation rejects below minimum**
Input: principal = 49999 paisa (₹499.99).
Expected: `validateFDInput` returns `{ valid: false, error: 'BELOW_MINIMUM_AMOUNT' }`.

**Test 6: Validation rejects tenure below minimum**
Input: tenure = 29 days.
Expected: `validateFDInput` returns `{ valid: false, error: 'BELOW_MINIMUM_TENURE' }`.

**Test 7: Validation rejects tenure above maximum**
Input: tenure = 366 days.
Expected: `validateFDInput` returns `{ valid: false, error: 'ABOVE_MAXIMUM_TENURE' }`.

**Test 8: Interest earned equals maturity minus principal**
Assert: `calculateInterestEarned(100000, 7.5, 30) === calculateMaturityAmount(100000, 7.5, 30) - 100000`.

### `payu-hash.test.ts` — Test Cases

**Test 1: Hash generation produces correct SHA512**
Setup: Use known test values for all parameters. Manually compute the expected SHA512 using a reference implementation. Assert: `generatePayUHash(params)` returns the expected hex string.

**Test 2: Hash is sensitive to parameter order**
Setup: Generate hash with correct parameter order. Generate hash with two parameters swapped. Assert: the two hashes are different (verifies order matters).

**Test 3: Response verification passes for valid response**
Setup: Construct a mock PayU response with a correctly computed reverse hash. Assert: `verifyPayUResponseHash(response)` returns `true`.

**Test 4: Response verification fails for tampered response**
Setup: Construct a mock PayU response with a valid hash, then change the `status` field. Assert: `verifyPayUResponseHash(response)` returns `false`.

**Test 5: Amount formatting is correct**
Setup: Pass `amountPaisa = 50000` (₹500). Assert: the hash string contains `"500.00"` (not `"500"` or `"500.0"`).

**Test 6: Hash does not expose salt**
Setup: Call `generatePayUHash`. Assert: the returned hash string does not contain the value of `PAYU_SALT`.

### Test Configuration

Tests use Jest with `ts-jest` for TypeScript support. All database calls are mocked using Jest's `jest.mock()` — tests do not require a running database. Environment variables for tests are set in a `jest.setup.ts` file with safe test values (not real API keys).

### Dependencies from Previous Steps
- Step 2: `fd-calculator.ts` — pure functions, easy to test
- Step 3: `fraud-engine.ts`, `whitelist-rule.ts` — mock the context builder
- Step 4: `payu-hash.ts` — pure functions, easy to test

### Estimated Complexity: **Low**
Reason: The functions being tested are pure (no side effects, no database). Mocking is straightforward. The test cases are well-defined by the business rules.

---

## Dependency Graph

```
Phase 1 Foundation
├── prisma/schema.prisma (models: User, Wallet, LedgerEntry, FDRecord, OTPVerification, Merchant, AdvisorRecommendation)
├── src/lib/prisma.ts (Prisma client singleton)
├── .env (all secrets and config)
└── src/app/api/auth/ (login, register — partially implemented)

Step 1: Wallet Service
├── DEPENDS ON: prisma.ts, schema.prisma, .env
├── PRODUCES: wallet-service.ts, ledger-service.ts, constants.ts, wallet-types.ts
└── CONSUMED BY: Steps 2, 3, 4, 5, 6, 8

Step 2: FD Service
├── DEPENDS ON: wallet-service.ts (lockForFD, unlockFromFD), constants.ts
├── PRODUCES: fd-calculator.ts, fd-service.ts, fd-types.ts
└── CONSUMED BY: Steps 6, 8, 9

Step 3: Fraud Engine
├── DEPENDS ON: ledger-service.ts (recent transactions), wallet-service.ts (balance), constants.ts
├── PRODUCES: fraud-engine.ts, 6 rule files, fraud-types.ts
└── CONSUMED BY: Steps 4, 6, 9

Step 4: PayU Hash Service
├── DEPENDS ON: wallet-service.ts (spendBalance), fraud-engine.ts (checkTransaction), .env (PAYU_KEY, PAYU_SALT)
├── PRODUCES: payu-hash.ts, payu-service.ts, payu-types.ts
└── CONSUMED BY: Step 6, 9

Step 5: OTP Service
├── DEPENDS ON: wallet-service.ts (holdForFraud), constants.ts, .env (TWILIO_*)
├── PRODUCES: otp-service.ts, otp-types.ts
└── CONSUMED BY: Step 6

Step 6: API Routes
├── DEPENDS ON: ALL services (Steps 1-5), withAuth middleware (Step 7)
├── PRODUCES: All implemented route.ts files
└── CONSUMED BY: Frontend (Phase 3)

Step 7: Auth Hardening
├── DEPENDS ON: prisma.ts, .env (JWT_SECRET)
├── PRODUCES: src/middleware/auth.ts, updated login/register routes
└── CONSUMED BY: Step 6 (all routes use withAuth)

Step 8: Cron Jobs
├── DEPENDS ON: wallet-service.ts, ledger-service.ts, fd-service.ts, constants.ts
├── PRODUCES: cron/*.ts files
└── CONSUMED BY: Server startup, cron API routes

Step 9: Tests
├── DEPENDS ON: fd-calculator.ts, fraud-engine.ts, payu-hash.ts
├── PRODUCES: __tests__/*.test.ts files
└── CONSUMED BY: CI/CD pipeline
```

---

## Complete API Endpoint List After Phase 2

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | None | Login with email/password, returns JWT |
| POST | `/api/auth/register` | None | Register new user, creates wallet |
| POST | `/api/auth/refresh` | JWT | Refresh JWT token |

### Wallet
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/wallet/:userId` | JWT | Get all four balance types |
| GET | `/api/wallet/:userId/ledger` | JWT | Full ledger with filters |
| POST | `/api/wallet/:userId/credit` | JWT | Create pending cashback entry |
| POST | `/api/wallet/:userId/settle` | JWT | Convert pending to available |
| POST | `/api/wallet/:userId/spend` | JWT | Deduct available for PayU |
| GET | `/api/wallet/:userId/analytics` | JWT | Category breakdown and monthly trend |

### Fixed Deposits
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/fd/create` | JWT | Create new FD (atomic wallet deduction) |
| GET | `/api/fd/:fdId` | JWT | Get FD status and accrued interest |
| GET | `/api/fd/user/:userId` | JWT | All FDs for a user |
| POST | `/api/fd/:fdId/break` | JWT | Break FD early with penalty |

### Fraud Detection
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/fraud/check` | JWT | Run fraud check on a transaction |
| POST | `/api/fraud/otp/generate` | JWT | Generate and deliver OTP |
| POST | `/api/fraud/otp/verify` | JWT | Verify submitted OTP |

### PayU Payments
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/payu/initiate` | JWT | Build PayU form params for redirect |
| POST | `/api/payu/webhook` | None (hash verified) | Handle PayU success/failure callback |
| POST | `/api/payu/verify` | JWT | Manual hash verification |

### Advisor (Stub)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/advisor/:userId` | JWT | Get latest recommendation (stub returns seed data) |
| POST | `/api/advisor/:userId/refresh` | JWT | Trigger new analysis (stub in Phase 2) |

### Merchants
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/merchants` | JWT | List all active merchants |
| GET | `/api/merchants/:merchantId` | JWT | Get merchant details |

### Cron (Internal)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/cron/settle-pending` | CRON_SECRET | Manually trigger settlement job |
| POST | `/api/cron/mature-fds` | CRON_SECRET | Manually trigger FD maturity job |
| POST | `/api/cron/weekly-advisor` | CRON_SECRET | Manually trigger advisor job |

**Total: 24 endpoints**

---

## Phase 2 Verification Checklist

Complete every item before declaring Phase 2 done and moving to Phase 3.

### Step 1 — Wallet Service
- [ ] `getWalletBalance` returns all four balance types for all 5 seed personas
- [ ] `creditCashback` creates a PENDING ledger entry and increments pendingBalance
- [ ] `creditCashback` does NOT touch availableBalance
- [ ] `settlePendingEntry` atomically moves from pending to available
- [ ] `settlePendingEntry` throws if entry is already settled (idempotency)
- [ ] `spendBalance` rejects when amount > availableBalance
- [ ] `spendBalance` never touches pendingBalance or lockedBalance
- [ ] `lockForFD` atomically decrements available and increments locked
- [ ] `unlockFromFD` atomically decrements locked and increments available + interest
- [ ] All wallet mutations use `prisma.$transaction()`
- [ ] `balanceAfter` on every ledger entry matches the wallet snapshot after the operation
- [ ] `constants.ts` has all named constants — no magic numbers in service files

### Step 2 — FD Service
- [ ] `calculateMaturityAmount(100000, 7.5, 30)` returns exactly 100616
- [ ] `calculateMaturityAmount(100000, 7.5, 365)` returns exactly 107500
- [ ] `createFD` rejects principal below ₹500 (50000 paisa)
- [ ] `createFD` rejects tenure below 30 days
- [ ] `createFD` rejects tenure above 365 days
- [ ] `createFD` atomically deducts available and increments locked
- [ ] `breakFDEarly` rejects if within first 7 days
- [ ] `breakFDEarly` applies 1% penalty to principal
- [ ] `matureFD` credits full principal + interest to available
- [ ] `getFDsDueForMaturity` returns only ACTIVE FDs past their maturity date

### Step 3 — Fraud Engine
- [ ] Whitelist rule fires for Priya (3+ Zomato transactions in last 5 debits)
- [ ] Whitelist rule does NOT fire for Vikram (different merchants each time)
- [ ] Speed rule fires when spend is within 90 seconds of last credit
- [ ] Speed rule does NOT fire when whitelist has already returned ALLOW
- [ ] Amount rule fires when transaction > 80% of available balance
- [ ] Frequency rule fires when 3+ transactions in 5 minutes
- [ ] New user rule fires for Arjun (account < 7 days) on spend > ₹2,000
- [ ] Night rule fires between 1am and 4am IST for amounts > ₹2,000
- [ ] `checkTransaction` returns `{ action: 'ALLOW' }` for normal transactions
- [ ] `checkTransaction` returns `{ action: 'REQUIRE_OTP' }` for speed/amount/night violations
- [ ] `checkTransaction` returns `{ action: 'BLOCK' }` for new user violations
- [ ] `checkTransaction` returns `{ action: 'FREEZE' }` for frequency violations

### Step 4 — PayU Hash Service
- [ ] `generatePayUHash` produces correct SHA512 for known test inputs
- [ ] `verifyPayUResponseHash` returns true for valid PayU response
- [ ] `verifyPayUResponseHash` returns false for tampered response
- [ ] Amount in hash is formatted as decimal string with 2 decimal places
- [ ] `PAYU_KEY` and `PAYU_SALT` are never logged or returned to client
- [ ] `handlePayUSuccess` rejects if hash verification fails
- [ ] `handlePayUSuccess` uses stored amount, not response amount
- [ ] Duplicate webhook delivery is handled idempotently

### Step 5 — OTP Service
- [ ] `generateOTP` creates a 6-digit code expiring in 5 minutes
- [ ] `generateOTP` invalidates previous OTPs for same user and purpose
- [ ] `verifyOTP` returns `OTP_EXPIRED` for expired codes
- [ ] `verifyOTP` increments attempt counter on each wrong attempt
- [ ] `verifyOTP` returns `ACCOUNT_FROZEN` after 3 wrong attempts
- [ ] `verifyOTP` marks OTP as used on successful verification
- [ ] OTP code is never present in any log output
- [ ] System works without Twilio (display mode fallback)

### Step 6 — API Routes
- [ ] All 24 endpoints return responses in `{ data: ... }` or `{ error: { message, code } }` shape
- [ ] All POST routes validate request body with Zod before calling service
- [ ] All authenticated routes return 401 if JWT is missing or invalid
- [ ] All authenticated routes return 403 if userId in JWT doesn't match resource
- [ ] PayU webhook route does not require JWT but does verify hash
- [ ] Cron routes require `CRON_SECRET` header
- [ ] No route file imports another route file

### Step 7 — Auth Hardening
- [ ] `withAuth` middleware extracts userId from JWT correctly
- [ ] Login route validates email format and password length with Zod
- [ ] Register route validates all fields with Zod
- [ ] `JWT_SECRET` fallback removed — throws if not set
- [ ] Password is never returned in any response
- [ ] Login returns same error for "user not found" and "wrong password"
- [ ] Token refresh endpoint works

### Step 8 — Cron Jobs
- [ ] Settlement cron processes all PENDING entries older than 24 hours
- [ ] Settlement cron continues if one entry fails (logs error, moves on)
- [ ] FD maturity cron processes all ACTIVE FDs past maturity date
- [ ] FD maturity cron continues if one FD fails (logs error, moves on)
- [ ] Weekly advisor cron runs for all users (stub logs, no Claude call yet)
- [ ] All three cron jobs can be triggered manually via their API routes
- [ ] Cron API routes reject requests without `CRON_SECRET` header
- [ ] `isRunning` flag prevents concurrent cron runs

### Step 9 — Tests
- [ ] `npm test` runs without errors
- [ ] Fraud whitelist test: Priya passes (5 Zomato transactions → ALLOW)
- [ ] Fraud whitelist test: Vikram fails (different merchants → speed rule fires)
- [ ] FD calculator test: ₹1,000 for 30 days = ₹1,006.16 (100616 paisa)
- [ ] FD calculator test: ₹1,000 for 365 days = ₹1,075.00 (107500 paisa)
- [ ] FD calculator test: validation rejects ₹499 principal
- [ ] PayU hash test: known inputs produce correct SHA512
- [ ] PayU hash test: tampered response fails verification
- [ ] All tests use mocked database — no real DB required to run tests

### Final Integration Check
- [ ] Seed all 5 personas: `npm run seed` completes without errors
- [ ] All 5 personas have correct wallet balances matching PRD
- [ ] Priya (priya.sharma@email.com) — available ₹4,280, pending ₹340, locked ₹2,000
- [ ] Arjun (arjun.mehta@email.com) — available ₹180, pending ₹90, locked ₹0
- [ ] Meera (meera.nair@email.com) — available ₹3,100, locked ₹1,000
- [ ] Rajan (rajan.kumar@email.com) — available ₹620, locked ₹5,000
- [ ] Vikram (vikram.singh@email.com) — available ₹1,500, pending ₹500
- [ ] GET `/api/wallet/:userId` returns correct balances for all 5 personas
- [ ] POST `/api/fd/create` with ₹499 returns 400 error
- [ ] POST `/api/fd/create` with ₹500 for 30 days succeeds and deducts from available
- [ ] Fraud check for Vikram with rapid spend returns `REQUIRE_OTP`
- [ ] Fraud check for Priya with Zomato spend returns `ALLOW`
- [ ] PayU hash generation produces a non-empty SHA512 string
- [ ] Settlement cron API route processes pending entries when called manually

---

## File Creation Order (Strict Sequence)

```
1.  src/lib/constants.ts
2.  src/services/wallet/wallet-types.ts
3.  src/services/wallet/wallet-service.ts
4.  src/services/wallet/ledger-service.ts
5.  src/services/fd/fd-types.ts
6.  src/services/fd/fd-calculator.ts
7.  src/services/fd/fd-service.ts
8.  src/services/fraud/fraud-types.ts
9.  src/services/fraud/rules/whitelist-rule.ts
10. src/services/fraud/rules/speed-rule.ts
11. src/services/fraud/rules/amount-rule.ts
12. src/services/fraud/rules/frequency-rule.ts
13. src/services/fraud/rules/new-user-rule.ts
14. src/services/fraud/rules/night-rule.ts
15. src/services/fraud/fraud-engine.ts
16. src/services/payu/payu-types.ts
17. src/services/payu/payu-hash.ts
18. src/services/payu/payu-service.ts
19. src/services/otp/otp-types.ts
20. src/services/otp/otp-service.ts
21. src/middleware/auth.ts
22. src/app/api/auth/login/route.ts (modify — add Zod)
23. src/app/api/auth/register/route.ts (modify — add Zod)
24. src/app/api/auth/refresh/route.ts (implement)
25. src/app/api/wallet/[userId]/route.ts
26. src/app/api/wallet/[userId]/ledger/route.ts
27. src/app/api/wallet/[userId]/credit/route.ts
28. src/app/api/wallet/[userId]/settle/route.ts
29. src/app/api/wallet/[userId]/spend/route.ts
30. src/app/api/wallet/[userId]/analytics/route.ts
31. src/app/api/fd/create/route.ts
32. src/app/api/fd/[fdId]/route.ts
33. src/app/api/fd/user/[userId]/route.ts
34. src/app/api/fd/[fdId]/break/route.ts
35. src/app/api/fraud/check/route.ts
36. src/app/api/fraud/otp/generate/route.ts
37. src/app/api/fraud/otp/verify/route.ts
38. src/app/api/payu/initiate/route.ts
39. src/app/api/payu/webhook/route.ts
40. src/app/api/payu/verify/route.ts
41. src/app/api/advisor/[userId]/route.ts (stub)
42. src/app/api/advisor/[userId]/refresh/route.ts (stub)
43. src/cron/settle-pending.ts
44. src/cron/mature-fds.ts
45. src/cron/weekly-advisor.ts
46. src/cron/index.ts
47. src/app/api/cron/settle-pending/route.ts
48. src/app/api/cron/mature-fds/route.ts
49. src/app/api/cron/weekly-advisor/route.ts
50. src/__tests__/fd-calculator.test.ts
51. src/__tests__/fraud-whitelist.test.ts
52. src/__tests__/payu-hash.test.ts
```

---

## Complexity Summary

| Step | Component | Complexity | Reason |
|------|-----------|------------|--------|
| 1 | Wallet Service | High | Atomic snapshot + ledger pattern, all downstream depends on this |
| 2 | FD Service | Medium | Pure calculator functions + service layer following established pattern |
| 3 | Fraud Engine | High | Six rules with interaction logic, whitelist edge case, persona-specific behavior |
| 4 | PayU Hash Service | High | Exact hash construction, response verification, webhook idempotency |
| 5 | OTP Service | Low | Straightforward CRUD with clear business rules, optional Twilio |
| 6 | API Routes | Medium | Thin routes, but 24 endpoints with consistent Zod + auth pattern |
| 7 | Auth Hardening | Low | Well-established pattern, mainly fixing existing issues |
| 8 | Cron Jobs | Low | Thin orchestrators calling existing services |
| 9 | Tests | Low | Pure functions, mocked DB, well-defined test cases |

**Total estimated implementation time: 3-4 days for an experienced developer**

---

## Rules.md Compliance Summary

| Rule | How Phase 2 Enforces It |
|------|------------------------|
| Business logic in `/services` only | All logic in `src/services/` — routes call services and return |
| One file per responsibility | wallet-service, fd-calculator, fraud-engine, payu-hash, otp-service each own one concern |
| No circular route imports | Routes only import from services, never from other routes |
| Zero hardcoded secrets | All keys from `.env` via `constants.ts` — never in code |
| Never trust client amounts | PayU service re-fetches amount from DB before hash generation |
| Always verify PayU hash | `verifyPayUResponseHash` called before any wallet update |
| JWT on every endpoint | `withAuth` middleware wraps all authenticated routes |
| Never log sensitive data | OTP, hash, JWT, API keys explicitly excluded from all log calls |
| All amounts as integers (paisa) | All service functions use integer paisa — no floats |
| Every multi-table op uses transaction | All wallet mutations use `prisma.$transaction()` |
| Balance derived from ledger | `balanceAfter` recorded on every entry — wallet snapshot always in sync |
| UUID primary keys | All models use `@id @default(uuid())` |
| Functions do one thing | Each function named for its single responsibility |
| No function > 40 lines | Split into helpers if approaching limit |
| Named constants | All thresholds in `constants.ts` |
| External API calls have timeout | Twilio and PayU calls use axios with `timeout` config |
| Every async wrapped in try-catch | All service functions and route handlers have try-catch |
| Consistent error shape | `{ error: { message, code } }` on all error responses |
| Cron failures log and continue | Individual item failures caught, logged, batch continues |
| Zod on every route | All POST routes validate with Zod before service call |
