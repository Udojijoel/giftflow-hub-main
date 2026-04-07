# CardFlip Backend

Express.js + PostgreSQL backend for the CardFlip gift card trading platform.
Built to match the Lovable-generated frontend API contract exactly.

---

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables
```bash
cp .env.example .env
```
Fill in your `.env` file. Minimum required to run locally:
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/cardflip_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=any-long-random-string-here-32-chars
JWT_REFRESH_SECRET=another-long-random-string-here-32
FRONTEND_URL=http://localhost:5173
ADMIN_PIN=123456
```

### 3. Start PostgreSQL + Redis (Docker)
```bash
docker-compose up -d
```

### 4. Create database tables
```bash
npm run db:push
```

### 5. Seed card brands and admin account
```bash
npm run db:seed
```

### 6. Start the server
```bash
npm run dev
```

Server runs on `http://localhost:5000`
Health check: `http://localhost:5000/health`

---

## Admin Credentials (after seed)
| Field | Value |
|---|---|
| Phone | +2348000000000 |
| Password | Admin@123456 |
| PIN | 123456 |
| Admin panel PIN | 123456 (set ADMIN_PIN in .env) |

---

## Connect to Lovable Frontend

In your Lovable project, set this environment variable:
```
VITE_API_BASE_URL=http://localhost:5000/api
```

For production (Railway):
```
VITE_API_BASE_URL=https://your-railway-url.up.railway.app/api
```

---

## API Endpoints

All 30 endpoints match the `API_Reference.md` in your frontend repo exactly.

| Group | Endpoints |
|---|---|
| Auth | POST /auth/register, /auth/verify-otp, /auth/login, /auth/refresh-token, /auth/forgot-password, /auth/reset-password, /auth/logout |
| Rates | GET /rates, /rates/:brandId |
| Trades | POST /trades/submit, GET /trades, /trades/active, /trades/:id |
| Wallet | GET /wallet/balance, /wallet/transactions, /wallet/banks, DELETE /wallet/banks/:id, POST /wallet/add-bank, /wallet/withdraw |
| Support | GET /support/tickets, /support/tickets/:id, POST /support/tickets, /support/tickets/:id/messages |
| Referrals | GET /referrals/stats, /referrals/history |
| Notifications | GET /notifications, PATCH /notifications/read-all |
| KYC | GET /kyc/status, POST /kyc/submit |
| Admin | All /admin/* routes |
| Webhooks | POST /webhooks/paystack |

---

## Deploy to Railway

1. Push this folder to GitHub
2. Go to railway.app → New Project → Deploy from GitHub
3. Set Root Directory to the backend folder
4. Add all environment variables from `.env.example`
5. Add PostgreSQL and Redis from Railway dashboard
6. Railway auto-deploys and gives you a public URL
7. Set that URL as `VITE_API_BASE_URL` in Lovable
