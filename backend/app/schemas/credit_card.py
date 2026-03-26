from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict


class CreditCardCreate(BaseModel):
    name: str
    issuer: Optional[str] = None
    network: Optional[str] = None
    credit_limit: Decimal
    outstanding_balance: Decimal = Decimal("0")
    currency: str = "CAD"
    statement_day: Optional[int] = None
    due_day: Optional[int] = None
    icon: str = "credit-card"
    color: str = "#8B5CF6"


class CreditCardUpdate(BaseModel):
    name: Optional[str] = None
    issuer: Optional[str] = None
    network: Optional[str] = None
    credit_limit: Optional[Decimal] = None
    outstanding_balance: Optional[Decimal] = None
    currency: Optional[str] = None
    statement_day: Optional[int] = None
    due_day: Optional[int] = None
    icon: Optional[str] = None
    color: Optional[str] = None


class CreditCardResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    issuer: Optional[str]
    network: Optional[str]
    credit_limit: Decimal
    outstanding_balance: Decimal
    currency: str
    statement_day: Optional[int]
    due_day: Optional[int]
    icon: str
    color: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
