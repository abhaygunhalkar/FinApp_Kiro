"""Pydantic schemas for market data responses."""

from datetime import date

from pydantic import BaseModel


class MarketQuote(BaseModel):
    """Schema for a real-time market quote."""

    ticker: str
    current_price: float
    previous_close: float
    daily_change: float
    daily_change_pct: float
    week_52_high: float
    week_52_low: float
    market_cap: float | None
    pe_ratio: float | None
    dividend_yield: float
    analyst_rating: str | None


class PricePoint(BaseModel):
    """Schema for a historical price data point."""

    date: date
    open: float
    close: float
    high: float
    low: float
    volume: float
