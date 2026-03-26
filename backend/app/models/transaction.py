from __future__ import annotations

import enum
import uuid
from datetime import date, datetime
from typing import Any, Optional

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    JSON,
    Numeric,
    String,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class TransactionType(str, enum.Enum):
    expense = "expense"
    income = "income"
    transfer = "transfer"
    card_payment = "card_payment"


class SourceType(str, enum.Enum):
    account = "account"
    credit_card = "credit_card"


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    type: Mapped[TransactionType] = mapped_column(
        Enum(TransactionType), nullable=False
    )
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="CAD")
    category_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("categories.id"), nullable=True
    )
    source_type: Mapped[SourceType] = mapped_column(
        Enum(SourceType), nullable=False
    )
    source_id: Mapped[uuid.UUID] = mapped_column(nullable=False)
    destination_type: Mapped[Optional[SourceType]] = mapped_column(
        Enum(SourceType), nullable=True
    )
    destination_id: Mapped[Optional[uuid.UUID]] = mapped_column(nullable=True)
    merchant: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    note: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    tags: Mapped[Any] = mapped_column(JSON, default=list)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    is_recurring: Mapped[bool] = mapped_column(Boolean, default=False)
    recurring_rule: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )
