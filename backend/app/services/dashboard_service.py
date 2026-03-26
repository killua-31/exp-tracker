from __future__ import annotations

import calendar
from datetime import date
from typing import List, Optional

from sqlalchemy import func, select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.account import Account
from app.models.credit_card import CreditCard
from app.models.transaction import Transaction, TransactionType
from app.models.category import Category


async def get_summary(db: AsyncSession) -> dict:
    today = date.today()
    current_month = today.month
    current_year = today.year

    # Total cash: sum of all active account balances
    result = await db.execute(
        select(func.coalesce(func.sum(Account.balance), 0)).where(
            Account.is_active == True
        )
    )
    total_cash = float(result.scalar())

    # Total credit used and limit
    result = await db.execute(
        select(
            func.coalesce(func.sum(CreditCard.outstanding_balance), 0),
            func.coalesce(func.sum(CreditCard.credit_limit), 0),
        ).where(CreditCard.is_active == True)
    )
    row = result.one()
    total_credit_used = float(row[0])
    total_credit_limit = float(row[1])

    net_worth = total_cash - total_credit_used

    # Monthly income
    result = await db.execute(
        select(func.coalesce(func.sum(Transaction.amount), 0)).where(
            and_(
                Transaction.type == TransactionType.income,
                func.extract("month", Transaction.date) == current_month,
                func.extract("year", Transaction.date) == current_year,
            )
        )
    )
    monthly_income = float(result.scalar())

    # Monthly expenses
    result = await db.execute(
        select(func.coalesce(func.sum(Transaction.amount), 0)).where(
            and_(
                Transaction.type == TransactionType.expense,
                func.extract("month", Transaction.date) == current_month,
                func.extract("year", Transaction.date) == current_year,
            )
        )
    )
    monthly_expenses = float(result.scalar())

    monthly_net = monthly_income - monthly_expenses

    return {
        "total_cash": total_cash,
        "total_credit_used": total_credit_used,
        "total_credit_limit": total_credit_limit,
        "net_worth": net_worth,
        "monthly_income": monthly_income,
        "monthly_expenses": monthly_expenses,
        "monthly_net": monthly_net,
    }


async def get_spending_by_category(
    db: AsyncSession, month: int, year: int
) -> List[dict]:
    # Get expense totals grouped by category
    result = await db.execute(
        select(
            Transaction.category_id,
            Category.name,
            Category.icon,
            Category.color,
            func.sum(Transaction.amount).label("amount"),
        )
        .join(Category, Transaction.category_id == Category.id)
        .where(
            and_(
                Transaction.type == TransactionType.expense,
                func.extract("month", Transaction.date) == month,
                func.extract("year", Transaction.date) == year,
            )
        )
        .group_by(
            Transaction.category_id, Category.name, Category.icon, Category.color
        )
        .order_by(func.sum(Transaction.amount).desc())
    )
    rows = result.all()

    total = sum(float(r.amount) for r in rows)

    items = []
    for r in rows:
        amount = float(r.amount)
        items.append(
            {
                "category_name": r.name,
                "category_icon": r.icon,
                "category_color": r.color,
                "amount": amount,
                "percentage": round((amount / total * 100) if total > 0 else 0, 1),
            }
        )
    return items


async def get_trends(db: AsyncSession, months: int = 6) -> List[dict]:
    today = date.today()
    results = []

    for i in range(months - 1, -1, -1):
        # Calculate month/year going backwards
        m = today.month - i
        y = today.year
        while m <= 0:
            m += 12
            y -= 1

        month_label = calendar.month_abbr[m]

        # Income for this month
        res = await db.execute(
            select(func.coalesce(func.sum(Transaction.amount), 0)).where(
                and_(
                    Transaction.type == TransactionType.income,
                    func.extract("month", Transaction.date) == m,
                    func.extract("year", Transaction.date) == y,
                )
            )
        )
        income = float(res.scalar())

        # Expenses for this month
        res = await db.execute(
            select(func.coalesce(func.sum(Transaction.amount), 0)).where(
                and_(
                    Transaction.type == TransactionType.expense,
                    func.extract("month", Transaction.date) == m,
                    func.extract("year", Transaction.date) == y,
                )
            )
        )
        expenses = float(res.scalar())

        results.append(
            {
                "month": m,
                "year": y,
                "label": month_label,
                "income": income,
                "expenses": expenses,
                "net": income - expenses,
            }
        )

    return results
