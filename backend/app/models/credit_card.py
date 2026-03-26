from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, Integer, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class CreditCard(Base):
    __tablename__ = "credit_cards"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String, nullable=False)
    issuer: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    network: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    credit_limit: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    outstanding_balance: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    currency: Mapped[str] = mapped_column(String(3), default="CAD")
    statement_day: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    due_day: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    icon: Mapped[str] = mapped_column(String, default="credit-card")
    color: Mapped[str] = mapped_column(String, default="#8B5CF6")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )
