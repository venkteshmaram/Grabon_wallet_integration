# GrabCash Wallet — Codebase Documentation

## Currency Handling
**All financial amounts are stored in INR (Indian Rupees) as integers representing PAISA.**
- ₹1 = 100 paisa (stored as `100`)
- ₹100.50 = 10050 paisa (stored as `10050`)
- This eliminates floating-point errors common in financial calculations
- Application layer converts between rupees (display) and paisa (storage)

## Database: PostgreSQL (Production-Grade)
**Why PostgreSQL:**
- **Production-grade** - Industry standard for financial applications
- **ACID compliance** - Guaranteed data integrity for wallet transactions
- **Concurrent access** - Multiple users can transact simultaneously
- **Advanced features** - Full enum support, JSON fields, better indexing

**Local Setup:**
1. Download PostgreSQL from https://www.postgresql.org/download/
2. Install with default settings (port 5432)
3. Create database: `createdb grabcash`
4. Update `.env.local` with your credentials

**Schema Location:** [`prisma/schema.prisma`](grabcash-wallet/prisma/schema.prisma)

## Dependencies Guide

### Core Framework
- **`next@14`** — React framework with App Router for server-side rendering and API routes. Powers the entire application structure at `src/app/`.
- **`react@18` + `react-dom@18`** — UI library for component-based architecture. Used in all page and component files.
- **`typescript`** — Type safety across the entire codebase. All files use `.ts` and `.tsx` extensions.

### Styling & UI
- **`tailwindcss`** — Utility-first CSS framework for rapid UI development. Configured in `tailwind.config.ts`, used in all component files.
- **`postcss` + `autoprefixer`** — CSS processing pipeline. Configured in `postcss.config.mjs` for Tailwind compilation.
- **`@tailwindcss/typography`** — Prose styling plugin for rich text content in advisor recommendations.
- **`class-variance-authority`** — Type-safe utility for creating polymorphic UI component variants (buttons, inputs).
- **`clsx` + `tailwind-merge`** — Conditional class merging utilities for dynamic Tailwind classes in components.
- **`lucide-react`** — Icon library used across all UI components for consistent iconography.

### Database & ORM
- **`prisma`** — Database schema management and migrations. Schema defined in `prisma/schema.prisma`.
- **`@prisma/client`** — Type-safe database client auto-generated from schema. Used in all service files.
- **`ts-node`** — TypeScript execution for Prisma seed scripts and migrations.

### Validation
- **`zod`** — Runtime schema validation for API payloads, forms, and environment variables. Used in all API routes.

### Authentication & Security
- **`jsonwebtoken`** — JWT token generation and verification for session management. Used in auth middleware and login.
- **`bcryptjs`** — Password hashing for secure user credential storage. Used in registration and login services.

### HTTP & State
- **`axios`** — HTTP client for external API calls (PayU, Anthropic Claude). Used in payment and advisor services.
- **`zustand`** — Lightweight state management for client-side UI state. Used in wallet and transaction stores.

### Date & Charts
- **`date-fns`** — Date manipulation and formatting. Used in ledger entries, FD maturity calculations, and analytics.
- **`recharts`** — React charting library for analytics dashboards (`/analytics/*` pages).

### Utilities
- **`uuid`** — UUID generation for database primary keys. Used when creating users, wallets, transactions.

### Testing
- **`jest`** + **`@testing-library/react`** + **`@testing-library/jest-dom`** — Unit and integration testing framework.

### Background Jobs
- **`node-cron`** — Cron job scheduling for FD maturity checks and pending settlement processing.

### Logging
- **`winston`** — Structured logging for production observability. Logs all financial transactions and errors.
