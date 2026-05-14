"""Pydantic schemas for transaction-related requests and responses."""

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field


class TransactionCreate(BaseModel):
    """Schema for creating a new transaction."""

    ticker: str = Field(..., min_length=1, max_length=5, pattern=r"^[A-Z]{1,5}$")
    transaction_type: Literal["buy", "sell"]
    quantity: float = Field(..., gt=0)
    price: float = Field(..., ge=0.01)
    fees: float = Field(default=0.0, ge=0)
    transaction_date: date
    broker: str | None = None
    notes: str | None = None


class TransactionResponse(BaseModel):
    """Schema for transaction response data."""

    id: int
    holding_id: int | None
    ticker: str
    transaction_type: str
    quantity: float
    price: float
    fees: float
    transaction_date: date
    notes: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
