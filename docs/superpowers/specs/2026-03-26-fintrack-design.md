# FinTrack - Personal Finance & Expense Tracker

## Overview

A premium personal expense tracker and lightweight budgeting app with ultra-fast expense capture, proper account/credit card separation, dashboards, analytics, and a polished mobile-first UI. Inspired by the speed and simplicity of apps like Monefy but with an original, modern, premium fintech design.

**Target:** Single-user personal finance app. Auth-ready schema for future multi-user support.
**Default currency:** CAD ($)
**Location:** `~/Claude Code/fintrack`

---

## Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Backend | FastAPI (Python 3.11+) | Async, auto OpenAPI docs, excellent DX |
| ORM | SQLAlchemy 2.0 + Alembic | Async support, clean migrations, mature |
| Database | SQLite (dev) / PostgreSQL (prod) | Zero-setup locally, swap via DATABASE_URL |
| Frontend | Next.js 14 (App Router) + TypeScript | SSR, file-based routing, React Server Components |
| Styling | Tailwind CSS 4 | Utility-first, design tokens, fast iteration |
| Animation | Framer Motion | Spring animations, gestures, micro-interactions |
| Charts | Recharts | Composable, React-native, clean defaults |
| State | TanStack Query + Zustand | Server cache + lightweight client state |
| Icons | Lucide React | Clean, consistent icon library |

---

## Data Model

### Account
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| name | string | e.g. "Checking", "Savings" |
| type | enum | checking, savings, cash, custom |
| balance | decimal(12,2) | Current balance |
| currency | string(3) | ISO 4217, default "CAD" |
| icon | string | Lucide icon name |
| color | string | Hex color |
| is_active | bool | Soft delete support |
| created_at | datetime | Auto-set |
| updated_at | datetime | Auto-set |

### CreditCard
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| name | string | e.g. "Visa Infinite" |
| issuer | string | Optional, e.g. "TD" |
| network | string | Optional, e.g. "Visa", "Mastercard" |
| credit_limit | decimal(12,2) | Total limit |
| outstanding_balance | decimal(12,2) | Current amount owed |
| currency | string(3) | ISO 4217, default "CAD" |
| statement_day | int | Optional, day of month |
| due_day | int | Optional, day of month |
| icon | string | Lucide icon name |
| color | string | Hex color |
| is_active | bool | Soft delete support |
| created_at | datetime | Auto-set |
| updated_at | datetime | Auto-set |

### Category
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| name | string | e.g. "Groceries" |
| type | enum | expense, income |
| icon | string | Lucide icon name |
| color | string | Hex color |
| is_default | bool | Seed vs user-created |
| sort_order | int | Display ordering |

### Transaction
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| type | enum | expense, income, transfer, card_payment |
| amount | decimal(12,2) | Always positive |
| currency | string(3) | ISO 4217 |
| category_id | UUID FK | Nullable for transfers/card_payments |
| source_type | enum | account, credit_card |
| source_id | UUID | FK to account or credit_card |
| destination_type | enum | Nullable; account, credit_card |
| destination_id | UUID | Nullable; FK to account or credit_card |
| merchant | string | Optional |
| note | string | Optional |
| tags | JSON | Array of strings |
| date | date | Transaction date |
| is_recurring | bool | Flag for recurring |
| recurring_rule | JSON | Nullable; frequency, interval, etc. |
| created_at | datetime | Auto-set |
| updated_at | datetime | Auto-set |

### Budget
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| category_id | UUID FK | Nullable = overall budget |
| amount | decimal(12,2) | Budget limit |
| month | int | 1-12 |
| year | int | e.g. 2026 |
| created_at | datetime | Auto-set |

### UserPreference
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| key | string | Unique; e.g. "currency", "theme" |
| value | string | JSON-encoded value |

---

## Transaction Behavior Rules

These are non-negotiable financial logic rules:

1. **Expense from account** -> decreases account.balance by amount (source_type=account, source_id=account)
2. **Expense from credit card** -> increases credit_card.outstanding_balance by amount (source_type=credit_card, source_id=card)
3. **Income to account** -> increases account.balance by amount (source_type=account, source_id=receiving_account; no destination — income comes from outside the system)
4. **Transfer (account -> account)** -> decreases source.balance, increases destination.balance
5. **Card payment (account -> credit card)** -> decreases account.balance, decreases credit_card.outstanding_balance
6. **Partial card payments** are supported (pay any amount up to outstanding_balance)
7. **Deleting/editing a transaction** reverses the original effect before applying the new one
8. Credit card expenses NEVER reduce bank account balance directly

---

## API Design

All endpoints under `/api/v1/`.

### Accounts
- `GET /accounts` — list all active accounts
- `POST /accounts` — create account
- `GET /accounts/{id}` — get account detail
- `PUT /accounts/{id}` — update account
- `DELETE /accounts/{id}` — soft delete

### Credit Cards
- `GET /credit-cards` — list all active cards
- `POST /credit-cards` — create card
- `GET /credit-cards/{id}` — get card detail
- `PUT /credit-cards/{id}` — update card
- `DELETE /credit-cards/{id}` — soft delete

### Transactions
- `GET /transactions` — list with filters (category, source, date range, type, search, sort, pagination)
- `POST /transactions` — create transaction (applies balance logic)
- `POST /transactions/quick` — quick-add with smart defaults (minimal fields)
- `GET /transactions/{id}` — get detail
- `PUT /transactions/{id}` — update (reverses old, applies new balance)
- `DELETE /transactions/{id}` — delete (reverses balance effect)
- `GET /transactions/export` — CSV export with filters

### Categories
- `GET /categories` — list all categories
- `POST /categories` — create custom category
- `PUT /categories/{id}` — update
- `DELETE /categories/{id}` — delete (only non-default)

### Budgets
- `GET /budgets` — list budgets (filter by month/year)
- `POST /budgets` — create/update budget
- `GET /budgets/status` — budget vs actual spending for current month
- `DELETE /budgets/{id}` — delete

### Dashboard
- `GET /dashboard/summary` — total cash, total credit used, monthly spend/income/net
- `GET /dashboard/spending-by-category` — category breakdown with amounts and percentages
- `GET /dashboard/trends` — monthly totals for last 6-12 months

### Preferences
- `GET /preferences` — all preferences
- `PUT /preferences` — update preferences

---

## Frontend Screens

### 1. Dashboard
Card-based layout showing:
- **Net worth card** — total cash across accounts minus total credit owed
- **Accounts summary** — each account with balance, tappable
- **Credit cards summary** — each card with used/limit bar, tappable
- **Monthly overview** — income, expenses, net cash flow for current month
- **Spending by category** — animated donut chart with center total, legend below
- **Monthly trend** — gradient line chart showing last 6 months of spend vs income
- **Recent transactions** — last 5-8 transactions, tappable
- **Budget health** — top 3 budget progress bars with status indicators

### 2. Transactions List
- Search bar (merchant, note, category)
- Filter chips: date range, type, account/card, category
- Sort: newest, oldest, amount high/low
- Infinite scroll list
- Each row: category icon, merchant/category name, date, amount (colored red/green), source badge
- Swipe actions on mobile (edit/delete)

### 3. Quick-Add Bottom Sheet (half-screen)
The hero feature. Compact, all-in-one, half-screen bottom sheet:
- **Expense/Income toggle** — pill selector at top
- **Category selector** — horizontal scrollable chips, most-used first, "more" for full grid
- **Amount field** — large, prominent, auto-focused, CAD$ prefix
- **Source selector** — horizontal chip scroll of accounts/cards, last-used pre-selected
- **Compact row** — merchant input + date (defaults today)
- **Optional note** — collapsed by default, "add note" to expand
- **Save button** — always visible, prominent, at bottom

Target: 2-3 taps for typical expense.

### 4. Full Add/Edit Transaction
Expanded form page with all fields:
- Type selector (expense/income/transfer/card_payment)
- Amount with currency
- Category picker (grid modal)
- Source account/card picker
- Destination (for transfers/card payments)
- Merchant
- Date picker
- Note
- Tags input
- Recurring toggle + rule config
- Save / Cancel

### 5. Accounts Page
- List of account cards with name, type badge, balance, icon
- Tap to view account detail + transaction history for that account
- Add account button
- Edit/delete actions

### 6. Credit Cards Page
- List of card cards with name, issuer badge, utilization bar (used/limit), outstanding balance
- Available credit shown prominently
- Tap for card detail + transaction history
- "Pay bill" quick action on each card
- Add card button

### 7. Budgets Page
- Month/year selector at top
- Overall monthly budget bar
- Category budget list with progress bars
- Color coding: green (under 75%), yellow (75-100%), red (over)
- Remaining/overspent amounts
- Add/edit budget actions

### 8. Quick-Add Route (`/quick-add`)
- Standalone page (not modal) for shortcut integration
- Accepts query params: `?amount=X&category=Y&source=Z&type=expense`
- Pre-fills provided values, shows remaining fields
- After save: success screen with "add another" or "close"
- Designed to be opened via iOS Shortcuts "Open URL" or Android intents

### 9. Settings Page
- Currency preference
- Theme toggle (light/dark)
- Category management (reorder, add, edit, delete custom)
- Export data (CSV)
- About / version info

---

## Navigation

**Mobile (bottom tab bar with 5 items):**
1. Dashboard (home icon)
2. Transactions (list icon)
3. **Center FAB** — quick-add (plus icon, elevated, accent color)
4. Budgets (pie chart icon)
5. More (menu) — expands to Accounts, Cards, Settings

**Desktop:** Side navigation with the same structure.

---

## UI Design System

### Color Palette
- **Primary/Accent:** Vibrant teal-emerald (`#0D9488` family) — CTAs, FAB, active states
- **Dark mode base:** Deep slate/navy (`#0F172A`, `#1E293B`)
- **Light mode base:** Warm off-white (`#F8FAFC`, `#FFFFFF`)
- **Success:** Emerald green for income
- **Danger:** Rose/red for expenses and overspending
- **Warning:** Amber for budget warnings
- **Category palette:** 17 curated distinct colors for categories

### Typography
- Font: Inter (Google Fonts) with system font fallback
- Amounts: Bold, large (text-2xl to text-4xl), tabular-nums
- Headings: 3 sizes (semibold)
- Body: 2 sizes (regular/medium)
- All text optimized for readability

### Components
- **Cards:** `rounded-2xl`, subtle shadow (`shadow-sm`), `backdrop-blur` on glass variants, no harsh borders
- **Buttons:** Rounded-full for primary, rounded-xl for secondary, scale-on-press animation
- **Chips/Badges:** Rounded-full, colored backgrounds with opacity, compact padding
- **Bottom sheet:** Spring-animated with Framer Motion, drag-to-dismiss, half-screen snap point
- **Forms:** Floating labels or minimal labels, large touch targets (min 44px), clean spacing
- **Progress bars:** Rounded, gradient fills, animated width transitions

### Motion
- Framer Motion spring animations for sheets and modals
- Layout animation for list additions/removals
- Subtle scale (0.97) on press for interactive elements
- Staggered fade-in for dashboard cards on load
- Animated number counting for totals

### Dark Mode
- Full dark theme via Tailwind `dark:` classes
- Toggle in settings, persisted to preferences
- Respects system preference on first visit

### Empty States
- Custom illustrations (SVG) with descriptive text and CTA button
- e.g. "No transactions yet — tap + to add your first expense"

---

## Seed Data

Realistic demo data for first-run experience:

### Accounts
1. Checking Account — CAD $4,250.00
2. Savings Account — CAD $12,800.00
3. Cash Wallet — CAD $180.00

### Credit Cards
1. TD Visa Infinite — limit $10,000, outstanding $2,340.50, due day 15
2. CIBC Mastercard — limit $5,000, outstanding $890.25, statement day 22

### Categories (17 expense + 4 income)
**Expense:** Housing, Groceries, Dining, Transport, Fuel, Utilities, Internet, Phone, Insurance, Healthcare, Shopping, Subscriptions, Entertainment, Education, Travel, Transfer, Credit Card Payment
**Income:** Salary, Freelance, Investment, Other Income

### Transactions
~40-50 realistic transactions over the past 2-3 months including:
- Recurring rent, subscriptions, utilities
- Varied grocery and dining expenses
- A salary income twice a month
- A credit card payment
- An account-to-account transfer
- Mix of account and credit card expenses

### Budgets
- Overall monthly: CAD $4,000
- Groceries: $600
- Dining: $300
- Transport: $200
- Entertainment: $150
- Shopping: $250

---

## Shortcut Integration Strategy

### Current Implementation
1. **Quick-add route** (`/quick-add?amount=&category=&source=&type=`) — web URL that can be bookmarked or opened by any automation
2. **Quick-add API** (`POST /api/v1/transactions/quick`) — headless endpoint for HTTP-based automations

### Future iOS Shortcuts Integration
- Create an iOS Shortcut that uses "Open URL" action pointing to the quick-add route
- Or use "Get Contents of URL" to POST directly to the API
- Can prompt for amount via Shortcut input, pass as query param
- Add to Home Screen for instant access

### Future Android Integration
- Android App Shortcut via PWA manifest
- Intent filter on the quick-add URL
- Tasker/Automate integration via API endpoint

### Future Widget
- PWA-ready structure for installable home screen app
- Quick-add as the primary widget action

---

## Project Structure

```
fintrack/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI app, CORS, lifespan
│   │   ├── config.py            # Settings from env vars
│   │   ├── database.py          # Engine, session, Base
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── account.py
│   │   │   ├── credit_card.py
│   │   │   ├── transaction.py
│   │   │   ├── category.py
│   │   │   ├── budget.py
│   │   │   └── preference.py
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── account.py
│   │   │   ├── credit_card.py
│   │   │   ├── transaction.py
│   │   │   ├── category.py
│   │   │   ├── budget.py
│   │   │   └── preference.py
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── accounts.py
│   │   │   ├── credit_cards.py
│   │   │   ├── transactions.py
│   │   │   ├── categories.py
│   │   │   ├── budgets.py
│   │   │   ├── dashboard.py
│   │   │   └── preferences.py
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── transaction_service.py  # Balance logic
│   │   │   ├── dashboard_service.py
│   │   │   └── budget_service.py
│   │   └── seed.py              # Seed data script
│   ├── alembic/
│   │   ├── env.py
│   │   └── versions/
│   ├── alembic.ini
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── app/                 # Next.js App Router pages
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx         # Dashboard
│   │   │   ├── transactions/
│   │   │   ├── accounts/
│   │   │   ├── credit-cards/
│   │   │   ├── budgets/
│   │   │   ├── quick-add/
│   │   │   └── settings/
│   │   ├── components/
│   │   │   ├── ui/              # Design system primitives
│   │   │   ├── dashboard/
│   │   │   ├── transactions/
│   │   │   ├── accounts/
│   │   │   ├── credit-cards/
│   │   │   ├── budgets/
│   │   │   └── layout/          # Nav, bottom bar, FAB
│   │   ├── lib/
│   │   │   ├── api.ts           # API client (fetch wrapper)
│   │   │   ├── utils.ts         # Formatting, helpers
│   │   │   └── constants.ts     # Category colors, icons map
│   │   ├── hooks/
│   │   │   ├── useTransactions.ts
│   │   │   ├── useAccounts.ts
│   │   │   └── useDashboard.ts
│   │   ├── stores/
│   │   │   └── ui-store.ts      # Zustand for UI state
│   │   └── types/
│   │       └── index.ts         # TypeScript types matching API
│   ├── public/
│   ├── tailwind.config.ts
│   ├── next.config.js
│   ├── package.json
│   └── tsconfig.json
├── docs/
│   └── superpowers/specs/
├── .gitignore
└── README.md
```

---

## Hosting Readiness

- **Backend:** FastAPI served via Uvicorn. Dockerfile-ready. Deploy to Railway, Render, Fly.io, or any container host.
- **Frontend:** Next.js can deploy to Vercel (ideal), or build as static export for other hosts.
- **Database:** `DATABASE_URL` env var. SQLite for dev (`sqlite:///./fintrack.db`), PostgreSQL for prod.
- **Environment variables:** `.env.example` provided with all required vars.
- **CORS:** Configured for local dev, adjustable for production domain.

---

## Verification Plan

1. **Backend:** Run FastAPI dev server, hit all API endpoints via Swagger UI (`/docs`)
2. **Seed data:** Run seed script, verify accounts/cards/transactions appear
3. **Frontend:** Run Next.js dev server, verify all 9 screens render
4. **Quick-add flow:** Test bottom sheet open/close, submit expense, verify balance changes
5. **Transaction logic:** Create expenses from account (balance decreases) and credit card (outstanding increases). Create card payment (account decreases, card outstanding decreases). Create transfer (source decreases, destination increases).
6. **Dashboard:** Verify all aggregations match actual data
7. **Budgets:** Set budget, add expenses, verify progress bars update
8. **Quick-add route:** Open `/quick-add?amount=50&category=groceries`, verify pre-fill
9. **Dark mode:** Toggle theme, verify full coverage
10. **CSV export:** Export transactions, verify file downloads with correct data

---

## Known Limitations (V1)

- Single-user only (no auth)
- No recurring transaction auto-creation (flag only, manual execution)
- No bank sync / import
- No multi-currency conversion (multi-currency schema ready, single display currency)
- No push notifications
- SQLite in dev (no concurrent writes in production)

## Next Best Improvements (Post-V1)

1. User authentication (JWT-based)
2. Recurring transaction auto-execution via background scheduler
3. Bank statement CSV/OFX import
4. Multi-currency with exchange rate API
5. PWA support for installable mobile experience
6. Category spending insights and anomaly detection
7. PostgreSQL migration for production
