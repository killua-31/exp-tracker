from __future__ import annotations

import uuid
from typing import Optional

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.account import Account
from app.models.credit_card import CreditCard
from app.models.transaction import Transaction, TransactionType, SourceType
from app.schemas.transaction import (
    TransactionCreate,
    TransactionUpdate,
    QuickTransactionCreate,
)


async def _get_account(db: AsyncSession, account_id: uuid.UUID) -> Account:
    result = await db.execute(select(Account).where(Account.id == account_id))
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    return account


async def _get_credit_card(db: AsyncSession, card_id: uuid.UUID) -> CreditCard:
    result = await db.execute(select(CreditCard).where(CreditCard.id == card_id))
    card = result.scalar_one_or_none()
    if not card:
        raise HTTPException(status_code=404, detail="Credit card not found")
    return card


async def _get_source(
    db: AsyncSession, source_type: str, source_id: uuid.UUID
):
    if source_type == SourceType.account or source_type == "account":
        return await _get_account(db, source_id)
    else:
        return await _get_credit_card(db, source_id)


async def apply_balance_change(db: AsyncSession, transaction: Transaction) -> None:
    """Apply the financial effect of a transaction to the relevant accounts/cards."""
    txn_type = transaction.type
    amount = float(transaction.amount)

    if txn_type == TransactionType.expense:
        if transaction.source_type == SourceType.account:
            # Expense from account: DECREASE account balance
            source = await _get_account(db, transaction.source_id)
            source.balance = float(source.balance) - amount
        elif transaction.source_type == SourceType.credit_card:
            # Expense from credit card: INCREASE outstanding_balance
            source = await _get_credit_card(db, transaction.source_id)
            source.outstanding_balance = float(source.outstanding_balance) + amount

    elif txn_type == TransactionType.income:
        if transaction.source_type == SourceType.account:
            # Income to account: INCREASE account balance
            source = await _get_account(db, transaction.source_id)
            source.balance = float(source.balance) + amount

    elif txn_type == TransactionType.transfer:
        # Transfer: DECREASE source account, INCREASE destination account
        source = await _get_account(db, transaction.source_id)
        source.balance = float(source.balance) - amount
        dest = await _get_account(db, transaction.destination_id)
        dest.balance = float(dest.balance) + amount

    elif txn_type == TransactionType.card_payment:
        # Card payment: DECREASE account balance, DECREASE card outstanding_balance
        source = await _get_account(db, transaction.source_id)
        source.balance = float(source.balance) - amount
        dest = await _get_credit_card(db, transaction.destination_id)
        dest.outstanding_balance = float(dest.outstanding_balance) - amount


async def reverse_balance_change(db: AsyncSession, transaction: Transaction) -> None:
    """Reverse the financial effect of a transaction (exact opposite of apply)."""
    txn_type = transaction.type
    amount = float(transaction.amount)

    if txn_type == TransactionType.expense:
        if transaction.source_type == SourceType.account:
            source = await _get_account(db, transaction.source_id)
            source.balance = float(source.balance) + amount
        elif transaction.source_type == SourceType.credit_card:
            source = await _get_credit_card(db, transaction.source_id)
            source.outstanding_balance = float(source.outstanding_balance) - amount

    elif txn_type == TransactionType.income:
        if transaction.source_type == SourceType.account:
            source = await _get_account(db, transaction.source_id)
            source.balance = float(source.balance) - amount

    elif txn_type == TransactionType.transfer:
        source = await _get_account(db, transaction.source_id)
        source.balance = float(source.balance) + amount
        dest = await _get_account(db, transaction.destination_id)
        dest.balance = float(dest.balance) - amount

    elif txn_type == TransactionType.card_payment:
        source = await _get_account(db, transaction.source_id)
        source.balance = float(source.balance) + amount
        dest = await _get_credit_card(db, transaction.destination_id)
        dest.outstanding_balance = float(dest.outstanding_balance) + amount


async def create_transaction(
    db: AsyncSession, data: TransactionCreate
) -> Transaction:
    # 1. Validate source exists
    await _get_source(db, data.source_type, data.source_id)

    # 2. Validate destination for transfer/card_payment
    if data.type in ("transfer", "card_payment"):
        if not data.destination_id:
            raise HTTPException(
                status_code=400, detail="destination_id is required for this type"
            )
        if data.type == "transfer":
            await _get_account(db, data.destination_id)
        elif data.type == "card_payment":
            await _get_credit_card(db, data.destination_id)

    # 3. Create Transaction row
    txn = Transaction(**data.model_dump())
    db.add(txn)

    # 4. Apply balance change
    await apply_balance_change(db, txn)

    # 5. Commit and refresh
    await db.commit()
    await db.refresh(txn)

    # 6. Return
    return txn


async def update_transaction(
    db: AsyncSession, txn_id: uuid.UUID, data: TransactionUpdate
) -> Transaction:
    # 1. Get existing
    result = await db.execute(select(Transaction).where(Transaction.id == txn_id))
    txn = result.scalar_one_or_none()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")

    # 2. Reverse old balance effect
    await reverse_balance_change(db, txn)

    # 3. Update fields
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(txn, key, value)

    # 4. Apply new balance effect
    await apply_balance_change(db, txn)

    # 5. Commit and refresh
    await db.commit()
    await db.refresh(txn)
    return txn


async def delete_transaction(db: AsyncSession, txn_id: uuid.UUID) -> None:
    # 1. Get transaction
    result = await db.execute(select(Transaction).where(Transaction.id == txn_id))
    txn = result.scalar_one_or_none()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")

    # 2. Reverse balance effect
    await reverse_balance_change(db, txn)

    # 3. Delete
    await db.delete(txn)

    # 4. Commit
    await db.commit()


async def process_recurring_transactions(db: AsyncSession) -> list:
    """Find all recurring transactions due for execution and create new instances."""
    from datetime import date as date_type, timedelta
    from dateutil.relativedelta import relativedelta

    today = date_type.today()

    # Get all recurring transactions
    result = await db.execute(
        select(Transaction).where(
            Transaction.is_recurring == True,
            Transaction.recurring_rule.isnot(None),
        )
    )
    recurring = result.scalars().all()

    created = []
    for txn in recurring:
        rule = txn.recurring_rule or {}
        frequency = rule.get("frequency", "monthly")
        last_date = txn.date

        # Calculate next due date from the original transaction date
        if frequency == "weekly":
            delta = timedelta(weeks=1)
        elif frequency == "monthly":
            delta = relativedelta(months=1)
        elif frequency == "yearly":
            delta = relativedelta(years=1)
        else:
            continue

        next_date = last_date + delta if frequency == "weekly" else last_date + delta

        # Create transactions for all missed dates up to today
        while next_date <= today:
            # Check if this date already has a matching transaction
            check = await db.execute(
                select(Transaction).where(
                    Transaction.category_id == txn.category_id,
                    Transaction.source_id == txn.source_id,
                    Transaction.amount == txn.amount,
                    Transaction.date == next_date,
                    Transaction.type == txn.type,
                    Transaction.is_recurring == False,
                )
            )
            existing = check.scalar_one_or_none()

            if not existing:
                new_data = TransactionCreate(
                    type=txn.type,
                    amount=float(txn.amount),
                    currency=txn.currency,
                    category_id=txn.category_id,
                    source_type=txn.source_type,
                    source_id=txn.source_id,
                    destination_type=txn.destination_type,
                    destination_id=txn.destination_id,
                    merchant=txn.merchant,
                    note=f"[Recurring] {txn.note or ''}".strip(),
                    tags=txn.tags or [],
                    date=next_date,
                    is_recurring=False,
                    recurring_rule=None,
                )
                new_txn = await create_transaction(db, new_data)
                created.append({
                    "id": str(new_txn.id),
                    "type": new_txn.type.value if hasattr(new_txn.type, 'value') else new_txn.type,
                    "amount": float(new_txn.amount),
                    "date": str(new_txn.date),
                    "merchant": new_txn.merchant,
                })

            if frequency == "weekly":
                next_date = next_date + delta
            else:
                next_date = next_date + delta

    return created


async def create_quick_transaction(
    db: AsyncSession, data: QuickTransactionCreate
) -> Transaction:
    full_data = TransactionCreate(
        type=data.type,
        amount=data.amount,
        currency="CAD",
        category_id=data.category_id,
        source_type=data.source_type,
        source_id=data.source_id,
        destination_type=None,
        destination_id=None,
        merchant=data.merchant,
        note=data.note,
        tags=[],
        date=data.date,
        is_recurring=False,
        recurring_rule=None,
    )
    return await create_transaction(db, full_data)
