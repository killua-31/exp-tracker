from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class BudgetCreate(BaseModel):
    category_id: Optional[uuid.UUID] = None
    amount: Decimal
    month: int = Field(ge=1, le=12)
    year: int


class BudgetUpdate(BaseModel):
    amount: Optional[Decimal] = None


class BudgetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    category_id: Optional[uuid.UUID]
    amount: Decimal
    month: int
    year: int
    created_at: datetime


class BudgetStatus(BaseModel):
    budget: BudgetResponse
    spent: Decimal
    remaining: Decimal
    percentage: float
