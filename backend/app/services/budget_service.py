from __future__ import annotations

from typing import List

from sqlalchemy import func, select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.budget import Budget
from app.models.transaction import Transaction, TransactionType
from app.schemas.budget import BudgetResponse, BudgetStatus


async def get_budget_status(
    db: AsyncSession, month: int, year: int
) -> List[dict]:
    # Get all budgets for the given month/year
    result = await db.execute(
        select(Budget).where(
            and_(Budget.month == month, Budget.year == year)
        )
    )
    budgets = result.scalars().all()

    statuses = []
    for budget in budgets:
        if budget.category_id is None:
            # Overall budget: sum ALL expense transactions for that month/year
            res = await db.execute(
                select(func.coalesce(func.sum(Transaction.amount), 0)).where(
                    and_(
                        Transaction.type == TransactionType.expense,
                        func.extract("month", Transaction.date) == month,
                        func.extract("year", Transaction.date) == year,
                    )
                )
            )
        else:
            # Category-specific budget
            res = await db.execute(
                select(func.coalesce(func.sum(Transaction.amount), 0)).where(
                    and_(
                        Transaction.type == TransactionType.expense,
                        Transaction.category_id == budget.category_id,
                        func.extract("month", Transaction.date) == month,
                        func.extract("year", Transaction.date) == year,
                    )
                )
            )

        spent = float(res.scalar())
        budget_amount = float(budget.amount)
        remaining = budget_amount - spent
        percentage = round((spent / budget_amount * 100) if budget_amount > 0 else 0, 1)

        statuses.append(
            {
                "budget": BudgetResponse.model_validate(budget),
                "spent": spent,
                "remaining": remaining,
                "percentage": percentage,
            }
        )

    return statuses
