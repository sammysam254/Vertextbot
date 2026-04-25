# 🏦 Escrow Bot

Centralized Escrow & Crypto Invoicing Telegram Bot built with Node.js, Telegraf, Supabase, and NOWPayments.

---

## 📱 TERMUX SETUP (Build & Run Locally)

### 1. Install prerequisites in Termux

```bash
# Update packages
pkg update && pkg upgrade -y

# Install Node.js, git, and OpenSSL (needed for crypto)
pkg install nodejs-lts git openssl -y

# Verify versions
node --version   # should be v18+
npm --version
git --version
```

### 2. Clone your repo (or copy files)

```bash
# If you have a GitHub repo:
git clone https://github.com/YOUR_USERNAME/escrow-bot.git
cd escrow-bot

# Or if starting fresh, create the folder:
mkdir escrow-bot && cd escrow-bot
# (then paste all files into their paths)
```

### 3. Install dependencies

```bash
npm install
```

### 4. Set up environment variables

```bash
cp .env.example .env
nano .env   # or: vi .env
```

Fill in all values (see .env.example for reference).

### 5. Build TypeScript

```bash
npm run build
# Compiled output will be in ./dist/
```

### 6. Run the bot locally (long-polling mode)

```bash
# Make sure USE_WEBHOOK=false in your .env
npm start
```

### 7. Keep it running in Termux background

```bash
# Option A: Use tmux (install first)
pkg install tmux -y
tmux new -s escrow
npm start
# Detach: Ctrl+B then D
# Reattach: tmux attach -t escrow

# Option B: nohup
nohup npm start > bot.log 2>&1 &
tail -f bot.log
```

### Useful Termux dev commands

```bash
# Watch logs in real time
tail -f bot.log

# Rebuild after code changes
npm run build && npm start

# Check if process is running
ps aux | grep node

# Kill the bot
pkill -f "node dist/index.js"
```

---

## 🗄️ SUPABASE SETUP

1. Go to [supabase.com](https://supabase.com) → New Project
2. Open **SQL Editor** → paste the entire contents of `schema.sql` → Run
3. Go to **Settings → API**:
   - Copy `Project URL` → `SUPABASE_URL`
   - Copy `service_role` key (secret) → `SUPABASE_SERVICE_KEY`

---

## 🤖 TELEGRAM BOT SETUP

1. Message [@BotFather](https://t.me/BotFather) → `/newbot`
2. Copy the token → `BOT_TOKEN`
3. Copy the bot username (without @) → `BOT_USERNAME`
4. Create an admin channel/group and get its ID → `ADMIN_CHAT_ID`
   - Forward a message from the channel to [@userinfobot](https://t.me/userinfobot) to get the ID

---

## 💳 NOWPAYMENTS SETUP

1. Sign up at [nowpayments.io](https://nowpayments.io)
2. **Settings → API Keys** → Create API key → `NOW_API_KEY`
3. **Settings → Payout API** → Enable and create key → `NOW_PAYOUT_KEY`
4. **Settings → IPN** → Set your webhook URL and copy secret → `NOW_IPN_SECRET`
   - IPN URL: `https://your-app.onrender.com/webhook/nowpayments`

---

## 🚀 GITHUB + RENDER DEPLOYMENT

### Step 1 — Push to GitHub

```bash
cd escrow-bot

# Initialize git if not done
git init
git add .
git commit -m "Initial commit"

# Create repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/escrow-bot.git
git branch -M main
git push -u origin main
```

### Step 2 — Deploy on Render

1. Go to [render.com](https://render.com) → **New → Web Service**
2. Connect your GitHub repo
3. Render auto-detects `render.yaml` — or configure manually:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Node Version:** 20
4. Add all environment variables from `.env.example` in the Render dashboard
5. Set `USE_WEBHOOK=true` and `WEBHOOK_DOMAIN=https://YOUR-APP.onrender.com`
6. Deploy!

### Step 3 — Get the Deploy Hook URL

1. In Render → Your Service → **Settings → Deploy Hook**
2. Copy the URL

### Step 4 — Add GitHub Secret

1. GitHub Repo → **Settings → Secrets → Actions**
2. Add: `RENDER_DEPLOY_HOOK_URL` = the URL from step 3

Now every `git push` to `main` runs TypeScript checks and auto-deploys to Render. ✅

### Step 5 — Set up UptimeRobot (prevent sleep)

1. Go to [uptimerobot.com](https://uptimerobot.com) → Add Monitor
2. Type: **HTTP(s)**
3. URL: `https://your-app.onrender.com/ping`
4. Interval: **5 minutes**

This pings your bot every 5 minutes to prevent Render free tier from sleeping.

---

## 📁 PROJECT STRUCTURE

```
escrow-bot/
├── src/
│   ├── index.ts              # Entry point
│   ├── bot.ts                # Telegraf bot assembly
│   ├── server.ts             # Express + webhook handler
│   ├── config.ts             # Env var validation
│   ├── supabase.ts           # DB client + helpers
│   ├── nowpayments.ts        # NOWPayments API client
│   ├── types.ts              # TypeScript interfaces
│   └── handlers/
│       ├── onboarding.ts     # /start + merchant registration
│       ├── invoice.ts        # /invoice + /balance
│       ├── checkout.ts       # Customer deep-link + QR
│       └── withdrawal.ts     # /withdraw + admin callbacks
├── schema.sql                # Supabase database schema
├── render.yaml               # Render deployment config
├── .github/workflows/
│   └── deploy.yml            # GitHub Actions CI/CD
├── package.json
├── tsconfig.json
├── .env.example
└── .gitignore
```

---

## 🔄 USER FLOWS

### Merchant Flow
1. `/start` → Click "Register as Merchant"
2. Select payout network (TRC20/BEP20/MATIC)
3. Send wallet address
4. `/invoice 50.00 Logo design` → Get shareable link
5. `/balance` → Check earnings
6. `/withdraw 45.00` → Confirm → Receive payout

### Customer Flow
1. Click merchant's deep link `t.me/BotName?start=inv_UUID`
2. Bot sends QR code + tap-to-copy address and amount
3. Pay exact crypto amount
4. Merchant gets notified automatically via IPN webhook

---

## ⚠️ IMPORTANT NOTES

- Always use `SUPABASE_SERVICE_KEY` (service role), NOT the anon key
- The `deduct_balance` RPC is atomic — safe against race conditions
- Admin fallback buttons only work if `ADMIN_CHAT_ID` is a group/channel your bot is admin of
- Network fees are fetched live from NOWPayments with static fallbacks if the API fails
- Never commit your `.env` file — it's in `.gitignore`
