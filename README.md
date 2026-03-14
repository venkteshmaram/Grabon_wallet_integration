# GrabCash Wallet 🏦

GrabCash is a premium, intelligent wallet application designed to help users grow their wealth automatically. It turns every transaction into an opportunity for long-term growth by investing cashback into high-yield Fixed Deposits (FDs), protected by AI-driven fraud detection and guided by a personalized Claude-powered financial advisor.

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: v18.x or higher
- **PostgreSQL**: A running instance (local or hosted)
- **Ngrok**: For handling PayU payment callbacks locally

### 1. Clone & Enter Project

```bash
git clone <your-repo-url>
cd grabcash-wallet
```

### 2. Database Setup 🗄️

1.  **Install PostgreSQL**: Ensure you have PostgreSQL installed and running on your machine.
2.  **Configure Credentials**: Open your `.env` file and update the `DATABASE_URL` with your local Postgres credentials (see Step 4).
3.  **Create Database**: We've provided a helper script to create the database for you (see Step 5).

### 3. Getting Your Keys 🔑

Before running the app, you need to collect these API keys:

1.  **Anthropic (Claude Advisor)**:
    - Go to [console.anthropic.com](https://console.anthropic.com/).
    - Generate an API key to power the "Chill Financial Buddy" recommendations.
2.  **PayU (Payments)**:
    - Go to [PayU Developer Portal](https://developer.payu.in/).
    - Sign up for a **Test Merchant Account** and find your **Merchant Key** and **Salt**.

### 4. Environment Configuration

Create a `.env` file in the root directory and update these lines:

```bash
# Database (Local PostgreSQL)
# Format: postgresql://USER:PASSWORD@localhost:5432/grabcash
DATABASE_URL="postgresql://postgres:password@localhost:5432/grabcash"

# Auth
JWT_SECRET="any_random_32_character_string_here"

# AI Advisor (Claude)
ANTHROPIC_API_KEY="sk-ant-..."

# PayU Sandbox (Update NGROK_URL after starting Ngrok in Terminal 2)
PAYU_KEY="your_test_key"
PAYU_SALT="your_test_salt"
PAYU_SUCCESS_URL="[NGROK_URL]/api/payu/success"
PAYU_FAILURE_URL="[NGROK_URL]/api/payu/failure"
```

### 5. Installation & Initial Setup

Follow these steps in your terminal:

```bash
# 1. Install dependencies
npm install

# 2. Create the 'grabcash' database automatically
# (Uses your DATABASE_URL from .env)
node create-db.js

# 3. Sync database schema & generate client
npm run prisma:generate
npm run prisma:migrate

# 4. Load demo merchants & test user
npm run seed
```

### 6. Running the Application (The "Three Terminal" Workflow)

To test the full lifecycle (including PayU payments), you need three terminal windows open:

**Terminal 1: The Dev Server**
```bash
npm run dev
```

**Terminal 2: The Ngrok Tunnel (CRITICAL for PayU)**
PayU cannot send data back to `localhost`. You need a public URL.
```bash
# Start tunnel on port 3000
npx ngrok http 3000
```
- Copy the `https://...` URL (e.g., `https://a1b2-c3d4.ngrok-free.app`).
- **Update your `.env` file**: Paste this URL into `PAYU_SUCCESS_URL` and `PAYU_FAILURE_URL`.
- Restart Terminal 1 if you changed `.env`.

**Terminal 3: Database GUI (Optional but helpful)**
```bash
npm run prisma:studio
```
- This opens a web interface at `localhost:5555` to view your transactions and FDs in real-time.


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
