from __future__ import annotations

import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.account import Account
from app.schemas.account import AccountCreate, AccountUpdate, AccountResponse

router = APIRouter(prefix="/accounts", tags=["accounts"])


@router.get("", response_model=List[AccountResponse])
async def list_accounts(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Account).where(Account.is_active == True).order_by(Account.created_at)
    )
    return result.scalars().all()


@router.post("", response_model=AccountResponse, status_code=201)
async def create_account(data: AccountCreate, db: AsyncSession = Depends(get_db)):
    account = Account(**data.model_dump())
    db.add(account)
    await db.commit()
    await db.refresh(account)
    return account


@router.get("/{account_id}", response_model=AccountResponse)
async def get_account(account_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Account).where(Account.id == account_id, Account.is_active == True)
    )
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    return account


@router.put("/{account_id}", response_model=AccountResponse)
async def update_account(
    account_id: uuid.UUID,
    data: AccountUpdate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Account).where(Account.id == account_id, Account.is_active == True)
    )
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(account, key, value)
    await db.commit()
    await db.refresh(account)
    return account


@router.delete("/{account_id}")
async def delete_account(account_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Account).where(Account.id == account_id, Account.is_active == True)
    )
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    account.is_active = False
    await db.commit()
    return {"ok": True}
