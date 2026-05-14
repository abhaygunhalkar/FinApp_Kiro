"""Pydantic schemas for watchlist-related requests and responses."""

from datetime import datetime

from pydantic import BaseModel, Field


class WatchlistCreate(BaseModel):
    """Schema for adding a stock to the watchlist."""

    ticker: str = Field(..., min_length=1, max_length=5, pattern=r"^[A-Z]{1,5}$")
    target_buy_price: float | None = Field(default=None, ge=0.01, le=999999.99)
    priority: int = Field(default=3, ge=1, le=5)
    notes: str | None = Field(default=None, max_length=500)


class WatchlistUpdate(BaseModel):
    """Schema for updating a watchlist item."""

    target_buy_price: float | None = Field(default=None, ge=0.01, le=999999.99)
    priority: int | None = Field(default=None, ge=1, le=5)
    sector: str | None = None
    notes: str | None = Field(default=None, max_length=500)


class WatchlistResponse(BaseModel):
    """Schema for watchlist item response data."""

    id: int
    ticker: str
    company_name: str | None
    current_price: float
    daily_change_pct: float
    week_52_high: float
    week_52_low: float
    target_buy_price: float | None
    analyst_rating: str | None
    pe_ratio: float | None
    market_cap: float | None
    sector: str | None
    notes: str | None
    priority: int
    rsi_daily: float | None = None
    rsi_weekly: float | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
