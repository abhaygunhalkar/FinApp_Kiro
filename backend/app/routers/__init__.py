"""FastAPI router modules."""

from app.routers import dashboard, holdings, market, transactions, watchlist

__all__ = [
    "dashboard",
    "holdings",
    "market",
    "transactions",
    "watchlist",
]
