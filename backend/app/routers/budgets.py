from __future__ import annotations

import uuid
from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.budget import Budget
from app.schemas.budget import BudgetCreate, BudgetResponse, BudgetStatus
from app.services import budget_service

router = APIRouter(prefix="/budgets", tags=["budgets"])


@router.get("/", response_model=List[BudgetResponse])
async def list_budgets(
    month: Optional[int] = Query(None),
    year: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    q = select(Budget)
    if month is not None:
        q = q.where(Budget.month == month)
    if year is not None:
        q = q.where(Budget.year == year)
    q = q.order_by(Budget.created_at)
    result = await db.execute(q)
    return result.scalars().all()


@router.post("/", response_model=BudgetResponse, status_code=201)
async def create_budget(data: BudgetCreate, db: AsyncSession = Depends(get_db)):
    # UPSERT: check if budget exists for same category_id + month + year
    if data.category_id is not None:
        result = await db.execute(
            select(Budget).where(
                and_(
                    Budget.category_id == data.category_id,
                    Budget.month == data.month,
                    Budget.year == data.year,
                )
            )
        )
    else:
        result = await db.execute(
            select(Budget).where(
                and_(
                    Budget.category_id.is_(None),
                    Budget.month == data.month,
                    Budget.year == data.year,
                )
            )
        )
    existing = result.scalar_one_or_none()

    if existing:
        existing.amount = data.amount
        await db.commit()
        await db.refresh(existing)
        return existing

    budget = Budget(**data.model_dump())
    db.add(budget)
    await db.commit()
    await db.refresh(budget)
    return budget


@router.get("/status", response_model=List[BudgetStatus])
async def budget_status(
    month: Optional[int] = Query(None),
    year: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    today = date.today()
    m = month if month is not None else today.month
    y = year if year is not None else today.year
    return await budget_service.get_budget_status(db, m, y)


@router.delete("/{budget_id}")
async def delete_budget(budget_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Budget).where(Budget.id == budget_id))
    budget = result.scalar_one_or_none()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    await db.delete(budget)
    await db.commit()
    return {"ok": True}
