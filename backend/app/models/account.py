from __future__ import annotations

import enum
import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, Enum, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class AccountType(str, enum.Enum):
    checking = "checking"
    savings = "savings"
    cash = "cash"
    custom = "custom"


class Account(Base):
    __tablename__ = "accounts"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String, nullable=False)
    type: Mapped[AccountType] = mapped_column(Enum(AccountType), nullable=False)
    balance: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    currency: Mapped[str] = mapped_column(String(3), default="CAD")
    icon: Mapped[str] = mapped_column(String, default="wallet")
    color: Mapped[str] = mapped_column(String, default="#0D9488")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )
