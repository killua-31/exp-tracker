from __future__ import annotations

import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("", response_model=List[CategoryResponse])
async def list_categories(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Category).order_by(Category.sort_order)
    )
    return result.scalars().all()


@router.post("", response_model=CategoryResponse, status_code=201)
async def create_category(data: CategoryCreate, db: AsyncSession = Depends(get_db)):
    category = Category(**data.model_dump(), is_default=False)
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category


@router.put("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: uuid.UUID,
    data: CategoryUpdate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Category).where(Category.id == category_id)
    )
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(category, key, value)
    await db.commit()
    await db.refresh(category)
    return category


@router.delete("/{category_id}")
async def delete_category(category_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Category).where(Category.id == category_id)
    )
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    if category.is_default:
        raise HTTPException(status_code=400, detail="Cannot delete default category")
    await db.delete(category)
    await db.commit()
    return {"ok": True}
