from __future__ import annotations

from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services import dashboard_service

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary")
async def summary(db: AsyncSession = Depends(get_db)):
    return await dashboard_service.get_summary(db)


@router.get("/spending-by-category")
async def spending_by_category(
    month: Optional[int] = Query(None),
    year: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    today = date.today()
    m = month if month is not None else today.month
    y = year if year is not None else today.year
    return await dashboard_service.get_spending_by_category(db, m, y)


@router.get("/trends")
async def trends(
    months: int = Query(6, ge=1, le=24),
    db: AsyncSession = Depends(get_db),
):
    return await dashboard_service.get_trends(db, months)
