# FinTrack

A premium personal finance and expense tracker with ultra-fast expense capture, account/credit card separation, dashboards, analytics, and a polished mobile-first UI.

## Features

- **Ultra-fast expense entry** — Half-screen quick-add bottom sheet, 2-3 taps to log an expense
- **Account & Credit Card separation** — Proper financial logic where credit card spending increases debt, not reduces bank balance
- **Dashboard** — Net worth, monthly overview, spending by category (donut chart), 6-month trend (area chart), budget health
- **Budgets** — Monthly category budgets with visual progress bars and overspend warnings
- **Transactions** — Full list with search, filters, and grouped date display
- **Quick-add route** — `/quick-add?amount=50&category=Groceries` for shortcut/widget integration
- **Dark mode** — Full dark theme with system preference detection
- **CSV export** — Download transaction data
- **Mobile-first** — Bottom navigation, touch-optimized, responsive to desktop

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI (Python) |
| ORM | SQLAlchemy 2.0 (async) |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Frontend | Next.js 14+ (App Router, TypeScript) |
| Styling | Tailwind CSS 4 |
| Animation | Framer Motion |
| Charts | Recharts |
| State | TanStack Query + Zustand |
| Icons | Lucide React |

## Prerequisites

- Python 3.9+
- Node.js 18+
- npm 9+

## Quick Start

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env

# Load demo data
python -m app.seed

# Start server
uvicorn app.main:app --reload --port 8000
```

API docs available at http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1" > .env.local

# Start dev server
npm run dev
```

Open http://localhost:3000

## Environment Variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `sqlite+aiosqlite:///./fintrack.db` | Database connection string |
| `CORS_ORIGINS` | `http://localhost:3000` | Allowed CORS origins |
| `DEFAULT_CURRENCY` | `CAD` | Default currency code |

### Frontend (`frontend/.env.local`)

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000/api/v1` | Backend API base URL |

## Account vs Credit Card Logic

This is a core design principle:

| Action | Account Effect | Credit Card Effect |
|--------|---------------|-------------------|
| Expense from account | Balance decreases | — |
| Expense from credit card | — | Outstanding increases |
| Income | Balance increases | — |
| Transfer (account to account) | Source decreases, destination increases | — |
| Card payment (account to card) | Balance decreases | Outstanding decreases |

Credit card expenses **never** reduce bank account balance directly. Card payments explicitly move money from a bank account to reduce card debt.

## Shortcut Integration

### Quick-Add URL

```
http://localhost:3000/quick-add?amount=50&category=Groceries&type=expense&source=Checking
```

Parameters (all optional):
- `amount` — Pre-filled amount
- `category` — Category name or ID
- `type` — `expense` or `income`
- `source` — Account/card name or ID

### Quick-Add API

```bash
POST /api/v1/transactions/quick
Content-Type: application/json

{
  "amount": 50.00,
  "category_id": "uuid-here",
  "source_type": "account",
  "source_id": "uuid-here",
  "type": "expense",
  "date": "2026-03-26"
}
```

### iOS Shortcuts

1. Create a new Shortcut
2. Add "Open URL" action: `https://your-domain.com/quick-add`
3. Or use "Get Contents of URL" for headless: POST to `/api/v1/transactions/quick`

## Hosting

### Backend (Railway, Render, Fly.io)

1. Set `DATABASE_URL` to a PostgreSQL connection string
2. Set `CORS_ORIGINS` to your frontend domain
3. Deploy with: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Frontend (Vercel)

1. Connect your GitHub repo
2. Set root directory to `frontend`
3. Set `NEXT_PUBLIC_API_URL` to your backend URL
4. Deploy

## Database Schema

6 tables: `accounts`, `credit_cards`, `categories`, `transactions`, `budgets`, `user_preferences`

See [design spec](docs/superpowers/specs/2026-03-26-fintrack-design.md) for full schema.

## Screens

1. **Dashboard** — Financial overview with charts and summaries
2. **Transactions** — Searchable, filterable list
3. **Quick-Add** — Half-screen bottom sheet for fast entry
4. **Accounts** — Bank account management
5. **Credit Cards** — Card management with pay-bill flow
6. **Budgets** — Monthly budget tracking with progress bars
7. **Quick-Add Route** — Standalone page for shortcut integration
8. **Settings** — Theme, categories, export
9. **Transaction Form** — Full create/edit with all fields

## Known Limitations

- Single-user only (no authentication)
- No recurring transaction auto-execution
- No bank sync or statement import
- Single display currency (schema supports multi-currency)
- SQLite for development (use PostgreSQL for production)

## Next Improvements

1. User authentication (JWT)
2. Recurring transaction scheduler
3. Bank statement import (CSV/OFX)
4. Multi-currency with exchange rates
5. PWA support for installable mobile experience
6. PostgreSQL migration

---

Built with Claude Code.
