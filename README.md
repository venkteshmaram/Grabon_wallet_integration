# GrabCash Wallet 🏦

GrabCash is a premium, intelligent wallet application designed to help users grow their wealth automatically. It turns every transaction into an opportunity for long-term growth by investing cashback into high-yield Fixed Deposits (FDs), protected by AI-driven fraud detection and guided by a personalized Claude-powered financial advisor.

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: v18.x or higher
- **PostgreSQL**: A running instance (local or hosted)
- **Ngrok**: For handling PayU payment callbacks locally

### 2. Environment Setup
Create a `.env` file in the root directory and populate it with the following keys. You can use `.env.example` as a template.

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/grabcash"

# Auth
JWT_SECRET="your_32_char_secret_key" 
#any random 32char key

# AI Advisor (Claude)
ANTHROPIC_API_KEY="sk-ant-..."

# PayU Sandbox
PAYU_KEY="your_test_key"
PAYU_SALT="your_test_salt"
PAYU_SUCCESS_URL="https://your-ngrok-url.ngrok.io/api/payu/success"
PAYU_FAILURE_URL="https://your-ngrok-url.ngrok.io/api/payu/failure"
```

### 3. Installation
```bash
npm install
```

### 4. Database Setup (Prisma)
Initialize your database schema and seed it with demo data.

```bash
# Generate Prisma Client
npm run prisma:generate

# Run Migrations to create tables
npm run prisma:migrate

# Seed the database with demo merchants and users
npm run seed
```

### 5. Reverse Tunneling (Ngrok)
PayU requires a public HTTPS endpoint to send payment success/failure notifications. Since local servers use `localhost`, you must use Ngrok.

1.  Start your development server:
    ```bash
    npm run dev
    ```
2.  In a separate terminal, start Ngrok on port 3000:
    ```bash
    ngrok http 3000
    ```
3.  Copy the `https://...` URL provided by Ngrok.
4.  Update `PAYU_SUCCESS_URL` and `PAYU_FAILURE_URL` in your `.env` file with this new URL.
5.  **Important**: You must update these URLs every time you restart Ngrok.

## 🛠️ Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS + Framer Motion
- **AI**: Anthropic Claude 3.5 Sonnet
- **State Management**: Zustand
- **Payments**: PayU India (Sandbox)

## 🌟 Key Features
- **Smart Wallet**: Real-time balance tracking with automatic cashback settlement.
- **Auto-Invest FDs**: Goal-based investments at 7.5% p.a.
- **Claude Advisor**: A "chill financial buddy" that gives punchy, data-grounded advice.
- **Fraud Engine**: Monitors transaction velocity and anomalies to block suspicious activity.
- **Premium UI**: Dark-mode first design with glassmorphism and smooth animations.

## 📜 Available Scripts
- `npm run dev`: Starts development server.
- `npm run build`: Builds for production.
- `npm run prisma:studio`: Opens a GUI to view/edit your database.
- `npm run test`: Runs the Jest test suite.
