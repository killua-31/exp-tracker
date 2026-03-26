from __future__ import annotations

import csv
import io
import uuid
from datetime import date as date_type
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.transaction import Transaction
from app.models.category import Category
from app.schemas.transaction import (
    TransactionCreate,
    TransactionUpdate,
    TransactionResponse,
    QuickTransactionCreate,
)
from app.services import transaction_service

router = APIRouter(prefix="/transactions", tags=["transactions"])


def _build_query(
    category_id: Optional[uuid.UUID] = None,
    source_type: Optional[str] = None,
    source_id: Optional[uuid.UUID] = None,
    type: Optional[str] = None,
    date_from: Optional[date_type] = None,
    date_to: Optional[date_type] = None,
    search: Optional[str] = None,
    sort: str = "newest",
):
    """Build a dynamic select query with filters."""
    q = select(Transaction)
    if category_id is not None:
        q = q.where(Transaction.category_id == category_id)
    if source_type is not None:
        q = q.where(Transaction.source_type == source_type)
    if source_id is not None:
        q = q.where(Transaction.source_id == source_id)
    if type is not None:
        q = q.where(Transaction.type == type)
    if date_from is not None:
        q = q.where(Transaction.date >= date_from)
    if date_to is not None:
        q = q.where(Transaction.date <= date_to)
    if search is not None:
        pattern = f"%{search}%"
        q = q.where(
            or_(
                Transaction.merchant.ilike(pattern),
                Transaction.note.ilike(pattern),
            )
        )
    if sort == "oldest":
        q = q.order_by(Transaction.date.asc(), Transaction.created_at.asc())
    elif sort == "amount_high":
        q = q.order_by(Transaction.amount.desc())
    elif sort == "amount_low":
        q = q.order_by(Transaction.amount.asc())
    else:  # newest (default)
        q = q.order_by(Transaction.date.desc(), Transaction.created_at.desc())
    return q


@router.get("/export")
async def export_transactions(
    db: AsyncSession = Depends(get_db),
    category_id: Optional[uuid.UUID] = Query(None),
    source_type: Optional[str] = Query(None),
    source_id: Optional[uuid.UUID] = Query(None),
    type: Optional[str] = Query(None),
    date_from: Optional[date_type] = Query(None),
    date_to: Optional[date_type] = Query(None),
    search: Optional[str] = Query(None),
    sort: str = Query("newest"),
):
    q = _build_query(
        category_id=category_id,
        source_type=source_type,
        source_id=source_id,
        type=type,
        date_from=date_from,
        date_to=date_to,
        search=search,
        sort=sort,
    )
    result = await db.execute(q)
    transactions = result.scalars().all()

    # Collect category ids to look up names
    cat_ids = {t.category_id for t in transactions if t.category_id}
    cat_map = {}
    if cat_ids:
        cat_result = await db.execute(
            select(Category).where(Category.id.in_(cat_ids))
        )
        for cat in cat_result.scalars().all():
            cat_map[cat.id] = cat.name

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "date", "type", "amount", "currency", "category",
        "merchant", "source_type", "note", "tags",
    ])
    for t in transactions:
        tags_str = ",".join(t.tags) if t.tags else ""
        writer.writerow([
            str(t.date),
            t.type.value if hasattr(t.type, "value") else str(t.type),
            str(t.amount),
            t.currency,
            cat_map.get(t.category_id, ""),
            t.merchant or "",
            t.source_type.value if hasattr(t.source_type, "value") else str(t.source_type),
            t.note or "",
            tags_str,
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=transactions.csv"},
    )


@router.get("", response_model=List[TransactionResponse])
async def list_transactions(
    db: AsyncSession = Depends(get_db),
    category_id: Optional[uuid.UUID] = Query(None),
    source_type: Optional[str] = Query(None),
    source_id: Optional[uuid.UUID] = Query(None),
    type: Optional[str] = Query(None),
    date_from: Optional[date_type] = Query(None),
    date_to: Optional[date_type] = Query(None),
    search: Optional[str] = Query(None),
    sort: str = Query("newest"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
):
    q = _build_query(
        category_id=category_id,
        source_type=source_type,
        source_id=source_id,
        type=type,
        date_from=date_from,
        date_to=date_to,
        search=search,
        sort=sort,
    )
    q = q.offset(skip).limit(limit)
    result = await db.execute(q)
    return result.scalars().all()


@router.post("", response_model=TransactionResponse, status_code=201)
async def create_transaction(
    data: TransactionCreate, db: AsyncSession = Depends(get_db)
):
    return await transaction_service.create_transaction(db, data)


@router.post("/quick", response_model=TransactionResponse, status_code=201)
async def create_quick_transaction(
    data: QuickTransactionCreate, db: AsyncSession = Depends(get_db)
):
    return await transaction_service.create_quick_transaction(db, data)


@router.get("/{txn_id}", response_model=TransactionResponse)
async def get_transaction(txn_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Transaction).where(Transaction.id == txn_id))
    txn = result.scalar_one_or_none()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return txn


@router.put("/{txn_id}", response_model=TransactionResponse)
async def update_transaction(
    txn_id: uuid.UUID, data: TransactionUpdate, db: AsyncSession = Depends(get_db)
):
    return await transaction_service.update_transaction(db, txn_id, data)


@router.delete("/{txn_id}")
async def delete_transaction(txn_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    await transaction_service.delete_transaction(db, txn_id)
    return {"ok": True}
