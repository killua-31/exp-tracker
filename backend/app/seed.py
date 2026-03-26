"""Seed the database with realistic demo data."""
from __future__ import annotations

import asyncio
import uuid
from datetime import date
from decimal import Decimal

from sqlalchemy import delete

from app.database import async_session, init_db
from app.models.account import Account, AccountType
from app.models.budget import Budget
from app.models.category import Category, CategoryType
from app.models.credit_card import CreditCard
from app.models.preference import UserPreference
from app.models.transaction import Transaction, TransactionType, SourceType


async def seed():
    await init_db()

    async with async_session() as db:
        # Clear existing data in dependency order
        await db.execute(delete(Transaction))
        await db.execute(delete(Budget))
        await db.execute(delete(UserPreference))
        await db.execute(delete(CreditCard))
        await db.execute(delete(Account))
        await db.execute(delete(Category))
        await db.commit()

        # ── Categories (21 total) ──────────────────────────────────
        expense_cats = [
            ("Housing", "home", "#EF4444"),
            ("Groceries", "shopping-cart", "#F97316"),
            ("Dining", "utensils", "#F59E0B"),
            ("Transport", "bus", "#84CC16"),
            ("Fuel", "fuel", "#22C55E"),
            ("Utilities", "zap", "#14B8A6"),
            ("Internet", "wifi", "#06B6D4"),
            ("Phone", "smartphone", "#3B82F6"),
            ("Insurance", "shield", "#6366F1"),
            ("Healthcare", "heart-pulse", "#8B5CF6"),
            ("Shopping", "shopping-bag", "#A855F7"),
            ("Subscriptions", "repeat", "#D946EF"),
            ("Entertainment", "film", "#EC4899"),
            ("Education", "graduation-cap", "#F43F5E"),
            ("Travel", "plane", "#0EA5E9"),
            ("Transfer", "arrow-left-right", "#64748B"),
            ("Credit Card Payment", "credit-card", "#475569"),
        ]
        income_cats = [
            ("Salary", "briefcase", "#10B981"),
            ("Freelance", "laptop", "#06B6D4"),
            ("Investment", "trending-up", "#8B5CF6"),
            ("Other Income", "plus-circle", "#64748B"),
        ]

        cat_map = {}  # name -> Category object
        sort_order = 0
        for name, icon, color in expense_cats:
            c = Category(
                id=uuid.uuid4(),
                name=name,
                type=CategoryType.expense,
                icon=icon,
                color=color,
                is_default=True,
                sort_order=sort_order,
            )
            db.add(c)
            cat_map[name] = c
            sort_order += 1

        for name, icon, color in income_cats:
            c = Category(
                id=uuid.uuid4(),
                name=name,
                type=CategoryType.income,
                icon=icon,
                color=color,
                is_default=True,
                sort_order=sort_order,
            )
            db.add(c)
            cat_map[name] = c
            sort_order += 1

        # ── Accounts (3) ──────────────────────────────────────────
        checking = Account(
            id=uuid.uuid4(),
            name="Checking Account",
            type=AccountType.checking,
            balance=Decimal("4250.00"),
            currency="CAD",
            icon="landmark",
            color="#3B82F6",
            is_active=True,
        )
        savings = Account(
            id=uuid.uuid4(),
            name="Savings Account",
            type=AccountType.savings,
            balance=Decimal("12800.00"),
            currency="CAD",
            icon="piggy-bank",
            color="#10B981",
            is_active=True,
        )
        cash = Account(
            id=uuid.uuid4(),
            name="Cash Wallet",
            type=AccountType.cash,
            balance=Decimal("180.00"),
            currency="CAD",
            icon="wallet",
            color="#F59E0B",
            is_active=True,
        )
        db.add_all([checking, savings, cash])

        # ── Credit Cards (2) ──────────────────────────────────────
        td_visa = CreditCard(
            id=uuid.uuid4(),
            name="TD Visa Infinite",
            credit_limit=Decimal("10000.00"),
            outstanding_balance=Decimal("2340.50"),
            currency="CAD",
            due_day=15,
            icon="credit-card",
            color="#8B5CF6",
            is_active=True,
        )
        cibc = CreditCard(
            id=uuid.uuid4(),
            name="CIBC Mastercard",
            credit_limit=Decimal("5000.00"),
            outstanding_balance=Decimal("890.25"),
            currency="CAD",
            statement_day=22,
            icon="credit-card",
            color="#EC4899",
            is_active=True,
        )
        db.add_all([td_visa, cibc])

        # ── Helper to create transaction ──────────────────────────
        txns = []

        def add_txn(
            txn_type,
            amount,
            category_name,
            source_type,
            source,
            txn_date,
            merchant=None,
            note=None,
            destination_type=None,
            destination=None,
            tags=None,
            is_recurring=False,
        ):
            t = Transaction(
                id=uuid.uuid4(),
                type=txn_type,
                amount=Decimal(str(amount)),
                currency="CAD",
                category_id=cat_map[category_name].id if category_name else None,
                source_type=source_type,
                source_id=source.id,
                destination_type=destination_type,
                destination_id=destination.id if destination else None,
                merchant=merchant,
                note=note,
                tags=tags or [],
                date=txn_date,
                is_recurring=is_recurring,
            )
            txns.append(t)

        # ── Transactions (~45) ────────────────────────────────────

        # Rent: $1,800/month from Checking -> Housing (Jan 1, Feb 1, Mar 1)
        for m in [1, 2, 3]:
            add_txn(
                TransactionType.expense, 1800.00, "Housing",
                SourceType.account, checking, date(2026, m, 1),
                merchant="Landlord", note="Monthly rent", is_recurring=True,
            )

        # Salary: $3,500 twice/month to Checking -> Salary (1st and 15th)
        for m in [1, 2, 3]:
            add_txn(
                TransactionType.income, 3500.00, "Salary",
                SourceType.account, checking, date(2026, m, 1),
                merchant="Acme Corp", note="Salary deposit", is_recurring=True,
            )
            add_txn(
                TransactionType.income, 3500.00, "Salary",
                SourceType.account, checking, date(2026, m, 15),
                merchant="Acme Corp", note="Salary deposit", is_recurring=True,
            )

        # Groceries: 9 entries ($40-$120) from Checking and TD Visa
        grocery_items = [
            (65.43, SourceType.account, checking, date(2026, 1, 5), "Loblaws"),
            (98.21, SourceType.credit_card, td_visa, date(2026, 1, 12), "Costco"),
            (42.50, SourceType.account, checking, date(2026, 1, 22), "No Frills"),
            (110.75, SourceType.credit_card, td_visa, date(2026, 2, 3), "Costco"),
            (55.89, SourceType.account, checking, date(2026, 2, 10), "Loblaws"),
            (78.30, SourceType.credit_card, td_visa, date(2026, 2, 19), "Metro"),
            (92.45, SourceType.account, checking, date(2026, 3, 2), "Costco"),
            (48.60, SourceType.credit_card, td_visa, date(2026, 3, 11), "Loblaws"),
            (119.99, SourceType.account, checking, date(2026, 3, 20), "Costco"),
        ]
        for amt, st, src, d, merch in grocery_items:
            add_txn(
                TransactionType.expense, amt, "Groceries",
                st, src, d, merchant=merch,
            )

        # Dining: 6 entries ($15-$65) from TD Visa and CIBC
        dining_items = [
            (32.50, SourceType.credit_card, td_visa, date(2026, 1, 8), "Tim Hortons"),
            (58.90, SourceType.credit_card, cibc, date(2026, 1, 18), "The Keg"),
            (15.75, SourceType.credit_card, cibc, date(2026, 2, 5), "McDonald's"),
            (45.00, SourceType.credit_card, td_visa, date(2026, 2, 14), "Earls"),
            (64.25, SourceType.credit_card, cibc, date(2026, 3, 7), "Milestones"),
            (22.80, SourceType.credit_card, td_visa, date(2026, 3, 18), "Starbucks"),
        ]
        for amt, st, src, d, merch in dining_items:
            add_txn(
                TransactionType.expense, amt, "Dining",
                st, src, d, merchant=merch,
            )

        # Subscriptions: Netflix $16.49, Spotify $11.99, iCloud $3.99 monthly from TD Visa
        for m in [1, 2, 3]:
            add_txn(
                TransactionType.expense, 16.49, "Subscriptions",
                SourceType.credit_card, td_visa, date(2026, m, 5),
                merchant="Netflix", is_recurring=True,
            )
            add_txn(
                TransactionType.expense, 11.99, "Subscriptions",
                SourceType.credit_card, td_visa, date(2026, m, 5),
                merchant="Spotify", is_recurring=True,
            )
            add_txn(
                TransactionType.expense, 3.99, "Subscriptions",
                SourceType.credit_card, td_visa, date(2026, m, 5),
                merchant="Apple iCloud", is_recurring=True,
            )

        # Utilities: Hydro $85, Gas $65 from Checking (monthly)
        for m in [1, 2, 3]:
            add_txn(
                TransactionType.expense, 85.00, "Utilities",
                SourceType.account, checking, date(2026, m, 10),
                merchant="Hydro One", is_recurring=True,
            )
            add_txn(
                TransactionType.expense, 65.00, "Utilities",
                SourceType.account, checking, date(2026, m, 12),
                merchant="Enbridge Gas", is_recurring=True,
            )

        # Internet: $75/month from Checking
        for m in [1, 2, 3]:
            add_txn(
                TransactionType.expense, 75.00, "Internet",
                SourceType.account, checking, date(2026, m, 8),
                merchant="Bell", is_recurring=True,
            )

        # Transport: 4 entries ($3-$25) from CIBC
        transport_items = [
            (3.35, date(2026, 1, 14), "TTC"),
            (25.00, date(2026, 2, 8), "Uber"),
            (3.35, date(2026, 2, 22), "TTC"),
            (18.50, date(2026, 3, 10), "Uber"),
        ]
        for amt, d, merch in transport_items:
            add_txn(
                TransactionType.expense, amt, "Transport",
                SourceType.credit_card, cibc, d, merchant=merch,
            )

        # Shopping: 3 entries ($30-$150) from TD Visa
        shopping_items = [
            (89.99, date(2026, 1, 20), "Amazon"),
            (149.00, date(2026, 2, 12), "Best Buy"),
            (34.50, date(2026, 3, 15), "Amazon"),
        ]
        for amt, d, merch in shopping_items:
            add_txn(
                TransactionType.expense, amt, "Shopping",
                SourceType.credit_card, td_visa, d, merchant=merch,
            )

        # Entertainment: 2 entries ($20-$50) from CIBC
        add_txn(
            TransactionType.expense, 24.99, "Entertainment",
            SourceType.credit_card, cibc, date(2026, 2, 1),
            merchant="Cineplex",
        )
        add_txn(
            TransactionType.expense, 45.00, "Entertainment",
            SourceType.credit_card, cibc, date(2026, 3, 8),
            merchant="Scotiabank Arena",
        )

        # Transfer: $500 from Checking to Savings (Feb 15)
        add_txn(
            TransactionType.transfer, 500.00, "Transfer",
            SourceType.account, checking, date(2026, 2, 15),
            note="Monthly savings transfer",
            destination_type=SourceType.account, destination=savings,
        )

        # Card payment: $1,500 from Checking to TD Visa (Feb 20)
        add_txn(
            TransactionType.card_payment, 1500.00, "Credit Card Payment",
            SourceType.account, checking, date(2026, 2, 20),
            note="Visa payment",
            destination_type=SourceType.credit_card, destination=td_visa,
        )

        # Fuel: 2 entries ($55-$70) from Checking
        add_txn(
            TransactionType.expense, 62.50, "Fuel",
            SourceType.account, checking, date(2026, 1, 25),
            merchant="Petro-Canada",
        )
        add_txn(
            TransactionType.expense, 55.80, "Fuel",
            SourceType.account, checking, date(2026, 3, 5),
            merchant="Shell",
        )

        db.add_all(txns)

        # ── Budgets (6) for March 2026 ────────────────────────────
        budgets = [
            Budget(
                id=uuid.uuid4(),
                category_id=None,
                amount=Decimal("4000.00"),
                month=3,
                year=2026,
            ),
            Budget(
                id=uuid.uuid4(),
                category_id=cat_map["Groceries"].id,
                amount=Decimal("600.00"),
                month=3,
                year=2026,
            ),
            Budget(
                id=uuid.uuid4(),
                category_id=cat_map["Dining"].id,
                amount=Decimal("300.00"),
                month=3,
                year=2026,
            ),
            Budget(
                id=uuid.uuid4(),
                category_id=cat_map["Transport"].id,
                amount=Decimal("200.00"),
                month=3,
                year=2026,
            ),
            Budget(
                id=uuid.uuid4(),
                category_id=cat_map["Entertainment"].id,
                amount=Decimal("150.00"),
                month=3,
                year=2026,
            ),
            Budget(
                id=uuid.uuid4(),
                category_id=cat_map["Shopping"].id,
                amount=Decimal("250.00"),
                month=3,
                year=2026,
            ),
        ]
        db.add_all(budgets)

        # ── Preferences ───────────────────────────────────────────
        db.add(UserPreference(id=uuid.uuid4(), key="currency", value="CAD"))
        db.add(UserPreference(id=uuid.uuid4(), key="theme", value="system"))

        await db.commit()
        print("Seed data loaded successfully!")
        print(f"  Categories: 21")
        print(f"  Accounts: 3")
        print(f"  Credit Cards: 2")
        print(f"  Transactions: {len(txns)}")
        print(f"  Budgets: {len(budgets)}")
        print(f"  Preferences: 2")


if __name__ == "__main__":
    asyncio.run(seed())
