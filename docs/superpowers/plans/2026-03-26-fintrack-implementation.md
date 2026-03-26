# FinTrack Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a premium personal finance tracker with ultra-fast expense capture, account/credit card separation, dashboards, budgets, and a polished mobile-first UI.

**Architecture:** FastAPI backend with SQLAlchemy models serving a REST API. Next.js 14 frontend with Tailwind CSS, Framer Motion, and Recharts. SQLite for local dev, PostgreSQL-ready via DATABASE_URL. Single-user, no auth.

**Tech Stack:** Python 3.11+, FastAPI, SQLAlchemy 2.0, Alembic, Next.js 14, TypeScript, Tailwind CSS 4, Framer Motion, Recharts, TanStack Query, Zustand, Lucide React

**Spec:** `docs/superpowers/specs/2026-03-26-fintrack-design.md`

---

## Task 1: Backend Foundation — Config, Database, Models

**Files:**
- Create: `backend/app/__init__.py`
- Create: `backend/app/config.py`
- Create: `backend/app/database.py`
- Create: `backend/app/models/__init__.py`
- Create: `backend/app/models/account.py`
- Create: `backend/app/models/credit_card.py`
- Create: `backend/app/models/category.py`
- Create: `backend/app/models/transaction.py`
- Create: `backend/app/models/budget.py`
- Create: `backend/app/models/preference.py`
- Create: `backend/requirements.txt`
- Create: `backend/.env.example`
- Create: `backend/.env`

- [ ] **Step 1: Create requirements.txt**

```
fastapi==0.115.0
uvicorn[standard]==0.30.6
sqlalchemy[asyncio]==2.0.35
aiosqlite==0.20.0
alembic==1.13.2
pydantic==2.9.2
pydantic-settings==2.5.2
python-dotenv==1.0.1
httpx==0.27.2
```

- [ ] **Step 2: Create .env.example and .env**

`.env.example`:
```
DATABASE_URL=sqlite+aiosqlite:///./fintrack.db
CORS_ORIGINS=http://localhost:3000
DEFAULT_CURRENCY=CAD
```

Copy to `.env` with same values.

- [ ] **Step 3: Create config.py**

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str = "sqlite+aiosqlite:///./fintrack.db"
    cors_origins: str = "http://localhost:3000"
    default_currency: str = "CAD"

    class Config:
        env_file = ".env"

settings = Settings()
```

- [ ] **Step 4: Create database.py**

```python
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from app.config import settings

engine = create_async_engine(settings.database_url, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

async def get_db():
    async with async_session() as session:
        yield session

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
```

- [ ] **Step 5: Create all 6 model files**

`models/account.py` — Account with id (UUID), name, type (enum: checking/savings/cash/custom), balance (Numeric 12,2), currency (String 3, default "CAD"), icon, color, is_active (default True), created_at, updated_at.

`models/credit_card.py` — CreditCard with id (UUID), name, issuer (nullable), network (nullable), credit_limit (Numeric 12,2), outstanding_balance (Numeric 12,2), currency, statement_day (nullable int), due_day (nullable int), icon, color, is_active, created_at, updated_at.

`models/category.py` — Category with id (UUID), name, type (enum: expense/income), icon, color, is_default (bool), sort_order (int).

`models/transaction.py` — Transaction with id (UUID), type (enum: expense/income/transfer/card_payment), amount (Numeric 12,2), currency, category_id (FK nullable), source_type (enum: account/credit_card), source_id (UUID), destination_type (nullable enum), destination_id (nullable UUID), merchant (nullable), note (nullable), tags (JSON, default []), date, is_recurring (default False), recurring_rule (JSON nullable), created_at, updated_at.

`models/budget.py` — Budget with id (UUID), category_id (FK nullable), amount (Numeric 12,2), month (int), year (int), created_at.

`models/preference.py` — UserPreference with id (UUID), key (unique string), value (string).

`models/__init__.py` — import all models so Base.metadata knows about them.

All UUIDs use `uuid.uuid4` as default. All timestamps use `func.now()`. Use SQLAlchemy 2.0 `Mapped` type annotations.

- [ ] **Step 6: Install dependencies and verify models load**

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -c "from app.models import *; from app.database import Base; print(f'Tables: {list(Base.metadata.tables.keys())}')"
```

Expected: `Tables: ['accounts', 'credit_cards', 'categories', 'transactions', 'budgets', 'user_preferences']`

- [ ] **Step 7: Commit**

```bash
git add backend/
git commit -m "feat: backend foundation — config, database, and all models"
```

---

## Task 2: Backend Pydantic Schemas

**Files:**
- Create: `backend/app/schemas/__init__.py`
- Create: `backend/app/schemas/account.py`
- Create: `backend/app/schemas/credit_card.py`
- Create: `backend/app/schemas/category.py`
- Create: `backend/app/schemas/transaction.py`
- Create: `backend/app/schemas/budget.py`
- Create: `backend/app/schemas/preference.py`

- [ ] **Step 1: Create all schema files**

Each schema module has: `Create` (input), `Update` (partial input), and `Response` (output with id/timestamps) models.

`schemas/account.py`:
- `AccountCreate`: name (str), type (AccountType enum), balance (Decimal), currency (str = "CAD"), icon (str = "wallet"), color (str = "#0D9488")
- `AccountUpdate`: all fields optional
- `AccountResponse`: all fields + id (UUID), is_active, created_at, updated_at. Config: `from_attributes = True`

`schemas/credit_card.py`:
- `CreditCardCreate`: name, issuer (optional), network (optional), credit_limit (Decimal), outstanding_balance (Decimal = 0), currency (str = "CAD"), statement_day (optional int), due_day (optional int), icon (str = "credit-card"), color (str = "#8B5CF6")
- `CreditCardUpdate`: all optional
- `CreditCardResponse`: all + id, is_active, timestamps

`schemas/category.py`:
- `CategoryCreate`: name, type (CategoryType), icon, color, sort_order (int = 0)
- `CategoryUpdate`: all optional
- `CategoryResponse`: all + id, is_default

`schemas/transaction.py`:
- `TransactionCreate`: type (TransactionType), amount (Decimal, gt=0), currency (str = "CAD"), category_id (optional UUID), source_type (SourceType), source_id (UUID), destination_type (optional), destination_id (optional UUID), merchant (optional str), note (optional str), tags (list[str] = []), date (date), is_recurring (bool = False), recurring_rule (optional dict)
- `TransactionUpdate`: all optional
- `TransactionResponse`: all + id, timestamps
- `QuickTransactionCreate`: amount (Decimal, gt=0), category_id (UUID), source_type (SourceType), source_id (UUID), type (TransactionType = expense), merchant (optional), date (date = today), note (optional)

`schemas/budget.py`:
- `BudgetCreate`: category_id (optional UUID), amount (Decimal), month (int 1-12), year (int)
- `BudgetUpdate`: amount optional
- `BudgetResponse`: all + id, created_at
- `BudgetStatus`: budget (BudgetResponse), spent (Decimal), remaining (Decimal), percentage (float)

`schemas/preference.py`:
- `PreferenceUpdate`: key (str), value (str)
- `PreferenceResponse`: id, key, value

- [ ] **Step 2: Verify schemas import cleanly**

```bash
python -c "from app.schemas import account, credit_card, category, transaction, budget, preference; print('All schemas loaded')"
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/schemas/
git commit -m "feat: add Pydantic schemas for all models"
```

---

## Task 3: Backend CRUD Routers — Accounts, Credit Cards, Categories, Preferences

**Files:**
- Create: `backend/app/routers/__init__.py`
- Create: `backend/app/routers/accounts.py`
- Create: `backend/app/routers/credit_cards.py`
- Create: `backend/app/routers/categories.py`
- Create: `backend/app/routers/preferences.py`
- Create: `backend/app/main.py`

- [ ] **Step 1: Create accounts router**

`routers/accounts.py`: FastAPI APIRouter with prefix `/accounts`, tags `["accounts"]`.

- `GET /` — `select(Account).where(Account.is_active == True).order_by(Account.created_at)` → list[AccountResponse]
- `POST /` — create Account from AccountCreate, add to db, return AccountResponse
- `GET /{id}` — get by UUID, 404 if not found or inactive
- `PUT /{id}` — update fields from AccountUpdate (exclude_unset), return updated
- `DELETE /{id}` — set is_active=False (soft delete), return {"ok": True}

- [ ] **Step 2: Create credit_cards router**

`routers/credit_cards.py`: Same pattern as accounts but for CreditCard model. Prefix `/credit-cards`, tags `["credit-cards"]`.

Same 5 CRUD endpoints. Soft delete via is_active.

- [ ] **Step 3: Create categories router**

`routers/categories.py`: Prefix `/categories`, tags `["categories"]`.

- `GET /` — list all categories ordered by sort_order
- `POST /` — create with is_default=False
- `PUT /{id}` — update
- `DELETE /{id}` — hard delete, but only if is_default=False. Return 400 if trying to delete default category.

- [ ] **Step 4: Create preferences router**

`routers/preferences.py`: Prefix `/preferences`, tags `["preferences"]`.

- `GET /` — list all preferences
- `PUT /` — accept list of PreferenceUpdate, upsert each (insert or update by key)

- [ ] **Step 5: Create main.py with FastAPI app**

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db
from app.routers import accounts, credit_cards, categories, preferences

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(title="FinTrack API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(accounts.router, prefix="/api/v1")
app.include_router(credit_cards.router, prefix="/api/v1")
app.include_router(categories.router, prefix="/api/v1")
app.include_router(preferences.router, prefix="/api/v1")
```

- [ ] **Step 6: Start server and verify Swagger docs**

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

Open http://localhost:8000/docs — verify all 4 routers appear with correct endpoints.

- [ ] **Step 7: Commit**

```bash
git add backend/
git commit -m "feat: add CRUD routers for accounts, credit cards, categories, preferences"
```

---

## Task 4: Transaction Service — Balance Logic

This is the critical financial logic. All balance changes happen in the service layer, not in the router.

**Files:**
- Create: `backend/app/services/__init__.py`
- Create: `backend/app/services/transaction_service.py`
- Create: `backend/app/routers/transactions.py`

- [ ] **Step 1: Create transaction_service.py**

Core functions (all async, take `db: AsyncSession`):

**`apply_balance_change(db, transaction)`** — applies the financial effect:
- `expense` + `source_type=account`: decrease `Account.balance` by `amount`
- `expense` + `source_type=credit_card`: increase `CreditCard.outstanding_balance` by `amount`
- `income` + `source_type=account`: increase `Account.balance` by `amount`
- `transfer`: decrease source `Account.balance`, increase destination `Account.balance`
- `card_payment`: decrease source `Account.balance`, decrease destination `CreditCard.outstanding_balance`

**`reverse_balance_change(db, transaction)`** — exact opposite of apply. Used before deleting or updating a transaction.

**`create_transaction(db, data: TransactionCreate) -> Transaction`**:
1. Validate source exists and is active
2. If transfer/card_payment, validate destination exists
3. Create Transaction row
4. Call `apply_balance_change`
5. Commit and return

**`update_transaction(db, id, data: TransactionUpdate) -> Transaction`**:
1. Get existing transaction
2. Call `reverse_balance_change` on old transaction
3. Update fields
4. Call `apply_balance_change` on updated transaction
5. Commit and return

**`delete_transaction(db, id)`**:
1. Get transaction
2. Call `reverse_balance_change`
3. Delete row
4. Commit

**`create_quick_transaction(db, data: QuickTransactionCreate) -> Transaction`**:
1. Build full TransactionCreate from QuickTransactionCreate (filling defaults: currency from settings, date from today if not set)
2. Delegate to `create_transaction`

- [ ] **Step 2: Create transactions router**

`routers/transactions.py`: Prefix `/transactions`, tags `["transactions"]`.

- `GET /` — list with query params: `category_id`, `source_type`, `source_id`, `type`, `date_from`, `date_to`, `search` (ILIKE on merchant+note), `sort` (newest/oldest/amount_high/amount_low), `skip` (default 0), `limit` (default 50). Return list[TransactionResponse].
- `POST /` — call `transaction_service.create_transaction`, return TransactionResponse
- `POST /quick` — call `transaction_service.create_quick_transaction`, return TransactionResponse
- `GET /{id}` — get by UUID, 404 if not found
- `PUT /{id}` — call `transaction_service.update_transaction`
- `DELETE /{id}` — call `transaction_service.delete_transaction`
- `GET /export` — same filters as GET /, but return StreamingResponse with CSV content-type. Columns: date, type, amount, currency, category, merchant, source, note, tags.

- [ ] **Step 3: Register router in main.py**

Add `from app.routers import transactions` and `app.include_router(transactions.router, prefix="/api/v1")`.

- [ ] **Step 4: Test transaction balance logic manually**

Start server. Via Swagger UI:
1. POST /api/v1/accounts — create "Checking" with balance 1000
2. POST /api/v1/transactions — expense of 50 from that account
3. GET /api/v1/accounts/{id} — verify balance is 950
4. DELETE /api/v1/transactions/{id} — delete the expense
5. GET /api/v1/accounts/{id} — verify balance is back to 1000

- [ ] **Step 5: Commit**

```bash
git add backend/
git commit -m "feat: transaction service with balance logic and transactions router"
```

---

## Task 5: Dashboard and Budget Services + Routers

**Files:**
- Create: `backend/app/services/dashboard_service.py`
- Create: `backend/app/services/budget_service.py`
- Create: `backend/app/routers/dashboard.py`
- Create: `backend/app/routers/budgets.py`

- [ ] **Step 1: Create dashboard_service.py**

**`get_summary(db)`** → dict:
- `total_cash`: sum of all active Account.balance
- `total_credit_used`: sum of all active CreditCard.outstanding_balance
- `total_credit_limit`: sum of all active CreditCard.credit_limit
- `net_worth`: total_cash - total_credit_used
- `monthly_income`: sum of income transactions in current month
- `monthly_expenses`: sum of expense transactions in current month
- `monthly_net`: monthly_income - monthly_expenses

**`get_spending_by_category(db, month, year)`** → list of {category_name, category_icon, category_color, amount, percentage}:
- Query expense transactions for given month/year, group by category_id
- Join with Category table for name/icon/color
- Calculate percentage of total

**`get_trends(db, months=6)`** → list of {month, year, label, income, expenses, net}:
- For each of last N months, sum income and expense transactions
- `label` is formatted like "Jan", "Feb", etc.

- [ ] **Step 2: Create budget_service.py**

**`get_budget_status(db, month, year)`** → list of BudgetStatus:
- Get all budgets for month/year
- For each budget, query sum of expense transactions matching that category (or all expenses for overall budget) in that month/year
- Calculate spent, remaining, percentage

- [ ] **Step 3: Create dashboard router**

`routers/dashboard.py`: Prefix `/dashboard`, tags `["dashboard"]`.
- `GET /summary` — call dashboard_service.get_summary
- `GET /spending-by-category?month=&year=` — defaults to current month/year
- `GET /trends?months=6`

- [ ] **Step 4: Create budgets router**

`routers/budgets.py`: Prefix `/budgets`, tags `["budgets"]`.
- `GET /` — list budgets with optional month/year filter
- `POST /` — create budget (upsert: if budget exists for same category+month+year, update amount)
- `GET /status?month=&year=` — call budget_service.get_budget_status
- `DELETE /{id}` — delete budget

- [ ] **Step 5: Register routers in main.py**

Add dashboard and budgets routers with `/api/v1` prefix.

- [ ] **Step 6: Commit**

```bash
git add backend/
git commit -m "feat: dashboard and budget services with routers"
```

---

## Task 6: Seed Data

**Files:**
- Create: `backend/app/seed.py`

- [ ] **Step 1: Create seed.py**

An async script that:
1. Clears all existing data (transactions first due to FK, then budgets, then accounts, cards, categories, preferences)
2. Creates 21 default categories (17 expense + 4 income) with appropriate Lucide icon names and colors from the curated palette:
   - Expense: Housing (home, #EF4444), Groceries (shopping-cart, #F97316), Dining (utensils, #F59E0B), Transport (bus, #84CC16), Fuel (fuel, #22C55E), Utilities (zap, #14B8A6), Internet (wifi, #06B6D4), Phone (smartphone, #3B82F6), Insurance (shield, #6366F1), Healthcare (heart-pulse, #8B5CF6), Shopping (shopping-bag, #A855F7), Subscriptions (repeat, #D946EF), Entertainment (film, #EC4899), Education (graduation-cap, #F43F5E), Travel (plane, #0EA5E9), Transfer (arrow-left-right, #64748B), Credit Card Payment (credit-card, #475569)
   - Income: Salary (briefcase, #10B981), Freelance (laptop, #06B6D4), Investment (trending-up, #8B5CF6), Other Income (plus-circle, #64748B)
3. Creates 3 accounts: Checking ($4250, checking, landmark icon, #3B82F6), Savings ($12800, savings, piggy-bank, #10B981), Cash Wallet ($180, cash, wallet, #F59E0B)
4. Creates 2 credit cards: TD Visa Infinite (limit $10000, outstanding $2340.50, due day 15, credit-card, #8B5CF6), CIBC Mastercard (limit $5000, outstanding $890.25, statement day 22, credit-card, #EC4899)
5. Creates ~45 realistic transactions spanning Jan-Mar 2026:
   - Rent: $1800/month from Checking (Housing) — Jan, Feb, Mar
   - Salary: $3500 twice/month to Checking (Salary) — 1st and 15th
   - Groceries: 8-10 varied amounts ($40-$120) from Checking and TD Visa
   - Dining: 5-6 entries ($15-$65) from TD Visa and CIBC
   - Subscriptions: Netflix $16.49, Spotify $11.99, iCloud $3.99 from TD Visa
   - Utilities: Hydro $85, Gas $65 from Checking
   - Internet: $75/month from Checking
   - Transport: 3-4 entries ($3-$25) from CIBC
   - Shopping: 2-3 entries ($30-$150) from TD Visa
   - Entertainment: 2 entries ($20-$50) from CIBC
   - One transfer: $500 from Checking to Savings
   - One credit card payment: $1500 from Checking to TD Visa
   - Gas/Fuel: 2 entries ($55-$70) from Checking
6. Creates budgets for March 2026: Overall $4000, Groceries $600, Dining $300, Transport $200, Entertainment $150, Shopping $250
7. Creates default preferences: currency=CAD, theme=system

**Important:** Do NOT use the transaction_service for seeding — set balances directly. The seed balances already account for all transactions (they represent the "current" state).

- [ ] **Step 2: Add seed command to main.py**

Add a `/api/v1/seed` POST endpoint (for dev only) that runs the seed script. Also make seed runnable as `python -m app.seed`.

- [ ] **Step 3: Run seed and verify**

```bash
python -m app.seed
uvicorn app.main:app --port 8000
```

Check GET /api/v1/accounts — should return 3 accounts.
Check GET /api/v1/credit-cards — should return 2 cards.
Check GET /api/v1/transactions — should return ~45 transactions.
Check GET /api/v1/dashboard/summary — should show meaningful numbers.

- [ ] **Step 4: Commit**

```bash
git add backend/
git commit -m "feat: seed data with realistic accounts, cards, categories, and transactions"
```

---

## Task 7: Frontend Foundation — Next.js Setup, Design System, Layout

**Files:**
- Create: `frontend/` (via create-next-app)
- Create: `frontend/src/lib/api.ts`
- Create: `frontend/src/lib/utils.ts`
- Create: `frontend/src/lib/constants.ts`
- Create: `frontend/src/types/index.ts`
- Create: `frontend/src/stores/ui-store.ts`
- Create: `frontend/src/components/ui/card.tsx`
- Create: `frontend/src/components/ui/button.tsx`
- Create: `frontend/src/components/ui/badge.tsx`
- Create: `frontend/src/components/ui/progress-bar.tsx`
- Create: `frontend/src/components/ui/bottom-sheet.tsx`
- Create: `frontend/src/components/ui/empty-state.tsx`
- Create: `frontend/src/components/layout/bottom-nav.tsx`
- Create: `frontend/src/components/layout/sidebar.tsx`
- Create: `frontend/src/components/layout/app-shell.tsx`
- Create: `frontend/src/components/layout/fab.tsx`
- Modify: `frontend/src/app/layout.tsx`
- Modify: `frontend/tailwind.config.ts`

- [ ] **Step 1: Scaffold Next.js app**

```bash
cd "/Users/haritharaj/Claude Code/fintrack"
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir --no-import-alias
```

- [ ] **Step 2: Install frontend dependencies**

```bash
cd frontend
npm install framer-motion recharts @tanstack/react-query zustand lucide-react clsx date-fns
```

- [ ] **Step 3: Configure Tailwind with custom design tokens**

Update `tailwind.config.ts` with:
- Extended colors: `accent` (teal-emerald #0D9488 scale), `income` (emerald), `expense` (rose), `warning` (amber)
- Font family: Inter + system fallback
- Extend borderRadius, boxShadow for premium feel
- Dark mode: `class` strategy

- [ ] **Step 4: Create TypeScript types**

`types/index.ts`: Define all interfaces matching backend response schemas:
- `Account`, `CreditCard`, `Category`, `Transaction`, `Budget`, `BudgetStatus`, `DashboardSummary`, `SpendingByCategory`, `TrendData`, `UserPreference`
- Enums: `AccountType`, `TransactionType`, `SourceType`, `CategoryType`

- [ ] **Step 5: Create API client**

`lib/api.ts`: Typed fetch wrapper.
- `API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'`
- Generic `async function api<T>(path, options?)` that handles JSON, errors, and returns typed data
- Export named functions: `getAccounts()`, `createAccount(data)`, `getTransactions(params)`, `createTransaction(data)`, `createQuickTransaction(data)`, `getDashboardSummary()`, `getSpendingByCategory(month, year)`, `getTrends(months)`, `getBudgetStatus(month, year)`, etc.

- [ ] **Step 6: Create utility helpers**

`lib/utils.ts`:
- `formatCurrency(amount: number, currency = 'CAD')` — Intl.NumberFormat with locale-aware formatting
- `formatDate(date: string)` — "Mar 26, 2026" format
- `formatDateShort(date: string)` — "Mar 26" format
- `cn(...classes)` — clsx utility for conditional classes
- `getRelativeDate(date: string)` — "Today", "Yesterday", or formatted date

`lib/constants.ts`:
- `CATEGORY_ICONS` — map of category name to Lucide icon component
- `CATEGORY_COLORS` — 17-color palette array
- `ACCOUNT_TYPE_LABELS` — display names for account types

- [ ] **Step 7: Create Zustand UI store**

`stores/ui-store.ts`:
```typescript
import { create } from 'zustand'

interface UIStore {
  quickAddOpen: boolean
  openQuickAdd: () => void
  closeQuickAdd: () => void
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void
}

export const useUIStore = create<UIStore>((set) => ({
  quickAddOpen: false,
  openQuickAdd: () => set({ quickAddOpen: true }),
  closeQuickAdd: () => set({ quickAddOpen: false }),
  theme: 'system',
  setTheme: (theme) => set({ theme }),
}))
```

- [ ] **Step 8: Create UI design system components**

**`components/ui/card.tsx`**: Reusable card with `rounded-2xl bg-white dark:bg-slate-800 shadow-sm` base. Props: `className`, `children`, optional `glass` variant with `backdrop-blur`.

**`components/ui/button.tsx`**: Primary (rounded-full, accent bg, scale-on-press via Framer Motion `whileTap={{ scale: 0.97 }}`), secondary (rounded-xl, outlined), and ghost variants. Props: `variant`, `size`, `className`, `children`, standard button props.

**`components/ui/badge.tsx`**: Rounded-full pill with colored background at 15% opacity and colored text. Props: `color`, `children`.

**`components/ui/progress-bar.tsx`**: Animated progress bar with Framer Motion `animate={{ width }}`. Props: `value` (0-100), `color` (green/yellow/red auto-calculated from percentage), `label`, `sublabel`. Rounded-full, h-2.5 track.

**`components/ui/bottom-sheet.tsx`**: Framer Motion `AnimatePresence` + `motion.div`. Slides up from bottom with spring animation. Overlay backdrop. Drag-to-dismiss (drag constraint, onDragEnd check velocity/offset). Half-screen snap point (`max-h-[55vh]`). Props: `isOpen`, `onClose`, `children`, `title`.

**`components/ui/empty-state.tsx`**: Centered layout with SVG illustration placeholder, heading, description, optional CTA button. Props: `icon` (Lucide component), `title`, `description`, `action`, `onAction`.

- [ ] **Step 9: Create layout components**

**`components/layout/fab.tsx`**: Floating action button. Fixed position, centered at bottom above nav bar. Teal-emerald gradient background, Plus icon, rounded-full, shadow-lg. `whileHover={{ scale: 1.05 }}`, `whileTap={{ scale: 0.95 }}`. Calls `useUIStore.openQuickAdd` on click.

**`components/layout/bottom-nav.tsx`**: Fixed bottom bar (mobile only, hidden lg+). 5 items: Dashboard (LayoutDashboard), Transactions (ArrowLeftRight), center spacer for FAB, Budgets (PieChart), More (Menu). Active item gets accent color + filled variant. Uses Next.js `usePathname` for active state.

**`components/layout/sidebar.tsx`**: Desktop sidebar (hidden below lg). Same nav items plus Accounts, Credit Cards, Settings in expanded form. Logo/app name at top. Active item accent background.

**`components/layout/app-shell.tsx`**: Wraps all pages. Contains Sidebar (desktop), BottomNav (mobile), FAB, and QuickAdd bottom sheet. Provides consistent padding and max-width. Wraps children in TanStack QueryClientProvider.

- [ ] **Step 10: Update root layout.tsx**

```typescript
import { Inter } from 'next/font/google'
import './globals.css'
import { AppShell } from '@/components/layout/app-shell'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
```

- [ ] **Step 11: Add .env.local for frontend**

```
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

- [ ] **Step 12: Verify frontend starts and layout renders**

```bash
cd frontend
npm run dev
```

Open http://localhost:3000 — should see app shell with bottom nav (mobile) or sidebar (desktop), FAB button, and empty content area.

- [ ] **Step 13: Commit**

```bash
git add frontend/ .gitignore
git commit -m "feat: frontend foundation — Next.js setup, design system, layout shell"
```

---

## Task 8: Dashboard Screen

**Files:**
- Create: `frontend/src/hooks/useDashboard.ts`
- Create: `frontend/src/hooks/useAccounts.ts`
- Create: `frontend/src/components/dashboard/summary-cards.tsx`
- Create: `frontend/src/components/dashboard/accounts-strip.tsx`
- Create: `frontend/src/components/dashboard/credit-cards-strip.tsx`
- Create: `frontend/src/components/dashboard/monthly-overview.tsx`
- Create: `frontend/src/components/dashboard/spending-chart.tsx`
- Create: `frontend/src/components/dashboard/trend-chart.tsx`
- Create: `frontend/src/components/dashboard/recent-transactions.tsx`
- Create: `frontend/src/components/dashboard/budget-health.tsx`
- Modify: `frontend/src/app/page.tsx`

- [ ] **Step 1: Create TanStack Query hooks**

`hooks/useDashboard.ts`:
- `useDashboardSummary()` — useQuery for GET /dashboard/summary
- `useSpendingByCategory(month, year)` — useQuery for spending breakdown
- `useTrends(months)` — useQuery for trend data

`hooks/useAccounts.ts`:
- `useAccounts()` — useQuery for GET /accounts
- `useCreditCards()` — useQuery for GET /credit-cards
- `useBudgetStatus(month, year)` — useQuery for GET /budgets/status

- [ ] **Step 2: Build dashboard components**

**`summary-cards.tsx`**: Row of 3 cards (grid on desktop, horizontal scroll on mobile):
1. Net Worth — large formatted amount, subtitle "Total assets minus credit"
2. Monthly Spending — amount in expense color, vs last month comparison chip
3. Monthly Income — amount in income color

Each card: Framer Motion `initial={{ opacity: 0, y: 20 }}` `animate={{ opacity: 1, y: 0 }}` with staggered delay.

**`accounts-strip.tsx`**: Horizontal scroll of account mini-cards. Each shows: icon (colored circle), name, balance. Tappable → navigates to /accounts.

**`credit-cards-strip.tsx`**: Horizontal scroll of card mini-cards. Each shows: icon, name, utilization bar (outstanding/limit), outstanding amount. Tappable → navigates to /credit-cards.

**`monthly-overview.tsx`**: Card with 3 metrics in a row: Income (green, arrow-up icon), Expenses (red, arrow-down icon), Net (colored based on positive/negative). Clean grid layout.

**`spending-chart.tsx`**: Recharts PieChart (donut). Animated, custom colors from category palette. Center label shows total. Legend below with category name + amount + percentage. Responsive radius.

**`trend-chart.tsx`**: Recharts AreaChart. Two areas: income (green gradient fill) and expenses (red gradient fill). Smooth curve. Custom tooltip. X-axis: month labels. Responsive.

**`recent-transactions.tsx`**: List of last 8 transactions. Each row: category color dot, category icon, merchant or category name, date (relative), amount (red for expense, green for income), source badge. "View all" link to /transactions.

**`budget-health.tsx`**: Top 3 budget categories with ProgressBar component. Shows category name, spent/budget, percentage. Color-coded: green (<75%), yellow (75-100%), red (>100%). "View all" link to /budgets.

- [ ] **Step 3: Compose dashboard page**

`app/page.tsx`:
```typescript
'use client'
import { SummaryCards } from '@/components/dashboard/summary-cards'
import { AccountsStrip } from '@/components/dashboard/accounts-strip'
import { CreditCardsStrip } from '@/components/dashboard/credit-cards-strip'
import { MonthlyOverview } from '@/components/dashboard/monthly-overview'
import { SpendingChart } from '@/components/dashboard/spending-chart'
import { TrendChart } from '@/components/dashboard/trend-chart'
import { RecentTransactions } from '@/components/dashboard/recent-transactions'
import { BudgetHealth } from '@/components/dashboard/budget-health'

export default function DashboardPage() {
  return (
    <div className="space-y-6 pb-24">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <SummaryCards />
      <AccountsStrip />
      <CreditCardsStrip />
      <MonthlyOverview />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SpendingChart />
        <TrendChart />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentTransactions />
        <BudgetHealth />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Verify dashboard renders with seed data**

Start both backend (port 8000) and frontend (port 3000). Dashboard should show all cards with real data from seed.

- [ ] **Step 5: Commit**

```bash
git add frontend/
git commit -m "feat: dashboard screen with summary, charts, recent transactions, budget health"
```

---

## Task 9: Transactions List Screen

**Files:**
- Create: `frontend/src/hooks/useTransactions.ts`
- Create: `frontend/src/components/transactions/transaction-list.tsx`
- Create: `frontend/src/components/transactions/transaction-row.tsx`
- Create: `frontend/src/components/transactions/transaction-filters.tsx`
- Create: `frontend/src/components/transactions/search-bar.tsx`
- Create: `frontend/src/app/transactions/page.tsx`

- [ ] **Step 1: Create useTransactions hook**

`hooks/useTransactions.ts`:
- `useTransactions(params)` — useInfiniteQuery for GET /transactions with pagination. Params: category_id, source_type, source_id, type, date_from, date_to, search, sort.
- `useCreateTransaction()` — useMutation for POST /transactions, invalidates queries on success
- `useDeleteTransaction()` — useMutation for DELETE, invalidates queries

- [ ] **Step 2: Build transaction components**

**`search-bar.tsx`**: Input with Search icon, debounced (300ms) onChange. Rounded-xl, clean styling.

**`transaction-filters.tsx`**: Horizontal scroll of filter chips. Filters: Type (All/Expense/Income/Transfer), Date range (This month/Last month/Custom), Category (dropdown), Account/Card (dropdown). Active filter gets accent fill. Reset button when any filter active.

**`transaction-row.tsx`**: Single transaction display.
- Left: Colored circle with category icon
- Middle: Merchant or category name (bold), date below (muted)
- Right: Amount (red with - for expense, green with + for income), source badge below (account/card name)
- Framer Motion `layout` prop for smooth list animations
- On click: navigate to /transactions/[id]/edit (or open edit modal)

**`transaction-list.tsx`**: Renders search bar, filters, and infinite scroll list. Groups transactions by date (Today, Yesterday, This Week, Earlier). Uses IntersectionObserver for infinite scroll trigger. Shows empty state when no results.

- [ ] **Step 3: Create transactions page**

`app/transactions/page.tsx`: Renders TransactionList component with page title.

- [ ] **Step 4: Verify**

Navigate to /transactions — should show seed data transactions with search and filters working.

- [ ] **Step 5: Commit**

```bash
git add frontend/
git commit -m "feat: transactions list with search, filters, infinite scroll"
```

---

## Task 10: Quick-Add Bottom Sheet (Hero Feature)

**Files:**
- Create: `frontend/src/components/transactions/quick-add-sheet.tsx`
- Create: `frontend/src/components/transactions/category-chips.tsx`
- Create: `frontend/src/components/transactions/source-chips.tsx`
- Create: `frontend/src/components/transactions/category-grid-modal.tsx`
- Modify: `frontend/src/components/layout/app-shell.tsx` (add QuickAddSheet)

- [ ] **Step 1: Create category-chips.tsx**

Horizontal scrollable row of category chips. Each chip: colored icon + name. Most-used categories first (fetch from transactions API or hardcode top 8). "More" chip at end opens full CategoryGridModal. Selected chip gets accent ring. Props: `selectedId`, `onSelect`, `type` (expense/income to filter categories).

- [ ] **Step 2: Create source-chips.tsx**

Horizontal scroll of account and credit card chips. Each chip shows icon + name + truncated balance. Accounts first, then cards (separated by subtle divider). Last-used pre-selected (stored in localStorage). Props: `selectedSourceType`, `selectedSourceId`, `onSelect`.

- [ ] **Step 3: Create category-grid-modal.tsx**

Full-screen modal with 4-column grid of all categories. Each cell: colored circle icon + name below. Tap to select and close. Separate sections for expense and income categories.

- [ ] **Step 4: Create quick-add-sheet.tsx**

The hero component. Uses BottomSheet UI component.

Layout (all visible in half-screen, ~55vh):
```
┌─────────────────────────────┐
│  ─── drag handle ───        │
│                             │
│  [Expense] [Income]  toggle │
│                             │
│  🏠 🛒 🍽️ 🚗 ⛽ 🔌 ›  chips │
│                             │
│  $ [____amount____]   input │
│                             │
│  💳 Checking │ TD Visa │ ›  │
│                             │
│  Merchant    │  📅 Today    │
│                             │
│  + Add note                 │
│                             │
│  [══════ Save ══════]  btn  │
└─────────────────────────────┘
```

Implementation:
- Controlled by `useUIStore.quickAddOpen` / `closeQuickAdd`
- **Type toggle**: Two pills, "Expense" (default, red tint) and "Income" (green tint). Animated indicator slides between them.
- **Category chips**: CategoryChips component filtered by selected type
- **Amount**: Large input, auto-focused when sheet opens, `text-3xl font-bold tabular-nums`, CAD$ prefix. `inputMode="decimal"` for mobile numpad.
- **Source chips**: SourceChips component
- **Merchant + Date row**: Two inputs side by side. Merchant is text input, date is date input defaulting to today.
- **Note**: Collapsed by default. "Add note" text button expands a text input with Framer Motion height animation.
- **Save button**: Full-width, accent gradient, rounded-xl, `whileTap={{ scale: 0.97 }}`. Calls `createQuickTransaction` mutation. On success: haptic-style flash animation, toast notification, close sheet, invalidate queries.
- **Validation**: Amount required and > 0, category required, source required. Save button disabled until valid.

- [ ] **Step 5: Wire QuickAddSheet into AppShell**

Import and render `<QuickAddSheet />` inside AppShell, after the main content area. It reads isOpen from the store and renders conditionally with AnimatePresence.

- [ ] **Step 6: Verify quick-add flow**

1. Click FAB → sheet opens with spring animation
2. Select category chip
3. Type amount
4. Source pre-selected to last used
5. Tap Save → transaction created, sheet closes, dashboard updates

- [ ] **Step 7: Commit**

```bash
git add frontend/
git commit -m "feat: quick-add bottom sheet — the hero feature"
```

---

## Task 11: Full Add/Edit Transaction Page

**Files:**
- Create: `frontend/src/app/transactions/new/page.tsx`
- Create: `frontend/src/app/transactions/[id]/edit/page.tsx`
- Create: `frontend/src/components/transactions/transaction-form.tsx`

- [ ] **Step 1: Create transaction-form.tsx**

Full form component used by both new and edit pages. Props: `initialData?` (Transaction for edit mode), `onSubmit`, `onCancel`.

Fields:
- **Type selector**: 4 segmented buttons (Expense, Income, Transfer, Card Payment). Selecting Transfer/Card Payment shows destination fields.
- **Amount**: Large input with currency prefix
- **Category**: Tap to open CategoryGridModal. Shows selected category chip. Hidden for Transfer/Card Payment types.
- **Source**: Dropdown/select showing all accounts + credit cards (grouped). Label changes based on type: "From" for expense/transfer, "To" for income.
- **Destination**: Only shown for transfer/card_payment. For transfer: accounts only. For card_payment: credit cards only.
- **Merchant**: Text input
- **Date**: Date picker input
- **Note**: Textarea
- **Tags**: Chip-style tag input. Type and press Enter/comma to add. X to remove.
- **Recurring**: Toggle switch. When on, shows frequency selector (weekly/monthly/yearly).
- **Save/Cancel buttons**: Fixed at bottom on mobile.

All fields have clean Tailwind styling: minimal borders, good spacing, large touch targets (min-h-[44px]).

- [ ] **Step 2: Create new transaction page**

`app/transactions/new/page.tsx`: Renders TransactionForm. On submit, calls createTransaction mutation. On success, navigate to /transactions.

- [ ] **Step 3: Create edit transaction page**

`app/transactions/[id]/edit/page.tsx`: Fetches transaction by ID, renders TransactionForm with initialData. On submit, calls updateTransaction mutation. Delete button in top-right with confirmation dialog.

- [ ] **Step 4: Commit**

```bash
git add frontend/
git commit -m "feat: full add/edit transaction page with all fields"
```

---

## Task 12: Accounts and Credit Cards Pages

**Files:**
- Create: `frontend/src/app/accounts/page.tsx`
- Create: `frontend/src/components/accounts/account-card.tsx`
- Create: `frontend/src/components/accounts/account-form-modal.tsx`
- Create: `frontend/src/app/credit-cards/page.tsx`
- Create: `frontend/src/components/credit-cards/credit-card-card.tsx`
- Create: `frontend/src/components/credit-cards/credit-card-form-modal.tsx`
- Create: `frontend/src/components/credit-cards/pay-bill-modal.tsx`

- [ ] **Step 1: Build account components**

**`account-card.tsx`**: Card displaying account info.
- Colored left border matching account color
- Icon in colored circle, name, type badge
- Large balance amount
- Subtle "last updated" text
- Tap navigates to transactions filtered by this account
- Edit/delete actions (dropdown menu or swipe)

**`account-form-modal.tsx`**: Modal form for creating/editing account. Fields: name, type (dropdown), balance, currency, icon picker (small grid of common icons), color picker (palette of 8 colors). Used for both add and edit.

- [ ] **Step 2: Build accounts page**

`app/accounts/page.tsx`:
- Title "Accounts"
- Total balance card at top (sum of all account balances)
- List of AccountCard components
- "Add Account" button (opens form modal)
- Empty state if no accounts

- [ ] **Step 3: Build credit card components**

**`credit-card-card.tsx`**: Premium card-like design.
- Gradient background using card color
- Card name (white text, bold), issuer badge
- Utilization bar: outstanding / limit, visually showing used vs available
- Three metrics row: Outstanding, Available, Limit
- Due date or statement date if set
- "Pay Bill" button
- Tap navigates to transactions filtered by this card

**`credit-card-form-modal.tsx`**: Modal for creating/editing card. Fields: name, issuer, network, credit_limit, outstanding_balance, statement_day, due_day, icon, color.

**`pay-bill-modal.tsx`**: Quick payment modal.
- Shows card name and outstanding balance
- Amount input (defaults to full outstanding)
- Source account dropdown (only bank accounts, not other cards)
- "Pay" button → creates card_payment transaction → updates both balances
- Success animation

- [ ] **Step 4: Build credit cards page**

`app/credit-cards/page.tsx`:
- Title "Credit Cards"
- Total credit summary card (total used / total limit)
- List of CreditCardCard components
- "Add Card" button
- Empty state

- [ ] **Step 5: Commit**

```bash
git add frontend/
git commit -m "feat: accounts and credit cards pages with add/edit/pay-bill flows"
```

---

## Task 13: Budgets Page

**Files:**
- Create: `frontend/src/app/budgets/page.tsx`
- Create: `frontend/src/hooks/useBudgets.ts`
- Create: `frontend/src/components/budgets/budget-overview.tsx`
- Create: `frontend/src/components/budgets/budget-category-row.tsx`
- Create: `frontend/src/components/budgets/budget-form-modal.tsx`
- Create: `frontend/src/components/budgets/month-selector.tsx`

- [ ] **Step 1: Create useBudgets hook**

`hooks/useBudgets.ts`:
- `useBudgets(month, year)` — useQuery for GET /budgets?month=&year=
- `useBudgetStatus(month, year)` — useQuery for GET /budgets/status
- `useCreateBudget()` — useMutation
- `useDeleteBudget()` — useMutation

- [ ] **Step 2: Build budget components**

**`month-selector.tsx`**: Horizontal month/year navigator. Left arrow, "March 2026" label, right arrow. Tap arrows to change month. Animated text transition.

**`budget-overview.tsx`**: Overall budget card. Large circular progress indicator (SVG circle with animated stroke-dasharray). Center shows spent/total. Color changes with status. Below: income vs expenses bar comparison.

**`budget-category-row.tsx`**: Single category budget row.
- Category icon + name on left
- ProgressBar component showing usage
- Spent / Budget amounts
- Remaining or "Over by $X" in appropriate color
- Tap to edit budget amount

**`budget-form-modal.tsx`**: Modal for setting budget. Fields: category (dropdown, optional for overall), amount, month/year (pre-filled from current selector). Existing budget for same category+month+year gets updated.

- [ ] **Step 3: Build budgets page**

`app/budgets/page.tsx`:
- MonthSelector at top
- BudgetOverview card
- "Category Budgets" section header with "Add Budget" button
- List of BudgetCategoryRow components
- Empty state for categories without budgets: "Set a budget for [category]" CTA

- [ ] **Step 4: Commit**

```bash
git add frontend/
git commit -m "feat: budgets page with month selector, progress tracking, and budget management"
```

---

## Task 14: Quick-Add Route (Shortcut Integration)

**Files:**
- Create: `frontend/src/app/quick-add/page.tsx`
- Create: `frontend/src/components/transactions/quick-add-standalone.tsx`

- [ ] **Step 1: Create quick-add standalone component**

`quick-add-standalone.tsx`: Similar to QuickAddSheet but rendered as a full page, not a bottom sheet. Centered card layout.

- Reads query params: `amount`, `category` (name or ID), `source` (name or ID), `type` (expense/income)
- Pre-fills any provided values
- Shows remaining fields for user to complete
- After save: success screen with animated checkmark, "Add Another" button (resets form), "Go to Dashboard" button
- Clean, focused UI — no navigation chrome, just the form

- [ ] **Step 2: Create quick-add page**

`app/quick-add/page.tsx`:
```typescript
import { Suspense } from 'react'
import { QuickAddStandalone } from '@/components/transactions/quick-add-standalone'

export default function QuickAddPage() {
  return (
    <Suspense>
      <QuickAddStandalone />
    </Suspense>
  )
}
```

The page uses `useSearchParams` inside QuickAddStandalone (hence Suspense boundary).

- [ ] **Step 3: Verify shortcut flow**

Open `http://localhost:3000/quick-add?amount=50&category=Groceries&type=expense` — amount and category should be pre-filled.

- [ ] **Step 4: Commit**

```bash
git add frontend/
git commit -m "feat: quick-add standalone route for shortcut integration"
```

---

## Task 15: Settings Page

**Files:**
- Create: `frontend/src/app/settings/page.tsx`
- Create: `frontend/src/components/settings/theme-toggle.tsx`
- Create: `frontend/src/components/settings/category-manager.tsx`
- Create: `frontend/src/components/settings/export-button.tsx`

- [ ] **Step 1: Build settings components**

**`theme-toggle.tsx`**: Three-option segmented control: Light (Sun icon), Dark (Moon icon), System (Monitor icon). Reads/writes from UIStore. Applies theme by toggling `dark` class on `<html>` element. Persists to preferences API.

**`category-manager.tsx`**: List of all categories grouped by type (expense/income). Each row: drag handle (for future reorder), colored icon, name, edit button, delete button (only for non-default). Add category button opens inline form: name, icon picker, color picker, type selector.

**`export-button.tsx`**: Button that triggers GET /transactions/export as file download. Shows date range picker before export.

- [ ] **Step 2: Build settings page**

`app/settings/page.tsx`:
- Title "Settings"
- **Appearance** section: ThemeToggle
- **Categories** section: CategoryManager
- **Data** section: ExportButton
- **About** section: App name "FinTrack", version "1.0.0", brief description

Clean card-based sections with dividers.

- [ ] **Step 3: Commit**

```bash
git add frontend/
git commit -m "feat: settings page with theme toggle, category management, export"
```

---

## Task 16: UI Polish — Animations, Dark Mode, Responsiveness, Empty States

**Files:**
- Modify: Multiple frontend component files
- Create: `frontend/src/components/ui/toast.tsx`
- Create: `frontend/src/components/ui/animated-number.tsx`
- Create: `frontend/src/components/ui/loading-skeleton.tsx`

- [ ] **Step 1: Create utility UI components**

**`toast.tsx`**: Lightweight toast notification. Slides in from top, auto-dismisses after 3s. Success (green), error (red), info (blue) variants. Animated with Framer Motion. Global toast state via Zustand (add `toasts` array and `addToast`/`removeToast` to UIStore).

**`animated-number.tsx`**: Animates number counting up/down when value changes. Uses Framer Motion `useSpring` and `useTransform`. Props: `value`, `format` (currency/number/percentage). Used for dashboard totals.

**`loading-skeleton.tsx`**: Pulse-animated placeholder matching card/row shapes. Used during data loading. Variants: `card`, `row`, `chart`.

- [ ] **Step 2: Add loading states to all pages**

Add Suspense boundaries and skeleton loading to:
- Dashboard: skeleton cards while summary loads
- Transactions: skeleton rows while list loads
- Accounts/Cards: skeleton cards
- Budgets: skeleton progress bars

- [ ] **Step 3: Add empty states to all list pages**

- Transactions: "No transactions yet — tap + to add your first expense" with ArrowUpCircle icon
- Accounts: "Add your first account to start tracking" with Wallet icon
- Credit Cards: "Add a credit card to track spending" with CreditCard icon
- Budgets: "Set up budgets to control your spending" with PieChart icon

- [ ] **Step 4: Polish dark mode**

Review every component for dark mode coverage:
- All backgrounds: `dark:bg-slate-800`, `dark:bg-slate-900`, `dark:bg-slate-950`
- All text: `dark:text-slate-100`, `dark:text-slate-400`
- All borders: `dark:border-slate-700`
- Charts: dark-friendly colors
- Bottom sheet overlay: dark-appropriate opacity
- Input fields: dark backgrounds and text

- [ ] **Step 5: Polish responsive behavior**

- Dashboard: stack cards on mobile, grid on desktop
- Bottom nav: show on mobile (<1024px), hide on desktop
- Sidebar: hide on mobile, show on desktop
- Transaction rows: compact on mobile, expanded on desktop
- Charts: responsive sizing, touch-friendly tooltips
- Forms: full-width on mobile, constrained on desktop
- Bottom sheet: full-width mobile, max-w-md centered on desktop

- [ ] **Step 6: Add micro-interactions**

- Button press: `whileTap={{ scale: 0.97 }}` on all interactive elements
- Card hover: `whileHover={{ y: -2 }}` on desktop
- List items: `layout` prop for smooth reflow on add/remove
- Page transitions: fade-in on route change
- Success actions: brief scale-up pulse animation
- FAB: gentle bounce animation on idle (subtle `animate={{ y: [0, -4, 0] }}` loop)

- [ ] **Step 7: Commit**

```bash
git add frontend/
git commit -m "feat: UI polish — loading states, empty states, dark mode, animations, responsiveness"
```

---

## Task 17: Integration Testing and Bug Fixes

- [ ] **Step 1: Full flow test — expense from account**

1. Note Checking account balance on dashboard
2. Open quick-add → select Groceries → enter $50 → select Checking → Save
3. Verify: Checking balance decreased by $50 on dashboard
4. Verify: Transaction appears in recent transactions
5. Verify: Transaction appears in transactions list

- [ ] **Step 2: Full flow test — expense from credit card**

1. Note TD Visa outstanding on dashboard
2. Quick-add → Dining → $30 → TD Visa → Save
3. Verify: TD Visa outstanding increased by $30
4. Verify: No account balance changed

- [ ] **Step 3: Full flow test — credit card payment**

1. Go to Credit Cards page
2. Click "Pay Bill" on TD Visa
3. Enter $500, select Checking as source
4. Verify: Checking decreased by $500
5. Verify: TD Visa outstanding decreased by $500

- [ ] **Step 4: Full flow test — transfer**

1. New transaction → type Transfer → $200 → from Checking → to Savings
2. Verify: Checking decreased by $200, Savings increased by $200

- [ ] **Step 5: Full flow test — edit and delete**

1. Edit a transaction amount from $50 to $75
2. Verify balances updated correctly (old reversed, new applied)
3. Delete a transaction
4. Verify balance reversed

- [ ] **Step 6: Full flow test — budgets**

1. Go to Budgets page
2. Verify March 2026 budgets show correct spent amounts from transactions
3. Add a new budget for a category
4. Verify it appears with correct progress

- [ ] **Step 7: Full flow test — quick-add route**

1. Open /quick-add?amount=25&category=Transport&type=expense
2. Verify amount and category pre-filled
3. Select source and save
4. Verify success screen and transaction created

- [ ] **Step 8: Fix any bugs found and commit**

```bash
git add -A
git commit -m "fix: integration test bug fixes"
```

---

## Task 18: Final Setup — .gitignore, README, Push

**Files:**
- Create: `.gitignore`
- Create: `README.md`

- [ ] **Step 1: Create root .gitignore**

```
# Python
__pycache__/
*.py[cod]
*.egg-info/
venv/
.env
*.db

# Node
node_modules/
.next/
out/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Build
dist/
build/
```

- [ ] **Step 2: Create README.md**

Include:
- App name and description
- Screenshots placeholder
- Tech stack table
- Prerequisites (Python 3.11+, Node 18+)
- Setup instructions:
  ```
  # Backend
  cd backend
  python -m venv venv
  source venv/bin/activate
  pip install -r requirements.txt
  cp .env.example .env
  python -m app.seed  # Load demo data
  uvicorn app.main:app --reload --port 8000

  # Frontend
  cd frontend
  npm install
  cp .env.example .env.local
  npm run dev
  ```
- Environment variables table
- Account vs Credit Card explanation
- Shortcut integration guide
- Hosting guidance (Vercel for frontend, Railway/Render for backend, PostgreSQL swap)
- Known limitations
- Next improvements

- [ ] **Step 3: Final commit and push**

```bash
cd "/Users/haritharaj/Claude Code/fintrack"
git add -A
git commit -m "feat: finalize project — README, gitignore, cleanup"
git push origin main
```

---

## Verification Checklist

After all tasks are complete, verify:

- [ ] Backend starts without errors: `uvicorn app.main:app --port 8000`
- [ ] Seed data loads: `python -m app.seed`
- [ ] Swagger docs accessible: http://localhost:8000/docs
- [ ] Frontend starts: `npm run dev` in frontend/
- [ ] Dashboard renders with real data
- [ ] Quick-add sheet opens, creates transactions, updates balances
- [ ] Transaction list shows search, filters, pagination
- [ ] Accounts page shows balances, add/edit works
- [ ] Credit cards page shows utilization, pay bill works
- [ ] Budgets page shows progress bars with correct percentages
- [ ] Quick-add route pre-fills from query params
- [ ] Settings theme toggle works (light/dark/system)
- [ ] Dark mode covers all screens
- [ ] Mobile layout responsive (bottom nav, full-width cards)
- [ ] Desktop layout responsive (sidebar, grid layouts)
- [ ] All financial logic correct per Transaction Behavior Rules in spec
