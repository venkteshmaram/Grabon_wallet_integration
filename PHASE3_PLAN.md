# GrabCash Wallet Intelligence Platform — Phase 3 Implementation Plan

> **Status:** Phase 1 Complete — Prisma schema, migrations, seed data (5 personas), config files, and auth scaffolding all exist.
> **Status:** Phase 2 Complete — All business logic services, API routes, fraud engine, FD service, PayU integration, OTP service, cron jobs, and tests all exist and work.
> **Goal:** Build the complete frontend UI and connect it to the backend. Every page must look like a real fintech product — not a tutorial app. Zero blank screens under any condition.

---

## Critical Architecture Decisions (Read Before Anything Else)

### Design System: Dark Charcoal + Gold
Every component in Phase 3 follows a strict design system. Gold is the primary accent — used only for CTAs, key highlights, and active states. No purple, pink, or violet anywhere. The dark charcoal theme is consistent across all pages.

### Currency Display: Rupees with ₹ Symbol
All amounts displayed to the user use the `₹` symbol with Inter font. The backend stores amounts in paisa (integers). The frontend converts paisa to rupees for display: `(amountPaisa / 100).toFixed(2)`. All formatting happens in the display layer — never in the store.

### State Management: Zustand
Two stores manage all client state:
- `auth-store.ts` — JWT token, userId, authentication state
- `wallet-store.ts` — wallet balance, ledger, FDs, advisor, analytics

### API Communication: Axios Client
A single Axios instance handles all API calls. It automatically attaches the JWT token from auth-store to every request. On 401 responses, it clears the auth store and redirects to `/login`. All errors are extracted into `{ error: { message, code } }` shape.

### Component Pattern: Loading → Success → Error
Every component handles three states:
1. **Loading** — gold-colored skeleton shimmer animation
2. **Success** — renders data with proper formatting
3. **Error** — red alert banner with retry button

No component should ever show a blank screen under any condition.

### Rules.md Compliance
- All business logic lives in services — components are thin display layers
- No hardcoded secrets — API base URL from environment
- JWT required on every API call — token from auth-store
- Every async function wrapped in try-catch — no unhandled promise rejections
- All errors return consistent shape — `{ error: { message, code } }`
- No function longer than 40 lines — split into helpers
- No magic numbers — named constants for all thresholds
- No commented-out code — no debug console.logs

---

## Phase 2 Deliverables (Already Complete)

| Item | Status | Location |
|------|--------|----------|
| Wallet Service (balance, credit, settle, spend, lock, unlock) | ✅ Done | `src/services/wallet/` |
| Ledger Service (queries, analytics, pending entries) | ✅ Done | `src/services/wallet/` |
| FD Calculator (maturity, interest, penalty, validation) | ✅ Done | `src/services/fd/` |
| FD Service (create, break, mature, query) | ✅ Done | `src/services/fd/` |
| Fraud Engine (6 rules + whitelist override) | ✅ Done | `src/services/fraud/` |
| PayU Hash Service (generate, verify, form params) | ✅ Done | `src/services/payu/` |
| OTP Service (generate, verify, freeze) | ✅ Done | `src/services/otp/` |
| Auth Routes (login, register, refresh) | ✅ Done | `src/app/api/auth/` |
| All 24 API Endpoints | ✅ Done | `src/app/api/` |
| Cron Jobs (settle, mature, advisor stub) | ✅ Done | `src/cron/` |
| Tests (fraud whitelist, FD calculator, PayU hash) | ✅ Done | `src/__tests__/` |
| JWT Auth Middleware | ✅ Done | `src/middleware/` |
| Named Constants | ✅ Done | `src/lib/constants.ts` |

---

## Phase 3 Overview — 15 Steps

```
Step 1:  Global Layout + Design Tokens     → globals.css, sidebar.tsx, header.tsx
Step 2:  Auth Pages                         → login/page.tsx, register/page.tsx
Step 3:  Zustand Stores                     → auth-store.ts, wallet-store.ts
Step 4:  API Client + Custom Hooks          → api-client.ts, 5 hook files
Step 5:  Balance Card Component             → balance-card.tsx
Step 6:  Claude Advisor Card Component      → advisor-card.tsx
Step 7:  Transaction Timeline Component     → transaction-timeline.tsx
Step 8:  Investment Portfolio Components    → fd-card.tsx, fd-portfolio.tsx
Step 9:  Spend Analytics Components         → donut-chart.tsx, bar-chart.tsx, top-merchants.tsx
Step 10: Fraud OTP Modal Component          → otp-modal.tsx
Step 11: Dashboard Page                     → dashboard/page.tsx, layout.tsx
Step 12: Wallet Pages                       → wallet/page.tsx, transactions/page.tsx, invest/page.tsx
Step 13: Merchant + Checkout Pages          → merchants, checkout, success, failure pages
Step 14: Analytics Page                     → analytics/page.tsx
Step 15: Claude Advisor Service (Real)      → context-builder.ts, prompt-builder.ts, claude-advisor.ts, API routes
```

---

## Step 1 — Global Layout + Design Tokens

### Files to Create / Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/app/globals.css` | Modify | Design tokens, Inter font, custom scrollbar, transitions |
| `src/components/layout/sidebar.tsx` | Create | Dark charcoal sidebar with gold accents, persona switcher |
| `src/components/layout/header.tsx` | Create | Top bar with persona name, time, notification bell |

### `globals.css` — Design Token System

**CSS Variables to Define:**
```
--bg-primary: #1A1A1A        (main background)
--bg-card: #242424           (card surfaces)
--bg-border: #2E2E2E         (borders and dividers)
--gold: #F5A623              (primary accent — all CTAs)
--gold-hover: #F7B84B        (hover state)
--gold-muted: rgba(245,166,35,0.12) (gold tinted backgrounds)
--green: #22C55E             (available balance, credits)
--slate: #94A3B8             (pending balance, muted)
--blue: #38BDF8              (FD operations)
--red: #EF4444               (fraud, errors, debits)
--text-primary: #F8F8F8      (main text)
--text-secondary: #A0A0A0   (labels, captions)
--text-disabled: #606060     (inactive)
```

**Additional Styles:**
- Import Inter from Google Fonts (`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap')`)
- Set `body` background to `var(--bg-primary)`, color to `var(--text-primary)`, font-family to `'Inter', sans-serif`
- Custom scrollbar: track in `#1A1A1A`, thumb in `#3A3A3A`, thumb hover in `var(--gold)`
- Transition utility classes: `.transition-colors { transition: color 150ms ease, background-color 150ms ease, border-color 150ms ease }`
- Gold skeleton shimmer keyframe animation for loading states

### `sidebar.tsx` — Navigation Sidebar

**Visual Layout:**
- Fixed left sidebar, width 260px on desktop
- Background: `var(--bg-card)` with right border `var(--bg-border)`
- Top section: GrabCash logo — "GrabCash" in `var(--gold)` font-weight 700, "Wallet" in `var(--text-primary)` font-weight 400
- Navigation items stacked vertically with 8px gap

**Navigation Items (4 total):**
| Label | Icon | Route |
|-------|------|-------|
| Dashboard | LayoutDashboard (lucide) | `/dashboard` |
| Wallet | Wallet (lucide) | `/wallet` |
| Merchants | Store (lucide) | `/merchants` |
| Analytics | BarChart3 (lucide) | `/analytics` |

**Active State:**
- Gold left border 3px on the active item
- Gold text color on active item label
- Gold-muted background on active item row
- Inactive items: `var(--text-secondary)` text, transparent background

**Bottom Section — Persona Switcher:**
- Dropdown showing all 5 personas with their role labels:
  - Priya Sharma — Power User
  - Arjun Mehta — New User
  - Meera Nair — Traveler
  - Rajan Kumar — Saver
  - Vikram Singh — Fraud Case
- Clicking any persona:
  1. Calls `loginAsPersona(email)` from auth-store
  2. Receives new JWT token
  3. Calls `refreshAll(userId)` to load that persona's data
  4. All dashboard sections update instantly — no page reload
- Below persona switcher: Logout button with `LogOut` icon in `var(--text-secondary)`

**Mobile Responsive:**
- On screens below 768px: sidebar collapses to a bottom tab bar
- Bottom tab bar shows 4 icons (no labels) with gold active indicator
- Persona switcher moves to a modal triggered from the header

### `header.tsx` — Top Bar

**Visual Layout:**
- Fixed top bar, height 64px, full width minus sidebar
- Background: `var(--bg-card)` with bottom border `var(--bg-border)`
- Left: current page title in `var(--text-primary)` font-weight 700 20px
- Right section (flex row, gap 16px):
  - Current time and date in IST format (e.g., "Wed, 12 Mar 2025 · 2:47 PM") in `var(--text-secondary)` 14px
  - Notification bell icon (`Bell` from lucide) — decorative, no functionality
  - Persona avatar: gold circle (40px) with initials in charcoal text font-weight 700
  - Persona name in `var(--text-primary)` 14px

### Dependencies from Phase 2
- None — this step is purely visual, no backend calls

### What Can Go Wrong
| Risk | Handling |
|------|---------|
| Inter font fails to load | Fallback to system sans-serif: `'Inter', -apple-system, BlinkMacSystemFont, sans-serif` |
| Sidebar overlaps content on resize | Use CSS grid with `grid-template-columns: 260px 1fr` on desktop, single column on mobile |
| Persona switcher dropdown clips off screen | Position dropdown above the trigger button, not below |
| Active route detection fails | Use `usePathname()` from `next/navigation` to match current route |

### Estimated Complexity: **Medium**
Reason: The sidebar with persona switcher and mobile responsive bottom tab bar requires careful layout work. The design token system must be correct — every subsequent component depends on it.

---

## Step 2 — Auth Pages

### Files to Create

| File | Purpose |
|------|---------|
| `src/app/(auth)/login/page.tsx` | Login page with 5 persona quick-login buttons |
| `src/app/(auth)/register/page.tsx` | Registration page with form validation |

### `login/page.tsx` — Login Page

**Visual Layout:**
- Full screen dark background (`var(--bg-primary)`)
- Centered card (max-width 420px) with `var(--bg-card)` background, 12px border-radius, `var(--bg-border)` border
- Card padding: 32px

**Card Content (top to bottom):**
1. Logo: "GrabCash" in `var(--gold)` 32px font-weight 700
2. Tagline: "Your cashback. Invested." in `var(--text-secondary)` 16px
3. Spacer: 32px
4. Email input: dark background (`#1A1A1A`), `var(--bg-border)` border, gold focus ring (`var(--gold)` border on focus), placeholder "Email address"
5. Password input: same styling, placeholder "Password", type password
6. Spacer: 16px
7. "Sign In" button: full width, `var(--gold)` background, charcoal (`#1A1A1A`) text, font-weight 600, 8px border-radius, height 48px
8. Spacer: 24px
9. Divider line with "Quick Demo Login" text centered in `var(--text-secondary)` 12px
10. 5 persona quick-login buttons in a vertical stack with 8px gap

**Persona Quick-Login Buttons:**
Each button is a row with:
- Left: persona name in `var(--text-primary)` 14px
- Right: role label in `var(--text-secondary)` 12px
- Background: transparent, border `var(--bg-border)`, 8px border-radius
- Hover: `var(--gold-muted)` background, `var(--gold)` border
- Height: 44px

**Persona Credentials:**
| Persona | Email | Password |
|---------|-------|----------|
| Priya Sharma — Power User | priya.sharma@email.com | password123 |
| Arjun Mehta — New User | arjun.mehta@email.com | password123 |
| Meera Nair — Traveler | meera.nair@email.com | password123 |
| Rajan Kumar — Saver | rajan.kumar@email.com | password123 |
| Vikram Singh — Fraud Case | vikram.singh@email.com | password123 |

**Behaviour:**
- Clicking any persona button calls `POST /api/auth/login` with that persona's email and `password123`
- Show gold loading spinner on the clicked button during API call
- On success: store JWT token in auth-store, redirect to `/dashboard`
- On error: show red error message below the button area (e.g., "Invalid credentials")
- Manual sign-in form also calls `POST /api/auth/login` with entered email and password
- Link to register page below the card: "Don't have an account? Register" in `var(--text-secondary)`

### `register/page.tsx` — Registration Page

**Visual Layout:**
- Same visual style as login page — centered card, dark background
- Card max-width 420px

**Form Fields:**
1. Name input — placeholder "Full Name"
2. Email input — placeholder "Email address"
3. Phone input — placeholder "Phone number (optional)"
4. Password input — placeholder "Password (min 8 characters)"

**All inputs:** dark background, gold focus ring, same styling as login

**Button:** "Create Account" — full width, gold background, charcoal text

**Behaviour:**
- Calls `POST /api/auth/register` with form data
- Client-side validation: name required, email format, password min 8 chars
- On success: redirect to `/login` with success message
- On error: show field-level error messages in red below each input
- Link back to login: "Already have an account? Sign In"

### Dependencies from Phase 2
- `POST /api/auth/login` — returns JWT token and user data
- `POST /api/auth/register` — creates user and wallet

### What Can Go Wrong
| Risk | Handling |
|------|---------|
| Login API returns 401 | Show "Invalid email or password" in red — same message for both cases |
| Network error during login | Show "Unable to connect. Please try again." with retry |
| Register with existing email | Show "An account with this email already exists" |
| JWT token not stored properly | Verify token is persisted in auth-store before redirect |
| Redirect loop if already authenticated | Check auth state on mount — if authenticated, redirect to `/dashboard` immediately |

### Estimated Complexity: **Low**
Reason: Standard auth forms with well-defined API contracts. The persona quick-login buttons are the only non-standard element.

---

## Step 3 — Zustand Stores

### Files to Create

| File | Purpose |
|------|---------|
| `src/store/auth-store.ts` | JWT token, authentication state, login/logout actions |
| `src/store/wallet-store.ts` | Wallet balance, ledger, FDs, advisor, analytics — all data |

### `auth-store.ts` — Authentication Store

**State:**
```
token: string | null
userId: string | null
userName: string | null
userEmail: string | null
isAuthenticated: boolean
isLoading: boolean
error: string | null
```

**Actions:**

**`login(email: string, password: string)`**
1. Sets `isLoading = true`, `error = null`
2. Calls `POST /api/auth/login` with `{ email, password }`
3. On success: stores `token`, `userId`, `userName`, `userEmail` from response, sets `isAuthenticated = true`
4. On error: sets `error` to the error message from response
5. Sets `isLoading = false`
6. Returns `{ success: boolean }` so the caller can redirect

**`loginAsPersona(email: string)`**
Convenience wrapper — calls `login(email, 'password123')`. Used by persona switcher and quick-login buttons.

**`logout()`**
1. Clears `token`, `userId`, `userName`, `userEmail`
2. Sets `isAuthenticated = false`
3. Calls `clearStore()` on wallet-store to wipe all data
4. Redirects to `/login` using `window.location.href` (hard redirect to clear all state)

**`getAuthHeader()`**
Returns `{ Authorization: 'Bearer ' + token }` if token exists, empty object otherwise. Used by the API client.

**Persistence:**
Token is stored in `localStorage` under key `grabcash-token`. On app load, the store checks `localStorage` for an existing token and restores the session. This prevents logout on page refresh.

### `wallet-store.ts` — Wallet Data Store

**State:**
```
currentUser: { id: string, name: string, email: string, phone: string } | null
wallet: { availableBalance: number, pendingBalance: number, lockedBalance: number, lifetimeEarned: number } | null
ledger: LedgerEntry[] | null
fds: FDRecord[] | null
advisor: AdvisorRecommendation | null
analytics: WalletAnalytics | null
isLoading: boolean
error: string | null
```

**Actions:**

**`setUser(user)`**
Sets `currentUser` with the user object.

**`fetchWallet(userId: string)`**
Calls `GET /api/wallet/:userId`. Stores the wallet balance object. Converts paisa to rupees for display. Sets `isLoading` during fetch.

**`fetchLedger(userId: string, filters?: LedgerFilters)`**
Calls `GET /api/wallet/:userId/ledger` with optional query params for type filter, date range, and pagination. Stores the ledger entries array.

**`fetchFDs(userId: string)`**
Calls `GET /api/fd/user/:userId`. Stores the FD records array with computed accrued interest.

**`fetchAdvisor(userId: string)`**
Calls `GET /api/advisor/:userId`. Stores the advisor recommendation object. Handles null gracefully — new users may not have a recommendation yet.

**`fetchAnalytics(userId: string)`**
Calls `GET /api/wallet/:userId/analytics`. Stores the analytics object with category breakdown, monthly trend, top merchants, and savings rate.

**`refreshAll(userId: string)`**
Calls all five fetch functions in parallel using `Promise.allSettled()`. This ensures one failed fetch doesn't block the others. Sets `isLoading = true` before, `false` after all settle. Used on dashboard mount and after persona switch.

**`clearStore()`**
Resets all state to initial values. Called on logout.

### TypeScript Types

**`LedgerEntry`**
```
id: string
type: 'CASHBACK_CREDIT' | 'CASHBACK_SETTLEMENT' | 'PAYU_SPEND' | 'FD_LOCK' | 'FD_UNLOCK' | 'FD_INTEREST' | 'FRAUD_HOLD' | 'FRAUD_RELEASE'
direction: 'CREDIT' | 'DEBIT'
amount: number (rupees, converted from paisa)
balanceAfter: number
status: 'PENDING' | 'SETTLED' | 'HELD' | 'RELEASED' | 'FAILED'
merchantId: string | null
merchantName: string | null
category: string | null
description: string | null
fdId: string | null
isFlagged: boolean
flagReason: string | null
createdAt: string (ISO date)
settledAt: string | null
```

**`FDRecord`**
```
id: string
principal: number (rupees)
interestRate: number
tenureDays: number
maturityAmount: number (rupees)
interestEarned: number (rupees)
startDate: string
maturityDate: string
status: 'ACTIVE' | 'MATURED' | 'BROKEN'
accruedInterest: number (rupees, live calculated)
daysRemaining: number
penaltyAmount: number | null
actualReturn: number | null
brokenAt: string | null
```

**`AdvisorRecommendation`**
```
id: string
summary: string
recommendation: string
actionItems: string[]
alert: string | null
generatedAt: string
```

**`WalletAnalytics`**
```
categoryBreakdown: { category: string, amount: number, percentage: number }[]
monthlyTrend: { month: string, earned: number, spent: number }[]
topMerchants: { merchantName: string, category: string, cashback: number, transactionCount: number }[]
savingsRate: number
totalEarned: number
totalSpent: number
```

### Dependencies from Phase 2
- All API endpoints from Phase 2 Step 6
- JWT token format from auth routes

### What Can Go Wrong
| Risk | Handling |
|------|---------|
| `localStorage` not available (SSR) | Check `typeof window !== 'undefined'` before accessing localStorage |
| Token expired between page loads | API client interceptor catches 401, clears store, redirects to login |
| `refreshAll` partially fails | `Promise.allSettled` ensures all fetches complete — failed ones set null, successful ones populate |
| Paisa-to-rupee conversion precision | Use `(paisa / 100).toFixed(2)` — never `parseFloat` on the result |
| Store state stale after persona switch | `refreshAll` replaces all state — no merge, full replacement |

### Estimated Complexity: **Medium**
Reason: Two stores with clear responsibilities. The `refreshAll` parallel fetch pattern and localStorage persistence require careful implementation. Type definitions must match the API response shapes exactly.

---

## Step 4 — API Client + Custom Hooks

### Files to Create

| File | Purpose |
|------|---------|
| `src/utils/api-client.ts` | Axios instance with auth interceptor |
| `src/hooks/use-wallet.ts` | Fetches and returns wallet balance |
| `src/hooks/use-transactions.ts` | Fetches ledger with filter support |
| `src/hooks/use-fd-portfolio.ts` | Fetches FDs, exposes createFD and breakFD |
| `src/hooks/use-advisor.ts` | Fetches recommendation, exposes refresh |
| `src/hooks/use-analytics.ts` | Fetches analytics data for charts |

### `api-client.ts` — Axios Instance

**Configuration:**
- Base URL: `process.env.NEXT_PUBLIC_APP_URL` or `''` (same-origin for Next.js API routes)
- Default timeout: 15000ms (15 seconds)
- Default headers: `Content-Type: application/json`

**Request Interceptor:**
- Reads token from auth-store using `useAuthStore.getState().token`
- If token exists, adds `Authorization: Bearer <token>` header
- Never logs the token

**Response Interceptor — Error Handling:**
- On 401 response: calls `useAuthStore.getState().logout()` — clears token, redirects to `/login`
- On any error response: extracts `{ error: { message, code } }` from response body
- If response body doesn't match expected shape: creates a generic error `{ message: 'An unexpected error occurred', code: 'UNKNOWN_ERROR' }`
- Throws the extracted error so callers can catch it

**Exported Functions:**
- `apiClient` — the configured Axios instance
- `apiGet<T>(url: string, params?: object): Promise<T>` — typed GET wrapper
- `apiPost<T>(url: string, data?: object): Promise<T>` — typed POST wrapper

### `use-wallet.ts` — Wallet Balance Hook

**Returns:**
```
wallet: WalletBalance | null
isLoading: boolean
error: string | null
refetch: () => Promise<void>
```

**Behaviour:**
- On mount: calls `fetchWallet(userId)` from wallet-store
- Exposes `refetch` for manual refresh after transactions
- Returns wallet data from store (not local state — single source of truth)

### `use-transactions.ts` — Transaction Ledger Hook

**Parameters:**
```
userId: string
filter?: 'ALL' | 'CREDITS' | 'SPENDS' | 'FD' | 'FLAGGED'
page?: number
pageSize?: number
```

**Returns:**
```
transactions: LedgerEntry[]
isLoading: boolean
error: string | null
totalCount: number
refetch: () => Promise<void>
```

**Behaviour:**
- On mount and when filter changes: calls `fetchLedger(userId, filters)` from wallet-store
- Supports pagination with page and pageSize params
- Filter maps to API query params:
  - `CREDITS` → `type=CASHBACK_CREDIT,CASHBACK_SETTLEMENT,FD_INTEREST`
  - `SPENDS` → `type=PAYU_SPEND`
  - `FD` → `type=FD_LOCK,FD_UNLOCK`
  - `FLAGGED` → `isFlagged=true`

### `use-fd-portfolio.ts` — FD Portfolio Hook

**Returns:**
```
fds: FDRecord[]
totalPortfolioValue: number
isLoading: boolean
error: string | null
createFD: (principal: number, tenureDays: number) => Promise<FDRecord>
breakFD: (fdId: string) => Promise<FDRecord>
refetch: () => Promise<void>
```

**Behaviour:**
- On mount: calls `fetchFDs(userId)` from wallet-store
- `createFD` calls `POST /api/fd/create` with `{ principal, tenureDays }`, then refetches FDs and wallet balance
- `breakFD` calls `POST /api/fd/:fdId/break`, then refetches FDs and wallet balance
- `totalPortfolioValue` computed as sum of all active FD maturity amounts

### `use-advisor.ts` — Advisor Recommendation Hook

**Returns:**
```
advisor: AdvisorRecommendation | null
isLoading: boolean
isRefreshing: boolean
error: string | null
refresh: () => Promise<void>
```

**Behaviour:**
- On mount: calls `fetchAdvisor(userId)` from wallet-store
- `refresh` calls `POST /api/advisor/:userId/refresh` — this triggers a real Claude API call
- `isRefreshing` is separate from `isLoading` — shows "Analysing your financial patterns..." text during refresh (may take 5-10 seconds)
- On refresh success: updates advisor state in store

### `use-analytics.ts` — Analytics Data Hook

**Returns:**
```
analytics: WalletAnalytics | null
isLoading: boolean
error: string | null
refetch: () => Promise<void>
```

**Behaviour:**
- On mount: calls `fetchAnalytics(userId)` from wallet-store
- Returns analytics data from store for chart components to consume

### Dependencies from Previous Steps
- Step 3: `auth-store.ts` — for token in API client
- Step 3: `wallet-store.ts` — all hooks read from and write to this store
- Phase 2: All API endpoints

### What Can Go Wrong
| Risk | Handling |
|------|---------|
| API client created before store is initialized | Use `getState()` in interceptor (lazy access), not a captured reference |
| Hook called without userId | Guard with early return — if no userId, return null data and don't fetch |
| Multiple components calling same hook | Zustand store is the single source of truth — no duplicate fetches if data exists |
| Advisor refresh takes too long | 15-second timeout on API client — show timeout error if exceeded |
| Filter change triggers unnecessary refetch | Use `useEffect` dependency array with filter value — only refetch when filter actually changes |

### Estimated Complexity: **Medium**
Reason: The API client interceptor pattern is well-established. Hooks are thin wrappers around store actions. The main complexity is ensuring all hooks handle loading/error states consistently.

---

## Step 5 — Balance Card Component

### Files to Create

| File | Purpose |
|------|---------|
| `src/components/features/wallet/balance-card.tsx` | Hero balance card for dashboard and wallet page |

### Visual Layout

**Card Container:**
- Full width, `var(--bg-card)` background, 12px border-radius
- Gold top border 3px (`var(--gold)`)
- Padding: 24px
- Shadow: `0 4px 24px rgba(0,0,0,0.4)`

**Top Row:**
- Left: "GrabCash Wallet" label in `var(--text-secondary)` 14px font-weight 500
- Right: account age badge (e.g., "6 months") in `var(--text-secondary)` 12px with a subtle `var(--bg-border)` background pill

**Available Balance Section (most prominent):**
- Label: "Available Balance" in `var(--text-secondary)` 14px
- Amount: e.g., `₹4,280.00` in `var(--green)` 48px font-weight 700
- Subtitle: "Ready to spend or invest" in `var(--text-secondary)` 12px

**Three Balance Stats Row (flex, gap 24px):**
| Stat | Color | Icon | Tooltip |
|------|-------|------|---------|
| Pending | `var(--slate)` | Clock (lucide) | "Settles in 24 hours" |
| Locked | `var(--gold)` | Lock (lucide) | "Earliest unlock: [date]" |
| Lifetime Earned | `var(--gold)` | Sparkles (lucide) | "Total cashback earned" |

Each stat shows: icon + label (12px `var(--text-secondary)`) + amount (20px font-weight 600 in respective color)

**Three Action Buttons Row (flex, gap 12px):**
| Button | Style | Route |
|--------|-------|-------|
| "Pay with GrabCash" | Primary — gold background, charcoal text | `/checkout` |
| "Invest in GrabSave" | Secondary — transparent bg, gold border, gold text | `/wallet/invest` |
| "View History" | Ghost — transparent bg, no border, `var(--text-secondary)` text | `/wallet/transactions` |

**Props:**
```
wallet: {
  availableBalance: number
  pendingBalance: number
  lockedBalance: number
  lifetimeEarned: number
} | null
accountAge?: string
isLoading: boolean
```

**Loading State:**
- Gold skeleton shimmer blocks replacing each text element
- Three shimmer blocks for balance stats
- Three shimmer blocks for action buttons

**Error State:**
- Red alert banner: "Failed to load wallet balance"
- "Retry" button in red outline

### Dependencies from Previous Steps
- Step 3: `wallet-store.ts` — wallet balance data
- Step 1: Design tokens from `globals.css`

### What Can Go Wrong
| Risk | Handling |
|------|---------|
| Wallet data is null on first render | Show loading skeleton until data arrives |
| Balance is zero | Display `₹0.00` — never hide the balance section |
| Very large balance overflows | Use `Intl.NumberFormat('en-IN')` for Indian number formatting with commas |
| Account age calculation | Compute from user `createdAt` — show "X days" if < 30, "X months" if < 365, "X years" otherwise |

### Estimated Complexity: **Low**
Reason: Pure display component with well-defined props. The main work is getting the visual layout pixel-perfect.

---

## Step 6 — Claude Advisor Card Component

### Files to Create

| File | Purpose |
|------|---------|
| `src/components/features/advisor/advisor-card.tsx` | AI advisor recommendation display |

### Visual Layout

**Card Container:**
- `var(--bg-card)` background, 12px border-radius
- Gold-muted left border 4px (`var(--gold)`)
- Padding: 24px

**Header Row:**
- Left: "AI Financial Advisor" label in `var(--text-primary)` 16px font-weight 600 + Sparkles icon in `var(--gold)`
- Right: "Last updated [timestamp]" in `var(--text-secondary)` 12px (e.g., "2 hours ago")

**Summary Section:**
- Advisor summary text in `var(--text-primary)` 16px, line-height 1.6
- Merchant names and rupee amounts within the text rendered in `var(--gold)` font-weight 600

**Recommendation Section:**
- Gold highlighted box: `var(--gold-muted)` background, 8px border-radius, 16px padding
- Recommendation text in `var(--text-primary)` 15px
- Rupee amounts (e.g., `₹1,000`) rendered in `var(--gold)` font-weight 700

**Action Items Section:**
- List of 1-3 concrete steps
- Each item: gold arrow icon (`ChevronRight` from lucide) + action text in `var(--text-primary)` 14px
- If an action item contains an invest amount (e.g., "Invest ₹1,000 in GrabSave FD"):
  - Render as a clickable gold button instead of plain text
  - Clicking navigates to `/wallet/invest?amount=1000`
  - Button style: `var(--gold)` background, charcoal text, 6px border-radius

**Alert Section (conditional):**
- Only shown if `advisor.alert` is not null
- Amber warning box: `rgba(245,166,35,0.08)` background, `var(--gold)` left border 3px
- Bell icon (`Bell` from lucide) in `var(--gold)` + alert text in `var(--text-primary)` 14px

**Bottom Row:**
- "Refresh Analysis" button — secondary style (gold border, gold text, transparent bg)
- On click: calls `POST /api/advisor/:userId/refresh`
- During refresh: button shows gold spinner + "Analysing your financial patterns..." text
- Refresh may take 5-10 seconds (real Claude API call)

**Props:**
```
advisor: AdvisorRecommendation | null
isLoading: boolean
isRefreshing: boolean
onRefresh: () => Promise<void>
```

**Loading State (null advisor):**
- Show "Generating your personalised analysis..." text in `var(--text-secondary)` with gold shimmer animation
- Three shimmer blocks for summary, recommendation, and action items

**Error State:**
- Red alert: "Failed to load advisor recommendation"
- "Retry" button

### Dependencies from Previous Steps
- Step 4: `use-advisor.ts` hook
- Step 3: `wallet-store.ts` — advisor data

### What Can Go Wrong
| Risk | Handling |
|------|---------|
| Advisor is null for new users | Show skeleton with "Generating your personalised analysis..." — not an error |
| Refresh takes longer than 15 seconds | Show timeout message: "Analysis is taking longer than expected. Please try again." |
| Action items array is empty | Hide the action items section entirely — don't show an empty list |
| Alert is null | Hide the alert section entirely |
| Rupee amount parsing in action items | Use regex to detect `₹X,XXX` patterns and extract the numeric value for the invest link |

### Estimated Complexity: **Medium**
Reason: The conditional rendering (action items as buttons vs text, alert section visibility) and the refresh loading state require careful state management. Parsing rupee amounts from action item strings for deep-linking adds complexity.

---

## Step 7 — Transaction Timeline Component

### Files to Create

| File | Purpose |
|------|---------|
| `src/components/features/wallet/transaction-timeline.tsx` | Colour-coded transaction list with filters |

### Visual Layout

**Filter Tabs Row:**
- Horizontal tab bar with 5 tabs: All | Credits | Spends | FD | Flagged
- Active tab: `var(--gold)` text + gold underline 2px
- Inactive tabs: `var(--text-secondary)` text, no underline
- Tab bar has bottom border `var(--bg-border)`

**Transaction Entry (card row):**
Each entry is a horizontal row with padding 16px, border-bottom `var(--bg-border)`:

- **Left:** Colored icon circle (36px diameter)
  - Green circle + `ArrowUpRight` icon = Credit (CASHBACK_CREDIT, CASHBACK_SETTLEMENT, FD_UNLOCK, FD_INTEREST)
  - Red circle + `ArrowDownRight` icon = Debit (PAYU_SPEND)
  - Blue circle + `Landmark` icon = FD operation (FD_LOCK)
  - Orange circle + `AlertTriangle` icon = Flagged (isFlagged = true)

- **Center (flex column):**
  - Merchant name in `var(--text-primary)` 14px font-weight 500
  - Category + relative timestamp (e.g., "Food & Dining · 2 hours ago") in `var(--text-secondary)` 12px

- **Right (flex column, align right):**
  - Amount with +/- prefix and color:
    - Credits: `+₹340.00` in `var(--green)`
    - Debits: `-₹1,200.00` in `var(--red)`
    - FD Lock: `-₹1,000.00` in `var(--blue)`
    - FD Unlock: `+₹1,006.16` in `var(--blue)`
  - Status badge below amount:
    - PENDING: `var(--slate)` background pill, "Pending" text
    - SETTLED: `var(--green)` background pill, "Settled" text
    - HELD: orange background pill, "On Hold" text
    - FAILED: `var(--red)` background pill, "Failed" text

**Special Styling:**
- Pending entries: subtle pulsing animation (opacity 0.7 → 1.0, 2s loop)
- Flagged entries: orange left border 3px on the row
- Flagged entries show flag reason in `var(--text-secondary)` 11px italic below the category line

**Empty State:**
- Centered wallet icon (lucide `Wallet`) in `var(--text-disabled)` 48px
- "No transactions yet" in `var(--text-secondary)` 16px
- "Start earning cashback to see your transaction history" in `var(--text-disabled)` 14px

**Props:**
```
transactions: LedgerEntry[]
isLoading: boolean
filter: string
onFilterChange: (filter: string) => void
maxItems?: number (default: all)
showViewAll?: boolean
onViewAll?: () => void
```

**Loading State:**
- 5 shimmer rows matching the transaction entry layout

### Dependencies from Previous Steps
- Step 4: `use-transactions.ts` hook
- Step 3: `wallet-store.ts` — ledger data

### What Can Go Wrong
| Risk | Handling |
|------|---------|
| Empty ledger for new user (Arjun) | Show empty state — not an error |
| Very long merchant name | Truncate with ellipsis at 200px max-width |
| Timestamp formatting | Use `date-fns` `formatDistanceToNow` for relative time, `format` for absolute |
| Filter returns no results | Show "No transactions match this filter" — different from empty state |
| Flagged filter for users with no flagged transactions | Show empty filter state |

### Estimated Complexity: **Medium**
Reason: The colour-coding logic, filter tabs, status badges, and special styling for pending/flagged entries require careful conditional rendering. The component must handle 5 different visual states per entry.

---

## Step 8 — Investment Portfolio Components

### Files to Create

| File | Purpose |
|------|---------|
| `src/components/features/investment/fd-card.tsx` | Individual FD card with break modal |
| `src/components/features/investment/fd-portfolio.tsx` | Portfolio grid with total value |

### `fd-card.tsx` — Individual FD Card

**Visual Layout:**
- `var(--bg-card)` background, 12px border-radius, `var(--bg-border)` border
- Padding: 20px

**Header Row:**
- Left: "GrabSave FD" in `var(--text-primary)` 16px font-weight 600
- Right: Status badge
  - Active: `var(--green)` background pill, "Active" text
  - Matured: `var(--blue)` background pill, "Matured" text
  - Broken: `var(--red)` background pill, "Broken" text

**Content:**
- Principal amount: e.g., `₹1,000.00` in `var(--text-primary)` 24px font-weight 700
- Interest rate: "7.5% p.a." in `var(--gold)` 14px font-weight 600
- Maturity date + days remaining: e.g., "Matures: 15 Apr 2025 · 12 days remaining" in `var(--text-secondary)` 13px
- Projected return: "Maturity Amount: ₹1,006.16" in `var(--green)` 14px font-weight 500
- Interest accrued so far: "Interest Accrued: ₹3.42" in `var(--gold)` 14px

**Progress Bar:**
- Full width bar, height 6px, `var(--bg-border)` background, 3px border-radius
- Gold fill (`var(--gold)`) showing percentage of tenure completed
- Percentage = `(daysSinceStart / tenureDays) * 100`

**Break FD Button (only for Active FDs):**
- Secondary style: transparent bg, `var(--red)` border, `var(--red)` text
- Text: "Break FD"
- On click: opens penalty confirmation modal

**Penalty Modal:**
- Full screen overlay: `rgba(0,0,0,0.6)` background
- Centered modal card (max-width 400px), `var(--bg-card)` background, 12px border-radius
- Warning icon (`AlertTriangle` from lucide) in `var(--red)` 48px
- "Are you sure?" heading in `var(--text-primary)` 20px font-weight 700
- Details:
  - "Principal: ₹1,000.00" in `var(--text-primary)`
  - "Penalty (1%): ₹10.00" in `var(--red)`
  - "You receive: ₹993.42" in `var(--green)` font-weight 600
- Two buttons:
  - "Cancel" — secondary style, `var(--text-secondary)` text
  - "Confirm Break" — `var(--red)` background, white text
- On confirm: calls `POST /api/fd/:fdId/break`
- On success: closes modal, refetches FDs and wallet balance
- If FD is within 7-day lock period: show error "Cannot break FD within the first 7 days" in red — don't show the penalty modal at all

**Props:**
```
fd: FDRecord
onBreak: (fdId: string) => Promise<void>
isBreaking: boolean
```

### `fd-portfolio.tsx` — Portfolio Grid

**Visual Layout:**
- Header row: "Investment Portfolio" in `var(--text-primary)` 20px font-weight 700 + total portfolio value in `var(--gold)` 20px font-weight 700
- Grid: 2 columns on desktop (min-width 768px), 1 column on mobile
- Gap: 16px
- Each cell renders an `fd-card.tsx`

**Empty State:**
- Centered `Landmark` icon (lucide) in `var(--text-disabled)` 48px
- "No active investments" in `var(--text-secondary)` 16px
- "Start Investing" gold button → navigates to `/wallet/invest`

**Props:**
```
fds: FDRecord[]
isLoading: boolean
onBreakFD: (fdId: string) => Promise<void>
```

**Loading State:**
- 2 shimmer cards in the grid layout

### Dependencies from Previous Steps
- Step 4: `use-fd-portfolio.ts` hook
- Step 3: `wallet-store.ts` — FD data
- Phase 2: `POST /api/fd/:fdId/break` endpoint

### What Can Go Wrong
| Risk | Handling |
|------|---------|
| Break FD within 7 days | API returns error — show "Cannot break FD within the first 7 days" message |
| Break FD that's already broken | API returns error — show "This FD has already been broken" |
| No FDs for user (Arjun, Vikram) | Show empty state with "Start Investing" button |
| Progress bar exceeds 100% for matured FDs | Cap at 100% — `Math.min(percentage, 100)` |
| Penalty calculation mismatch | Display values from API response — never calculate penalty client-side |

### Estimated Complexity: **Medium**
Reason: The FD card has multiple visual states (Active, Matured, Broken) and the penalty modal requires careful state management. The 7-day lock period check adds an edge case.

---

## Step 9 — Spend Analytics Components

### Files to Create

| File | Purpose |
|------|---------|
| `src/components/features/analytics/donut-chart.tsx` | Category breakdown donut chart |
| `src/components/features/analytics/bar-chart.tsx` | Monthly trend bar chart |
| `src/components/features/analytics/top-merchants.tsx` | Ranked merchant list |

### `donut-chart.tsx` — Category Breakdown

**Visual Layout:**
- Recharts `PieChart` with `Pie` component, inner radius 60, outer radius 100
- Donut hole center text: total cashback earned in `var(--gold)` 20px font-weight 700
- Colors for categories (in order):
  - Food & Dining: `var(--gold)` (#F5A623)
  - Shopping: `var(--green)` (#22C55E)
  - Travel: `var(--blue)` (#38BDF8)
  - Entertainment: `var(--slate)` (#94A3B8)
  - Other: `var(--red)` (#EF4444)
- Legend below chart: horizontal list of category name + colored dot + amount + percentage
- Legend text: `var(--text-secondary)` 12px

**Props:**
```
data: { category: string, amount: number, percentage: number }[]
totalCashback: number
isLoading: boolean
```

**Loading State:**
- Grey circle placeholder with shimmer animation

**Empty State:**
- "No spending data yet" in `var(--text-secondary)`

### `bar-chart.tsx` — Monthly Trend

**Visual Layout:**
- Recharts `BarChart` with `Bar` components
- X axis: last 6 months (e.g., "Oct", "Nov", "Dec", "Jan", "Feb", "Mar")
- Y axis: rupee amounts with `₹` prefix
- Two bars per month:
  - Earned: `var(--gold)` (#F5A623) fill
  - Spent: `#3A3A3A` (charcoal) fill
- Bar border-radius: 4px top corners
- Grid lines: `var(--bg-border)` color, dashed
- Tooltip: shows exact amounts on hover with `var(--bg-card)` background

**Props:**
```
data: { month: string, earned: number, spent: number }[]
isLoading: boolean
```

**Loading State:**
- Grey bar placeholders with shimmer

### `top-merchants.tsx` — Ranked Merchant List

**Visual Layout:**
- Vertical list, 1-5 ranked entries
- Each entry is a horizontal row with padding 12px:
  - Rank number in gold circle (28px diameter, `var(--gold)` background, charcoal text, font-weight 700)
  - Merchant name in `var(--text-primary)` 14px font-weight 500
  - Category in `var(--text-secondary)` 12px below merchant name
  - Total cashback from this merchant in `var(--green)` 14px font-weight 600 (right-aligned)
  - Transaction count in `var(--text-secondary)` 12px below cashback (right-aligned)

**Props:**
```
merchants: { merchantName: string, category: string, cashback: number, transactionCount: number }[]
isLoading: boolean
```

**Loading State:**
- 5 shimmer rows

**Empty State:**
- "No merchant data yet" in `var(--text-secondary)`

### Dependencies from Previous Steps
- Step 4: `use-analytics.ts` hook
- Step 3: `wallet-store.ts` — analytics data
- npm package: `recharts` (already installed in Phase 1)

### What Can Go Wrong
| Risk | Handling |
|------|---------|
| Recharts SSR issues | Wrap chart components in `dynamic(() => import(...), { ssr: false })` |
| Empty analytics data | Show empty state — not an error |
| Only 1-2 months of data | Bar chart renders whatever months exist — no padding with empty months |
| Category names don't match color map | Use a fallback color (`var(--slate)`) for unknown categories |
| Chart container too small on mobile | Set minimum height 200px, responsive width |

### Estimated Complexity: **Medium**
Reason: Recharts configuration requires careful setup for the dark theme. SSR compatibility needs dynamic imports. The donut chart center text is a custom Recharts feature.

---

## Step 10 — Fraud OTP Modal Component

### Files to Create

| File | Purpose |
|------|---------|
| `src/components/features/fraud/otp-modal.tsx` | Full-screen OTP verification modal |

### Visual Layout

**Overlay:**
- Full screen, `rgba(0,0,0,0.7)` background
- Centered modal card (max-width 400px), `var(--bg-card)` background, 12px border-radius
- Padding: 32px

**Top Section:**
- Orange shield icon (`Shield` from lucide) in orange (#F59E0B) 48px, centered
- "Security Verification Required" heading in `var(--text-primary)` 20px font-weight 700, centered
- "A suspicious transaction pattern was detected" in `var(--text-secondary)` 14px, centered

**Flag Reason Box:**
- Amber background: `rgba(245,158,11,0.1)`, 8px border-radius, 12px padding
- Flag reason text (e.g., "Transaction within 90 seconds of credit") in orange 14px

**OTP Display Section:**
- "Your verification code:" label in `var(--text-secondary)` 14px
- Large 6-digit OTP displayed in `var(--gold)` monospace font (`'Courier New', monospace`) 48px font-weight 700, letter-spacing 8px
- This is the OTP returned from `POST /api/fraud/otp/generate`

**Countdown Timer:**
- "Expires in 4:32" format
- Timer text in `var(--text-secondary)` 14px when > 1 minute
- Timer text in `var(--red)` 14px font-weight 600 when < 1 minute
- Counts down from 5:00 (300 seconds)
- On expiry: show "Code expired" in `var(--red)` + "Request new code" button in gold

**OTP Input Section:**
- 6 individual digit input boxes in a horizontal row, gap 8px
- Each box: 48px × 56px, `var(--bg-primary)` background, `var(--bg-border)` border, 6px border-radius
- Focused box: `var(--gold)` border
- Auto-advances to next box on digit entry
- Backspace moves to previous box
- Paste support: pasting 6 digits fills all boxes

**Buttons:**
- "Verify" gold button — full width, disabled until all 6 digits entered
- "Cancel Transaction" text button below in `var(--text-secondary)` 14px

**Error States:**
- Wrong code: shake animation (CSS `@keyframes shake`) + red border on all input boxes + "Incorrect code. X attempts remaining" in `var(--red)` 14px
- 3 wrong attempts: "Account frozen. Contact support." in `var(--red)` — all inputs disabled, verify button disabled
- Expired: "Code expired. Request new code" with gold refresh button

**Success State:**
- Green checkmark animation (scale 0 → 1 with bounce)
- "Transaction Approved" in `var(--green)` 20px font-weight 700
- Auto-closes after 2 seconds and proceeds with original payment flow

**Props:**
```
isOpen: boolean
flagReason: string
otpCode: string (the generated OTP to display)
onVerify: (code: string) => Promise<{ verified: boolean, attemptsRemaining?: number }>
onCancel: () => void
onSuccess: () => void
onRequestNewCode: () => Promise<string> (returns new OTP)
```

### Dependencies from Previous Steps
- Phase 2: `POST /api/fraud/otp/generate` — generates OTP
- Phase 2: `POST /api/fraud/otp/verify` — verifies OTP
- Step 1: Design tokens

### What Can Go Wrong
| Risk | Handling |
|------|---------|
| OTP expires before user enters it | Show expiry message with "Request new code" button |
| User pastes non-numeric text | Filter input to digits only — ignore non-numeric characters |
| Timer continues after modal closes | Clear interval on unmount using `useEffect` cleanup |
| Account frozen after 3 attempts | Disable all inputs and buttons, show frozen message |
| Network error during verify | Show "Verification failed. Please try again." — don't count as an attempt |

### Estimated Complexity: **High**
Reason: The 6-digit input with auto-advance, countdown timer, shake animation, and multiple error states make this the most complex single component. The state machine (entering → verifying → success/error/expired/frozen) has many transitions.

---

## Step 11 — Dashboard Page + Layout

### Files to Create / Modify

| File | Purpose |
|------|---------|
| `src/app/(dashboard)/layout.tsx` | Dashboard layout with sidebar and header |
| `src/app/(dashboard)/dashboard/page.tsx` | Main dashboard page with 5 sections |

### `layout.tsx` — Dashboard Layout

**Structure:**
```
<div className="dashboard-layout">
  <Sidebar />
  <div className="main-area">
    <Header />
    <main className="content">
      {children}
    </main>
  </div>
</div>
```

**CSS Grid:**
- Desktop: `grid-template-columns: 260px 1fr`
- Mobile (< 768px): single column, sidebar becomes bottom tab bar
- Main area: `grid-template-rows: 64px 1fr`
- Content area: `overflow-y: auto`, padding 24px

**Auth Guard:**
- On mount: check `isAuthenticated` from auth-store
- If not authenticated: redirect to `/login`
- If authenticated but no wallet data: call `refreshAll(userId)`

### `dashboard/page.tsx` — Dashboard Page

**On Mount:**
- Call `refreshAll(userId)` from wallet-store to load all data in parallel
- Show loading skeletons for all 5 sections while data loads

**Layout:**
- Single scrollable column, max-width 1200px, centered
- 5 sections stacked vertically with 24px gap between each

**Section 1 — Balance Card:**
- Renders `<BalanceCard>` component
- Props: wallet balance from store, account age computed from user createdAt

**Section 2 — Claude Advisor Card:**
- Renders `<AdvisorCard>` component
- Props: advisor recommendation from store, refresh handler from `use-advisor` hook

**Section 3 — Transaction Timeline (last 10):**
- Renders `<TransactionTimeline>` component
- Props: last 10 ledger entries, `maxItems={10}`, `showViewAll={true}`
- "View All" link navigates to `/wallet/transactions`

**Section 4 — Investment Portfolio:**
- Renders `<FDPortfolio>` component
- Props: FD records from store, break handler from `use-fd-portfolio` hook

**Section 5 — Spend Analytics:**
- Renders all three analytics components in a grid:
  - Donut chart (left, 50% width on desktop)
  - Bar chart (right, 50% width on desktop)
  - Top merchants (full width below)

**Error Handling:**
- Each section handles its own error state independently
- If one section fails, the others still render
- Global error banner at top only if `refreshAll` fails entirely

### Dependencies from Previous Steps
- Step 1: Sidebar, Header components
- Step 3: auth-store, wallet-store
- Step 4: All custom hooks
- Steps 5-9: All feature components

### What Can Go Wrong
| Risk | Handling |
|------|---------|
| `refreshAll` partially fails | `Promise.allSettled` — sections with data render, sections without show error |
| User navigates to dashboard before login | Auth guard redirects to `/login` |
| Dashboard takes too long to load | Show skeleton immediately — each section loads independently |
| Persona switch while dashboard is loading | Cancel previous fetches (or let them complete — new data overwrites) |
| Mobile layout breaks with all 5 sections | Stack vertically, full width, no grid on mobile |

### Estimated Complexity: **Medium**
Reason: The dashboard is an assembly of existing components. The main complexity is the auth guard, the parallel data loading, and ensuring each section handles its own loading/error state.

---

## Step 12 — Wallet Pages

### Files to Create

| File | Purpose |
|------|---------|
| `src/app/(wallet)/wallet/page.tsx` | Wallet overview page |
| `src/app/(wallet)/wallet/transactions/page.tsx` | Full transaction history with pagination |
| `src/app/(wallet)/wallet/invest/page.tsx` | FD creation form with live preview |

### `wallet/page.tsx` — Wallet Overview

**Layout:**
- Balance card at top (reuse `<BalanceCard>` component)
- Quick actions row: 4 action cards in a horizontal row
  - "Add Cashback" (for demo — calls credit endpoint)
  - "Pay Merchant" → `/checkout`
  - "Invest" → `/wallet/invest`
  - "View History" → `/wallet/transactions`
- Recent transactions: last 5 entries using `<TransactionTimeline maxItems={5} showViewAll />`
- Active FDs summary: count of active FDs + total locked amount, link to invest page

### `wallet/transactions/page.tsx` — Full Transaction History

**Layout:**
- Page title: "Transaction History" in `var(--text-primary)` 24px font-weight 700
- Filter tabs: All | Credits | Spends | FD | Flagged (reuse timeline filter)
- Date range filter: two date inputs (from, to) with gold focus ring
- Export button (decorative): "Export CSV" secondary button — shows toast "Export coming soon"
- Full `<TransactionTimeline>` component with all entries
- Pagination at bottom: "Showing 1-20 of 156" + Previous/Next buttons
- Page size: 20 entries per page

### `wallet/invest/page.tsx` — FD Creation Form

**Layout:**
- Page title: "Create GrabSave FD" in `var(--text-primary)` 24px font-weight 700
- Available balance display: "Available: ₹4,280.00" in `var(--green)` 16px

**Form:**
- Principal input:
  - Label: "Investment Amount (₹)" in `var(--text-secondary)` 14px
  - Number input with `₹` prefix, dark background, gold focus ring
  - Below input: "Minimum ₹500" in `var(--text-secondary)` 12px
  - If amount > available balance: red warning "Exceeds available balance"
  - If amount < 500: red warning "Minimum investment is ₹500"
  - Pre-fill from URL query param `?amount=1000` (from advisor card deep link)

- Tenure slider:
  - Label: "Tenure (days)" in `var(--text-secondary)` 14px
  - Range slider: 30 to 365 days, gold track, gold thumb
  - Current value displayed: "90 days" in `var(--gold)` 16px font-weight 600
  - Tick marks at 30, 90, 180, 365

**Live Calculation Preview Box:**
- `var(--bg-primary)` background, 12px border-radius, 20px padding
- Updates in real-time as user types amount or moves slider
- Shows:
  - Maturity Date: computed date in `var(--text-primary)` 14px
  - Interest Rate: "7.5% p.a." in `var(--gold)` 14px
  - Projected Return: maturity amount in `var(--green)` 20px font-weight 700
  - Interest Earned: interest portion in `var(--gold)` 14px
- Formula: `Principal × (1 + (7.5 × tenure) / 36500)`
- All calculations done client-side for instant preview

**Submit Button:**
- "Lock in GrabSave FD" — full width, gold background, charcoal text, font-weight 600
- Disabled if: amount < 500, amount > available balance, or form is submitting
- On click: calls `POST /api/fd/create` with `{ principal: amountInPaisa, tenureDays }`
- Loading state: gold spinner + "Creating your FD..."
- On success: redirect to `/dashboard`, show success toast "FD created successfully! ₹X locked for Y days"
- On error: show red error message below button

### Dependencies from Previous Steps
- Step 5: `<BalanceCard>` component
- Step 7: `<TransactionTimeline>` component
- Step 4: `use-fd-portfolio.ts` hook (createFD action)
- Step 4: `use-wallet.ts` hook (balance check)
- Phase 2: `POST /api/fd/create` endpoint

### What Can Go Wrong
| Risk | Handling |
|------|---------|
| User enters ₹499 | Show validation error "Minimum investment is ₹500" — button disabled |
| User enters more than available balance | Show "Exceeds available balance" — button disabled |
| FD creation fails (insufficient balance race condition) | Show API error message — refetch wallet balance |
| Tenure slider precision | Snap to integer days — no fractional days |
| URL query param `amount` is invalid | Ignore invalid values — default to empty input |
| Live calculation shows wrong maturity amount | Use same formula as backend: `principal * (1 + (7.5 * tenure) / 36500)` |

### Estimated Complexity: **Medium**
Reason: The invest page with live calculation preview and tenure slider is the most complex form. The transaction history page with pagination and filters requires careful state management.

---

## Step 13 — Merchant + Checkout Pages

### Files to Create

| File | Purpose |
|------|---------|
| `src/app/(merchant)/merchants/page.tsx` | Merchant grid listing |
| `src/app/(merchant)/merchants/[merchantId]/page.tsx` | Merchant detail page |
| `src/app/(merchant)/checkout/page.tsx` | Checkout with fraud check + PayU redirect |
| `src/app/(merchant)/checkout/success/page.tsx` | Payment success page |
| `src/app/(merchant)/checkout/failure/page.tsx` | Payment failure page |

### `merchants/page.tsx` — Merchant Grid

**Layout:**
- Page title: "Merchants" in `var(--text-primary)` 24px font-weight 700
- Grid: 3 columns on desktop, 2 on tablet, 1 on mobile
- Gap: 16px

**Each Merchant Card:**
- `var(--bg-card)` background, 12px border-radius, `var(--bg-border)` border
- Padding: 20px
- Top: colored circle (48px) with merchant initials in white font-weight 700
  - Color based on category: Food=#F5A623, Shopping=#22C55E, Travel=#38BDF8, Entertainment=#94A3B8
- Merchant name in `var(--text-primary)` 16px font-weight 600
- Category badge: small pill with category name in `var(--text-secondary)` 12px
- Cashback rate: "Up to 5% cashback" in `var(--gold)` 14px font-weight 600
- Click → navigate to `/merchants/:merchantId`

**Data Source:** `GET /api/merchants`

### `merchants/[merchantId]/page.tsx` — Merchant Detail

**Layout:**
- Large merchant name in `var(--text-primary)` 28px font-weight 700
- Category badge in `var(--text-secondary)`
- Cashback rate prominently: "5% Cashback" in `var(--gold)` 24px font-weight 700
- "Pay at this merchant" gold button → navigates to `/checkout?merchantId=X&merchantName=Y&amount=`
- Recent transactions at this merchant: filtered ledger entries for this merchantId

### `checkout/page.tsx` — Checkout Page

**Layout:**
- Page title: "Checkout" in `var(--text-primary)` 24px font-weight 700

**Order Summary Card:**
- `var(--bg-card)` background, 12px border-radius
- Merchant name from URL query params
- Amount input: number input with `₹` prefix (or pre-filled from query param)
- Description input: text input for payment description

**Balance Check Section:**
- Shows available balance: "Available: ₹4,280.00"
- If sufficient: green checkmark + "Balance sufficient" in `var(--green)`
- If insufficient: red warning icon + "Insufficient balance. You need ₹X more." in `var(--red)`

**"Pay with GrabCash" Button:**
- Full width, gold background, charcoal text
- Disabled if insufficient balance or amount is empty

**Payment Flow (on click):**
1. Set loading state: "Securing your payment..." with gold spinner
2. Call `POST /api/fraud/check` with `{ amount: amountInPaisa, merchantId }`
3. **If fraud result is `REQUIRE_OTP`:**
   - Call `POST /api/fraud/otp/generate` to get OTP
   - Open `<OTPModal>` with the OTP and flag reason
   - On OTP success: proceed to step 4
   - On OTP cancel: return to checkout page
4. **If fraud result is `ALLOW` (or OTP verified):**
   - Call `POST /api/payu/initiate` with `{ amount, merchantId, merchantName, productInfo }`
   - Receive PayU form params from response
   - Create a hidden HTML form with all PayU params
   - Auto-submit the form to PayU's URL (this redirects the browser to PayU's payment page)
5. **If fraud result is `BLOCK`:**
   - Show red error: "Transaction blocked. [reason]"
6. **If fraud result is `FREEZE`:**
   - Show red error: "Account frozen due to suspicious activity. Contact support."

**PayU Form Auto-Submit:**
```
Create a hidden <form> element with:
  action = PayU base URL
  method = POST
  All PayU params as hidden <input> fields
Auto-submit using formRef.current.submit()
```

### `checkout/success/page.tsx` — Payment Success

**Layout:**
- Centered card, max-width 480px
- Green checkmark animation (CSS scale + bounce)
- "Payment Successful" in `var(--green)` 24px font-weight 700
- Transaction details:
  - Amount: ₹X in `var(--text-primary)` 20px
  - Merchant: name in `var(--text-secondary)`
  - Timestamp: formatted date in `var(--text-secondary)`
  - Transaction ID from URL query params
- "Return to Dashboard" gold button → `/dashboard`
- On mount: call `refreshAll(userId)` to update wallet balance

### `checkout/failure/page.tsx` — Payment Failure

**Layout:**
- Centered card, max-width 480px
- Red X animation (CSS scale + bounce)
- "Payment Failed" in `var(--red)` 24px font-weight 700
- Error reason from URL query params or PayU response
- Two buttons:
  - "Try Again" gold button → `/checkout`
  - "Return to Dashboard" secondary button → `/dashboard`

### Dependencies from Previous Steps
- Step 10: `<OTPModal>` component
- Step 4: `use-wallet.ts` hook (balance check)
- Phase 2: `POST /api/fraud/check`, `POST /api/fraud/otp/generate`, `POST /api/payu/initiate`

### What Can Go Wrong
| Risk | Handling |
|------|---------|
| Fraud check returns unexpected action | Default to showing error — never proceed without explicit ALLOW |
| PayU redirect fails | Show error: "Unable to connect to payment gateway. Please try again." |
| PayU success page loaded without valid params | Show generic success with "Return to Dashboard" button |
| OTP modal closed without completing | Return to checkout page — don't proceed with payment |
| Amount in query params is tampered | Server re-validates amount — never trust client-submitted amounts |
| Browser blocks form auto-submit | Use `useEffect` to submit on mount — if blocked, show manual "Proceed to PayU" button |

### Estimated Complexity: **High**
Reason: The checkout page orchestrates fraud check → OTP flow → PayU redirect — a multi-step async flow with branching logic. The PayU form auto-submit is a non-standard pattern. Error handling must cover every branch.

---

## Step 14 — Analytics Page

### Files to Create

| File | Purpose |
|------|---------|
| `src/app/(analytics)/analytics/page.tsx` | Full analytics page with all charts |

### Visual Layout

**Summary Stats Row (top):**
- 4 small stat cards in a horizontal row, gap 16px
- Each card: `var(--bg-card)` background, 12px border-radius, padding 16px
- Gold accent line at top (2px)

| Stat | Value Source | Color |
|------|-------------|-------|
| Total Earned | `analytics.totalEarned` | `var(--gold)` |
| Total Spent | `analytics.totalSpent` | `var(--red)` |
| Savings Rate | `analytics.savingsRate` + "%" | `var(--green)` |
| Avg per Month | `totalEarned / monthsActive` | `var(--blue)` |

Each stat shows: label in `var(--text-secondary)` 12px, value in respective color 24px font-weight 700

**Charts Grid (below stats):**
- 2 columns on desktop, 1 on mobile
- Left: `<DonutChart>` — Category Breakdown
- Right: `<BarChart>` — Monthly Trend
- Full width below: `<TopMerchants>` — Top 5 Merchants

**Section Headers:**
- Each chart section has a title in `var(--text-primary)` 16px font-weight 600
- Subtitle in `var(--text-secondary)` 12px (e.g., "Last 30 days", "Last 6 months")

### Dependencies from Previous Steps
- Step 9: All three analytics components
- Step 4: `use-analytics.ts` hook

### What Can Go Wrong
| Risk | Handling |
|------|---------|
| Analytics data is null | Show loading skeletons for all sections |
| Division by zero for savings rate | If totalSpent is 0, show "N/A" instead of percentage |
| Charts don't render on SSR | Use `dynamic(() => import(...), { ssr: false })` for chart components |
| Mobile layout too cramped | Stack all sections vertically, full width |

### Estimated Complexity: **Low**
Reason: This page is an assembly of existing components with a stats row. The main work is layout and responsive design.

---

## Step 15 — Claude Advisor Service (Real Implementation)

### Files to Create

| File | Purpose |
|------|---------|
| `src/services/advisor/context-builder.ts` | Builds the full context object for Claude |
| `src/services/advisor/prompt-builder.ts` | Constructs system and user prompts |
| `src/services/advisor/claude-advisor.ts` | Calls Anthropic API and stores result |
| `src/app/api/advisor/[userId]/route.ts` | GET — returns latest recommendation |
| `src/app/api/advisor/[userId]/refresh/route.ts` | POST — triggers fresh Claude analysis |

### `context-builder.ts` — Advisor Context Builder

**Function: `buildAdvisorContext(userId: string): Promise<AdvisorContext>`**

Fetches and assembles all data Claude needs to give personalised advice:

1. **Wallet State:**
   - Fetches wallet balance (all four types) using wallet-service
   - Converts paisa to rupees for the prompt

2. **Cashback Last 30 Days:**
   - Queries ledger for all `CASHBACK_CREDIT` entries in the last 30 days
   - Groups by merchant name: sum amount, count transactions
   - Identifies top merchant by total cashback
   - Returns: `{ merchantName, totalCashback, transactionCount }[]`

3. **Active FDs:**
   - Fetches all active FDs for the user
   - For each: principal (rupees), rate, maturityDate, daysRemaining, projectedReturn
   - Returns: `FDContext[]`

4. **Spending by Category:**
   - Queries ledger for all `PAYU_SPEND` entries in the last 30 days
   - Groups by category: sum amount
   - Returns: `{ category, totalSpent }[]`

5. **Top Merchants:**
   - Top 3 merchants by cashback this month with exact amounts
   - Returns: `{ merchantName, cashback, transactionCount }[]`

6. **Day Context:**
   - `dayOfWeek`: e.g., "Wednesday"
   - `isWeekendApproaching`: true if Thursday or Friday
   - `dayOfMonth`: e.g., 12
   - `isMonthEnd`: true if dayOfMonth >= 25

7. **Account Age:**
   - Days since user `createdAt`

8. **Transaction Count:**
   - Total number of ledger entries for this user

9. **Price Sensitivity:**
   - `'HIGH'` if > 70% of transactions use coupons (approximated by category patterns)
   - `'MEDIUM'` if 30-70%
   - `'LOW'` if < 30%

**Returns:** A structured `AdvisorContext` object with all nine sections.

### `prompt-builder.ts` — Prompt Construction

**Function: `buildSystemPrompt(): string`**

Returns a system prompt instructing Claude to:
- Always mention specific merchant names from the context — never generic terms
- Always use exact rupee amounts — never approximations
- Never recommend FD if available balance is below ₹500
- If transactionCount < 5: give onboarding guidance only, no investment advice
- Always provide a specific rupee split: invest ₹X, keep ₹Y liquid
- Keep summary to 2-3 sentences maximum
- Keep recommendation to 2-3 sentences maximum
- Action items: maximum 3 specific steps with rupee amounts
- Alert: only if FD matures within 7 days OR unusual pattern detected
- Never use generic phrases like "save more" or "spend wisely"
- Output must be valid JSON matching this exact schema:
  ```json
  {
    "summary": "string",
    "recommendation": "string",
    "actionItems": ["string"],
    "alert": "string | null"
  }
  ```

**Function: `buildUserPrompt(context: AdvisorContext): string`**

Formats the context object into a clear prompt showing:
- Wallet state with exact rupee amounts for all four balance types
- Top merchants with exact cashback amounts earned this month
- Active FDs with maturity dates and days remaining
- Day context (day of week, weekend approaching, month position)
- Account age and total transaction count
- Spending breakdown by category with exact amounts
- Price sensitivity signal

The prompt is structured with clear section headers so Claude can parse it easily.

### `claude-advisor.ts` — Anthropic API Integration

**Function: `generateAdvisorRecommendation(userId: string): Promise<AdvisorRecommendation>`**

1. Calls `buildAdvisorContext(userId)` to assemble all data
2. Calls `buildSystemPrompt()` for the system instruction
3. Calls `buildUserPrompt(context)` for the user message
4. Calls Anthropic API:
   - Model: `claude-sonnet-4-20250514`
   - Max tokens: 1000
   - System: systemPrompt
   - Messages: `[{ role: 'user', content: userPrompt }]`
   - Timeout: 30 seconds
5. Parses response content as JSON
6. Validates all four fields are present (summary, recommendation, actionItems, alert)
7. Upserts into `AdvisorRecommendation` table (one per user — replaces previous)
8. Stores the context used in `contextUsed` field (for debugging)
9. Returns the structured recommendation

**Error Handling:**
- If Anthropic API fails: throw with `ADVISOR_API_ERROR` code
- If response is not valid JSON: throw with `ADVISOR_PARSE_ERROR` code
- If response is missing required fields: throw with `ADVISOR_INVALID_RESPONSE` code
- Never log the full API response — only log userId, duration, and success/failure

**Function: `getLatestRecommendation(userId: string): Promise<AdvisorRecommendation | null>`**

1. Fetches the most recent `AdvisorRecommendation` for userId from database
2. If none exists: calls `generateAdvisorRecommendation(userId)` and returns the result
3. Returns the recommendation object with parsed `actionItems` (stored as JSON string in DB)

### API Routes

**`GET /api/advisor/[userId]/route.ts`**
- Protected by JWT auth middleware
- Calls `getLatestRecommendation(userId)`
- Returns `{ data: recommendation }` on success
- Returns `{ error: { message, code } }` on failure

**`POST /api/advisor/[userId]/refresh/route.ts`**
- Protected by JWT auth middleware
- Calls `generateAdvisorRecommendation(userId)` — this is the real Claude API call
- Returns `{ data: recommendation }` on success
- This endpoint may take 5-10 seconds to respond (Claude API latency)

### Dependencies from Previous Steps
- Step 3: `wallet-store.ts` — advisor data storage
- Phase 2: Wallet service, ledger service, FD service — for context building
- Phase 1: `.env` — `ANTHROPIC_API_KEY`
- Phase 1: Prisma schema — `AdvisorRecommendation` model

### Business Rules to Enforce
- Never recommend FD if available balance < ₹500
- Never give investment advice if transactionCount < 5 (onboarding guidance instead)
- Never mention merchants the user hasn't transacted with
- Every recommendation must include specific rupee amounts
- Priya and Arjun must receive completely different recommendations
- Alert only fires for FD maturity within 7 days or unusual patterns

### What Can Go Wrong
| Risk | Handling |
|------|---------|
| `ANTHROPIC_API_KEY` not set | Throw at startup — fail fast |
| Claude API timeout (> 30s) | Return timeout error — frontend shows "Analysis is taking longer than expected" |
| Claude returns invalid JSON | Catch parse error, log it, return `ADVISOR_PARSE_ERROR` |
| Claude returns generic advice | System prompt explicitly forbids it — if detected, retry once |
| Context builder fails (DB error) | Catch and throw `ADVISOR_CONTEXT_ERROR` — don't call Claude with incomplete data |
| Rate limiting from Anthropic | Catch 429 error, return "Please try again in a few minutes" |

### Estimated Complexity: **High**
Reason: The context builder requires querying multiple tables and aggregating data. The prompt engineering must produce consistently high-quality, persona-specific output. The Anthropic API integration requires timeout handling, JSON parsing, and error recovery.

---

## Dependency Graph

```
Phase 1 Foundation
├── prisma/schema.prisma (all models)
├── src/lib/prisma.ts (Prisma client)
├── .env (all secrets and config)
└── All npm packages installed

Phase 2 Backend
├── src/services/wallet/ (balance, ledger, analytics)
├── src/services/fd/ (calculator, service)
├── src/services/fraud/ (engine, 6 rules)
├── src/services/payu/ (hash, service)
├── src/services/otp/ (generate, verify)
├── src/middleware/auth.ts (JWT verification)
├── src/app/api/ (all 24 endpoints)
└── src/cron/ (settle, mature, advisor stub)

Step 1: Global Layout + Design Tokens
├── DEPENDS ON: Phase 1 (npm packages: lucide-react, tailwindcss)
├── PRODUCES: globals.css, sidebar.tsx, header.tsx
└── CONSUMED BY: Steps 2, 5-14 (every component uses design tokens)

Step 2: Auth Pages
├── DEPENDS ON: Phase 2 (POST /api/auth/login, POST /api/auth/register)
├── PRODUCES: login/page.tsx, register/page.tsx
└── CONSUMED BY: Step 11 (auth guard in dashboard layout)

Step 3: Zustand Stores
├── DEPENDS ON: Phase 2 (all API endpoints for data fetching)
├── PRODUCES: auth-store.ts, wallet-store.ts
└── CONSUMED BY: Steps 4, 5-14 (every component reads from stores)

Step 4: API Client + Hooks
├── DEPENDS ON: Step 3 (auth-store for token, wallet-store for data)
├── PRODUCES: api-client.ts, 5 hook files
└── CONSUMED BY: Steps 5-14 (every page uses hooks)

Step 5: Balance Card
├── DEPENDS ON: Step 1 (design tokens), Step 4 (use-wallet hook)
├── PRODUCES: balance-card.tsx
└── CONSUMED BY: Steps 11, 12 (dashboard, wallet page)

Step 6: Advisor Card
├── DEPENDS ON: Step 1 (design tokens), Step 4 (use-advisor hook)
├── PRODUCES: advisor-card.tsx
└── CONSUMED BY: Step 11 (dashboard)

Step 7: Transaction Timeline
├── DEPENDS ON: Step 1 (design tokens), Step 4 (use-transactions hook)
├── PRODUCES: transaction-timeline.tsx
└── CONSUMED BY: Steps 11, 12 (dashboard, wallet pages)

Step 8: Investment Portfolio
├── DEPENDS ON: Step 1 (design tokens), Step 4 (use-fd-portfolio hook)
├── PRODUCES: fd-card.tsx, fd-portfolio.tsx
└── CONSUMED BY: Steps 11, 12 (dashboard, invest page)

Step 9: Spend Analytics
├── DEPENDS ON: Step 1 (design tokens), Step 4 (use-analytics hook), recharts
├── PRODUCES: donut-chart.tsx, bar-chart.tsx, top-merchants.tsx
└── CONSUMED BY: Steps 11, 14 (dashboard, analytics page)

Step 10: OTP Modal
├── DEPENDS ON: Step 1 (design tokens), Phase 2 (OTP endpoints)
├── PRODUCES: otp-modal.tsx
└── CONSUMED BY: Step 13 (checkout page)

Step 11: Dashboard Page
├── DEPENDS ON: Steps 1-9 (all layout + components)
├── PRODUCES: dashboard layout, dashboard page
└── CONSUMED BY: User (main entry point after login)

Step 12: Wallet Pages
├── DEPENDS ON: Steps 5, 7, 8 (balance card, timeline, portfolio)
├── PRODUCES: wallet/page.tsx, transactions/page.tsx, invest/page.tsx
└── CONSUMED BY: User (wallet section)

Step 13: Merchant + Checkout Pages
├── DEPENDS ON: Step 10 (OTP modal), Step 4 (hooks), Phase 2 (fraud, PayU endpoints)
├── PRODUCES: merchants, checkout, success, failure pages
└── CONSUMED BY: User (payment flow)

Step 14: Analytics Page
├── DEPENDS ON: Step 9 (analytics components)
├── PRODUCES: analytics/page.tsx
└── CONSUMED BY: User (analytics section)

Step 15: Claude Advisor Service
├── DEPENDS ON: Phase 2 (wallet, ledger, FD services), .env (ANTHROPIC_API_KEY)
├── PRODUCES: context-builder.ts, prompt-builder.ts, claude-advisor.ts, API routes
└── CONSUMED BY: Step 6 (advisor card refresh), Step 11 (dashboard advisor section)
```

---

## Complete File List — Phase 3 (38 Files)

### Global Layout + Design (3 files)
| # | File | Action |
|---|------|--------|
| 1 | `src/app/globals.css` | Modify |
| 2 | `src/components/layout/sidebar.tsx` | Create |
| 3 | `src/components/layout/header.tsx` | Create |

### Stores + API Client (3 files)
| # | File | Action |
|---|------|--------|
| 4 | `src/utils/api-client.ts` | Create |
| 5 | `src/store/auth-store.ts` | Create |
| 6 | `src/store/wallet-store.ts` | Create |

### Auth Pages (2 files)
| # | File | Action |
|---|------|--------|
| 7 | `src/app/(auth)/login/page.tsx` | Modify |
| 8 | `src/app/(auth)/register/page.tsx` | Modify |

### Custom Hooks (5 files)
| # | File | Action |
|---|------|--------|
| 9 | `src/hooks/use-wallet.ts` | Create |
| 10 | `src/hooks/use-transactions.ts` | Create |
| 11 | `src/hooks/use-fd-portfolio.ts` | Create |
| 12 | `src/hooks/use-advisor.ts` | Create |
| 13 | `src/hooks/use-analytics.ts` | Create |

### Feature Components (9 files)
| # | File | Action |
|---|------|--------|
| 14 | `src/components/features/wallet/balance-card.tsx` | Create |
| 15 | `src/components/features/advisor/advisor-card.tsx` | Create |
| 16 | `src/components/features/wallet/transaction-timeline.tsx` | Create |
| 17 | `src/components/features/investment/fd-card.tsx` | Create |
| 18 | `src/components/features/investment/fd-portfolio.tsx` | Create |
| 19 | `src/components/features/analytics/donut-chart.tsx` | Create |
| 20 | `src/components/features/analytics/bar-chart.tsx` | Create |
| 21 | `src/components/features/analytics/top-merchants.tsx` | Create |
| 22 | `src/components/features/fraud/otp-modal.tsx` | Create |

### Pages (12 files)
| # | File | Action |
|---|------|--------|
| 23 | `src/app/(dashboard)/layout.tsx` | Modify |
| 24 | `src/app/(dashboard)/dashboard/page.tsx` | Modify |
| 25 | `src/app/(wallet)/wallet/page.tsx` | Modify |
| 26 | `src/app/(wallet)/wallet/transactions/page.tsx` | Modify |
| 27 | `src/app/(wallet)/wallet/invest/page.tsx` | Modify |
| 28 | `src/app/(merchant)/merchants/page.tsx` | Modify |
| 29 | `src/app/(merchant)/merchants/[merchantId]/page.tsx` | Modify |
| 30 | `src/app/(merchant)/checkout/page.tsx` | Modify |
| 31 | `src/app/(merchant)/checkout/success/page.tsx` | Modify |
| 32 | `src/app/(merchant)/checkout/failure/page.tsx` | Modify |
| 33 | `src/app/(analytics)/analytics/page.tsx` | Modify |

### Claude Advisor Service (5 files)
| # | File | Action |
|---|------|--------|
| 34 | `src/services/advisor/context-builder.ts` | Create |
| 35 | `src/services/advisor/prompt-builder.ts` | Create |
| 36 | `src/services/advisor/claude-advisor.ts` | Create |
| 37 | `src/app/api/advisor/[userId]/route.ts` | Modify |
| 38 | `src/app/api/advisor/[userId]/refresh/route.ts` | Modify |

---

## File Creation Order (Strict Sequence)

```
1.  src/app/globals.css (design tokens)
2.  src/utils/api-client.ts
3.  src/store/auth-store.ts
4.  src/store/wallet-store.ts
5.  src/components/layout/sidebar.tsx
6.  src/components/layout/header.tsx
7.  src/app/(auth)/login/page.tsx
8.  src/app/(auth)/register/page.tsx
9.  src/app/(dashboard)/layout.tsx
10. src/hooks/use-wallet.ts
11. src/hooks/use-transactions.ts
12. src/hooks/use-fd-portfolio.ts
13. src/hooks/use-advisor.ts
14. src/hooks/use-analytics.ts
15. src/components/features/wallet/balance-card.tsx
16. src/components/features/advisor/advisor-card.tsx
17. src/components/features/wallet/transaction-timeline.tsx
18. src/components/features/investment/fd-card.tsx
19. src/components/features/investment/fd-portfolio.tsx
20. src/components/features/analytics/donut-chart.tsx
21. src/components/features/analytics/bar-chart.tsx
22. src/components/features/analytics/top-merchants.tsx
23. src/components/features/fraud/otp-modal.tsx
24. src/app/(dashboard)/dashboard/page.tsx
25. src/app/(wallet)/wallet/page.tsx
26. src/app/(wallet)/wallet/transactions/page.tsx
27. src/app/(wallet)/wallet/invest/page.tsx
28. src/app/(merchant)/merchants/page.tsx
29. src/app/(merchant)/merchants/[merchantId]/page.tsx
30. src/app/(merchant)/checkout/page.tsx
31. src/app/(merchant)/checkout/success/page.tsx
32. src/app/(merchant)/checkout/failure/page.tsx
33. src/app/(analytics)/analytics/page.tsx
34. src/services/advisor/context-builder.ts
35. src/services/advisor/prompt-builder.ts
36. src/services/advisor/claude-advisor.ts
37. src/app/api/advisor/[userId]/route.ts
38. src/app/api/advisor/[userId]/refresh/route.ts
```

---

## Phase 3 Verification Checklist

Complete every item before declaring Phase 3 done.

### Step 1 — Global Layout + Design Tokens
- [ ] Inter font loads from Google Fonts
- [ ] All CSS variables defined and accessible
- [ ] Body background is `#1A1A1A`, text is `#F8F8F8`
- [ ] Custom scrollbar styled in charcoal and gold
- [ ] Sidebar renders with 4 navigation items
- [ ] Active nav item has gold left border and gold text
- [ ] Persona switcher dropdown shows all 5 personas
- [ ] Header shows persona name, avatar initials, and current time
- [ ] Mobile responsive — sidebar collapses to bottom tab bar below 768px

### Step 2 — Auth Pages
- [ ] Login page loads at `/login` with email/password form
- [ ] 5 persona quick-login buttons visible below the form
- [ ] Clicking any persona button logs in instantly (calls POST /api/auth/login)
- [ ] Loading spinner shows on clicked button during API call
- [ ] Error message shows in red if login fails
- [ ] On success: redirect to `/dashboard`
- [ ] Register page loads with name, email, phone, password fields
- [ ] Register form validates inputs client-side
- [ ] Link between login and register pages works

### Step 3 — Zustand Stores
- [ ] `auth-store` stores JWT token in state and localStorage
- [ ] `auth-store.login()` calls API and stores token on success
- [ ] `auth-store.loginAsPersona()` calls login with password123
- [ ] `auth-store.logout()` clears token and redirects to /login
- [ ] `auth-store.getAuthHeader()` returns Bearer token header
- [ ] `wallet-store.fetchWallet()` calls GET /api/wallet/:userId
- [ ] `wallet-store.fetchLedger()` calls GET /api/wallet/:userId/ledger
- [ ] `wallet-store.fetchFDs()` calls GET /api/fd/user/:userId
- [ ] `wallet-store.fetchAdvisor()` calls GET /api/advisor/:userId
- [ ] `wallet-store.fetchAnalytics()` calls GET /api/wallet/:userId/analytics
- [ ] `wallet-store.refreshAll()` calls all five fetches in parallel
- [ ] `wallet-store.clearStore()` resets all state to null

### Step 4 — API Client + Hooks
- [ ] Axios instance adds Authorization header from auth-store
- [ ] 401 response clears auth store and redirects to /login
- [ ] Error responses extracted into `{ error: { message, code } }` shape
- [ ] `use-wallet` hook returns wallet balance and refetch function
- [ ] `use-transactions` hook supports filter parameter
- [ ] `use-fd-portfolio` hook exposes createFD and breakFD actions
- [ ] `use-advisor` hook exposes refresh action with separate isRefreshing state
- [ ] `use-analytics` hook returns analytics data for charts

### Step 5 — Balance Card
- [ ] Available balance shows in green 48px font
- [ ] Priya's available balance shows ₹4,280.00
- [ ] Pending balance shows in slate with clock icon
- [ ] Locked balance shows in gold with lock icon
- [ ] Lifetime earned shows in gold with sparkle icon
- [ ] Three action buttons render and navigate correctly
- [ ] Loading state shows gold skeleton shimmer
- [ ] Indian number formatting with commas (₹4,280.00)

### Step 6 — Advisor Card
- [ ] Advisor card shows summary and recommendation text
- [ ] Rupee amounts in recommendation highlighted in gold
- [ ] Action items render as list with gold arrows
- [ ] Invest action items render as clickable gold buttons
- [ ] "Invest ₹1,000 Now" button navigates to /wallet/invest?amount=1000
- [ ] Alert section shows only when alert is not null
- [ ] "Refresh Analysis" button calls POST /api/advisor/:userId/refresh
- [ ] Loading state shows "Analysing your financial patterns..." with shimmer
- [ ] Null advisor shows "Generating your personalised analysis..." skeleton

### Step 7 — Transaction Timeline
- [ ] Filter tabs: All, Credits, Spends, FD, Flagged — all functional
- [ ] Active tab has gold underline
- [ ] Credits show green icon and green +₹ amount
- [ ] Debits show red icon and red -₹ amount
- [ ] FD operations show blue icon
- [ ] Flagged entries show orange icon and orange left border
- [ ] Status badges: Pending (slate), Settled (green), On Hold (orange), Failed (red)
- [ ] Pending entries have pulsing animation
- [ ] Empty state shows "No transactions yet" with wallet icon
- [ ] Relative timestamps (e.g., "2 hours ago")

### Step 8 — Investment Portfolio
- [ ] FD cards show principal, rate, maturity date, projected return
- [ ] Progress bar shows tenure completion percentage in gold
- [ ] Active FDs show "Break FD" button
- [ ] Break FD opens penalty modal with correct amounts
- [ ] Penalty modal shows principal, penalty (1%), and net return
- [ ] Confirm break calls POST /api/fd/:fdId/break
- [ ] Breaking within 7 days shows error (no modal)
- [ ] Portfolio grid: 2 columns desktop, 1 column mobile
- [ ] Empty state shows "No active investments" + "Start Investing" button
- [ ] Priya shows 2 active FDs, Rajan shows 3

### Step 9 — Spend Analytics
- [ ] Donut chart renders with category colors
- [ ] Donut center shows total cashback in gold
- [ ] Legend shows category name + amount + percentage
- [ ] Bar chart shows last 6 months with earned (gold) and spent (charcoal) bars
- [ ] Top merchants list shows 1-5 ranked with gold rank circles
- [ ] Charts handle empty data gracefully
- [ ] Charts render without SSR errors (dynamic import)

### Step 10 — OTP Modal
- [ ] Modal opens with orange shield icon and "Security Verification Required"
- [ ] Flag reason displayed in amber box
- [ ] 6-digit OTP displayed in gold monospace 48px font
- [ ] Countdown timer counts down from 5:00
- [ ] Timer turns red under 1 minute
- [ ] 6 individual digit input boxes with auto-advance
- [ ] Gold border on focused input box
- [ ] Wrong code: shake animation + red border + attempts remaining message
- [ ] 3 wrong attempts: "Account frozen" message, all inputs disabled
- [ ] Expired: "Code expired. Request new code" with refresh button
- [ ] Correct code: green checkmark + "Transaction Approved"
- [ ] Cancel button closes modal without proceeding

### Step 11 — Dashboard Page
- [ ] Dashboard loads all 5 sections without errors
- [ ] Auth guard redirects to /login if not authenticated
- [ ] Balance card section renders with correct data
- [ ] Advisor card section renders with recommendation
- [ ] Transaction timeline shows last 10 entries with "View All" link
- [ ] Investment portfolio shows FD cards
- [ ] Analytics charts render with real data
- [ ] Each section handles its own loading/error state independently
- [ ] Persona switcher in sidebar updates all sections instantly

### Step 12 — Wallet Pages
- [ ] /wallet shows balance card + quick actions + recent transactions + FD summary
- [ ] /wallet/transactions shows full history with pagination
- [ ] Filter tabs work on transactions page
- [ ] /wallet/invest shows FD creation form
- [ ] Principal input validates minimum ₹500
- [ ] Tenure slider ranges 30-365 days
- [ ] Live calculation preview updates as user types
- [ ] ₹500 for 30 days shows maturity ₹503.08
- [ ] ₹1,000 for 30 days shows maturity ₹1,006.16
- [ ] Creating FD deducts from available and increases locked balance
- [ ] URL query param ?amount=1000 pre-fills the principal input

### Step 13 — Merchant + Checkout Pages
- [ ] /merchants shows grid of merchant cards from GET /api/merchants
- [ ] Each merchant card shows name, category, cashback rate
- [ ] Click merchant navigates to /merchants/:merchantId
- [ ] Merchant detail shows "Pay at this merchant" button
- [ ] /checkout shows order summary with balance check
- [ ] Sufficient balance: green checkmark
- [ ] Insufficient balance: red warning
- [ ] Clicking Pay runs fraud check first
- [ ] Fraud ALLOW → PayU form params fetched → browser redirects to PayU
- [ ] Fraud REQUIRE_OTP → OTP modal opens
- [ ] Fraud BLOCK → red error message
- [ ] Success page shows green checkmark + transaction details
- [ ] Failure page shows red X + error reason + retry button
- [ ] Success page calls refreshAll to update wallet balance

### Step 14 — Analytics Page
- [ ] Summary stats row shows 4 stat cards
- [ ] Total Earned in gold, Total Spent in red, Savings Rate in green, Avg/Month in blue
- [ ] Donut chart and bar chart render side by side on desktop
- [ ] Top merchants list renders below charts
- [ ] All sections handle loading and empty states

### Step 15 — Claude Advisor Service
- [ ] `buildAdvisorContext` fetches wallet, ledger, FDs, and computes all context fields
- [ ] `buildSystemPrompt` returns prompt with all constraints
- [ ] `buildUserPrompt` formats context with exact rupee amounts and merchant names
- [ ] `generateAdvisorRecommendation` calls Anthropic API with claude-sonnet-4-20250514
- [ ] Response parsed as JSON with all four fields validated
- [ ] Recommendation stored in AdvisorRecommendation table (upsert)
- [ ] GET /api/advisor/:userId returns latest recommendation
- [ ] POST /api/advisor/:userId/refresh triggers fresh Claude call
- [ ] Priya receives Zomato-specific recommendation with FD split
- [ ] Arjun receives onboarding guidance (not investment advice)
- [ ] Rajan receives FD renewal strategy
- [ ] Meera receives travel-aware liquidity advice
- [ ] Vikram receives standard advice (no special fraud mention in advisor)

### Final Integration Check — Full Demo Flow
- [ ] Login as Priya via quick-login button
- [ ] Dashboard loads with all 5 sections populated
- [ ] Priya's balance: ₹4,280 available (green), ₹340 pending (slate), ₹2,000 locked (gold)
- [ ] Advisor card shows Priya-specific Zomato recommendation
- [ ] Transaction timeline shows colour-coded entries
- [ ] FD portfolio shows 2 active FDs
- [ ] Analytics charts render with real data
- [ ] Switch to Arjun via persona switcher — all sections update instantly
- [ ] Arjun's advisor shows onboarding message (not investment advice)
- [ ] Switch to Rajan — 3 active FDs in portfolio
- [ ] Switch to Vikram — fraud-flagged transactions in timeline
- [ ] Navigate to /wallet/invest — create FD with ₹500 for 30 days
- [ ] FD created, balance updates, redirect to dashboard
- [ ] Navigate to /checkout — attempt payment
- [ ] As Vikram: fraud check fires → OTP modal appears
- [ ] OTP displayed in gold monospace, countdown timer running
- [ ] Enter correct OTP → transaction proceeds
- [ ] Enter wrong OTP 3 times → account frozen message
- [ ] Click "Refresh Analysis" on advisor card → real Claude API call
- [ ] Loading shows "Analysing your financial patterns..."
- [ ] Response contains specific merchant names and rupee amounts
- [ ] No console errors in browser DevTools during full demo flow
- [ ] Dark charcoal theme consistent across all pages
- [ ] Gold used only for primary CTAs and key highlights
- [ ] No purple, pink, or violet anywhere
- [ ] All loading states handled — no blank screens
- [ ] All error states handled — no unhandled promise rejections visible
- [ ] Mobile responsive — sidebar collapses correctly

---

## Complexity Summary

| Step | Component | Complexity | Reason |
|------|-----------|------------|--------|
| 1 | Global Layout + Design Tokens | Medium | Sidebar with persona switcher, mobile responsive bottom tab bar |
| 2 | Auth Pages | Low | Standard forms with persona quick-login buttons |
| 3 | Zustand Stores | Medium | Two stores, parallel fetch, localStorage persistence |
| 4 | API Client + Hooks | Medium | Axios interceptors, 5 hooks with consistent patterns |
| 5 | Balance Card | Low | Pure display component with well-defined props |
| 6 | Advisor Card | Medium | Conditional rendering, action item parsing, refresh state |
| 7 | Transaction Timeline | Medium | Colour-coding, filters, status badges, special styling |
| 8 | Investment Portfolio | Medium | FD card states, penalty modal, 7-day lock check |
| 9 | Spend Analytics | Medium | Recharts dark theme, SSR compatibility, 3 chart types |
| 10 | OTP Modal | High | 6-digit input, countdown timer, shake animation, state machine |
| 11 | Dashboard Page | Medium | Assembly of components, auth guard, parallel loading |
| 12 | Wallet Pages | Medium | Invest form with live preview, pagination, filters |
| 13 | Merchant + Checkout | High | Multi-step async flow: fraud → OTP → PayU redirect |
| 14 | Analytics Page | Low | Assembly of existing chart components |
| 15 | Claude Advisor Service | High | Context building, prompt engineering, Anthropic API integration |

**Total estimated implementation time: 4-5 days for an experienced developer**

---

## Rules.md Compliance Summary

| Rule | How Phase 3 Enforces It |
|------|------------------------|
| Business logic in `/services` only | Advisor service in `src/services/advisor/` — components are display-only |
| One file per responsibility | Each component, hook, and service file owns one concern |
| No circular imports | Components import from hooks, hooks import from stores, stores import from api-client |
| Zero hardcoded secrets | API base URL from environment, ANTHROPIC_API_KEY from .env |
| Never trust client amounts | Checkout sends amount to server — server re-validates from DB |
| JWT on every endpoint | API client interceptor adds Bearer token to all requests |
| Never log sensitive data | No console.logs with tokens, OTPs, or API keys |
| Consistent error shape | All API errors extracted into `{ error: { message, code } }` |
| Every async wrapped in try-catch | All hooks, store actions, and service functions have error handling |
| No function > 40 lines | Components split into sub-components, hooks are thin wrappers |
| Named constants | Design tokens in CSS variables, thresholds from backend constants |
| External API calls have timeout | Axios client has 15s default timeout, Claude call has 30s timeout |
| No commented-out code | Clean codebase — no debug artifacts |
| No debug console.logs | Only structured operational logs in services |
