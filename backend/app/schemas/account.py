from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict


class AccountCreate(BaseModel):
    name: str
    type: str  # "checking" | "savings" | "cash" | "custom"
    balance: Decimal
    currency: str = "CAD"
    icon: str = "wallet"
    color: str = "#0D9488"


class AccountUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    balance: Optional[Decimal] = None
    currency: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None


class AccountResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    type: str
    balance: Decimal
    currency: str
    icon: str
    color: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
