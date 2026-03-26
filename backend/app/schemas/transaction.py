import uuid
from datetime import date as date_type
from datetime import datetime
from decimal import Decimal
from typing import Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


class TransactionCreate(BaseModel):
    type: str  # "expense" | "income" | "transfer" | "card_payment"
    amount: Decimal = Field(gt=0)
    currency: str = "CAD"
    category_id: Optional[uuid.UUID] = None
    source_type: str  # "account" | "credit_card"
    source_id: uuid.UUID
    destination_type: Optional[str] = None
    destination_id: Optional[uuid.UUID] = None
    merchant: Optional[str] = None
    note: Optional[str] = None
    tags: List[str] = []
    date: date_type
    is_recurring: bool = False
    recurring_rule: Optional[dict] = None


class TransactionUpdate(BaseModel):
    type: Optional[str] = None
    amount: Optional[Decimal] = Field(default=None, gt=0)
    currency: Optional[str] = None
    category_id: Optional[uuid.UUID] = None
    source_type: Optional[str] = None
    source_id: Optional[uuid.UUID] = None
    destination_type: Optional[str] = None
    destination_id: Optional[uuid.UUID] = None
    merchant: Optional[str] = None
    note: Optional[str] = None
    tags: Optional[List[str]] = None
    date: Optional[date_type] = None
    is_recurring: Optional[bool] = None
    recurring_rule: Optional[dict] = None


class TransactionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    type: str
    amount: Decimal
    currency: str
    category_id: Optional[uuid.UUID]
    source_type: str
    source_id: uuid.UUID
    destination_type: Optional[str]
    destination_id: Optional[uuid.UUID]
    merchant: Optional[str]
    note: Optional[str]
    tags: List[str]
    date: date_type
    is_recurring: bool
    recurring_rule: Optional[dict]
    created_at: datetime
    updated_at: datetime


class QuickTransactionCreate(BaseModel):
    amount: Decimal = Field(gt=0)
    category_id: uuid.UUID
    source_type: str  # "account" | "credit_card"
    source_id: uuid.UUID
    type: str = "expense"
    merchant: Optional[str] = None
    date: date_type = Field(default_factory=date_type.today)
    note: Optional[str] = None
