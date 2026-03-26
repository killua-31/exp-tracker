from __future__ import annotations

import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.credit_card import CreditCard
from app.schemas.credit_card import CreditCardCreate, CreditCardUpdate, CreditCardResponse

router = APIRouter(prefix="/credit-cards", tags=["credit-cards"])


@router.get("", response_model=List[CreditCardResponse])
async def list_credit_cards(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(CreditCard).where(CreditCard.is_active == True).order_by(CreditCard.created_at)
    )
    return result.scalars().all()


@router.post("", response_model=CreditCardResponse, status_code=201)
async def create_credit_card(data: CreditCardCreate, db: AsyncSession = Depends(get_db)):
    card = CreditCard(**data.model_dump())
    db.add(card)
    await db.commit()
    await db.refresh(card)
    return card


@router.get("/{card_id}", response_model=CreditCardResponse)
async def get_credit_card(card_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(CreditCard).where(CreditCard.id == card_id, CreditCard.is_active == True)
    )
    card = result.scalar_one_or_none()
    if not card:
        raise HTTPException(status_code=404, detail="Credit card not found")
    return card


@router.put("/{card_id}", response_model=CreditCardResponse)
async def update_credit_card(
    card_id: uuid.UUID,
    data: CreditCardUpdate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CreditCard).where(CreditCard.id == card_id, CreditCard.is_active == True)
    )
    card = result.scalar_one_or_none()
    if not card:
        raise HTTPException(status_code=404, detail="Credit card not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(card, key, value)
    await db.commit()
    await db.refresh(card)
    return card


@router.delete("/{card_id}")
async def delete_credit_card(card_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(CreditCard).where(CreditCard.id == card_id, CreditCard.is_active == True)
    )
    card = result.scalar_one_or_none()
    if not card:
        raise HTTPException(status_code=404, detail="Credit card not found")
    card.is_active = False
    await db.commit()
    return {"ok": True}
