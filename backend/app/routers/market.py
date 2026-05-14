"""Market data API router."""

from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.market_data_service import MarketDataService

router = APIRouter(prefix="/api/market", tags=["market"])


@router.get("/brokers")
def get_brokers() -> JSONResponse:
    """Return the list of configured brokers."""
    from app.config import get_settings
    settings = get_settings()
    return JSONResponse(
        status_code=200,
        content={
            "success": True,
            "data": settings.broker_list,
            "error": None,
        },
    )


@router.post("/refresh")
def refresh_prices(db: Session = Depends(get_db)) -> JSONResponse:
    """Manually trigger a market data refresh for all holdings and watchlist items.

    Fetches current prices from yfinance and updates the database.
    """
    result = MarketDataService.refresh_all_prices(db)
    return JSONResponse(
        status_code=200,
        content={
            "success": True,
            "data": {
                "updated": result.success_count,
                "failed": result.failure_count,
                "tickers_updated": result.tickers_updated,
                "tickers_failed": result.tickers_failed,
            },
            "error": None,
        },
    )


@router.get("/quote/{ticker}")
def get_quote(ticker: str, db: Session = Depends(get_db)) -> JSONResponse:
    """Fetch current market quote for a ticker.

    Returns real-time quote data from yfinance. If the external API
    returns no data, falls back to the most recently cached price.
    Returns 404 if no data is available at all.
    """
    quote = MarketDataService.fetch_quote(ticker)

    if quote is None:
        # Attempt fallback to cached price
        cached_price = MarketDataService.get_cached_price(db, ticker)
        if cached_price is not None:
            return JSONResponse(
                status_code=200,
                content={
                    "success": True,
                    "data": {
                        "ticker": ticker,
                        "current_price": cached_price,
                        "cached": True,
                    },
                    "error": None,
                },
            )
        return JSONResponse(
            status_code=404,
            content={
                "success": False,
                "data": None,
                "error": f"Quote not available for ticker {ticker}",
            },
        )

    return JSONResponse(
        status_code=200,
        content={
            "success": True,
            "data": quote.model_dump(),
            "error": None,
        },
    )


@router.get("/info/{ticker}")
def get_ticker_info(ticker: str) -> JSONResponse:
    """Fetch company information for a ticker from yfinance.

    Returns company name, sector, industry, and a brief description.
    Used to auto-populate holding fields when adding a new stock.
    """
    import yfinance as yf

    try:
        stock = yf.Ticker(ticker.upper())
        info = stock.info

        company_name = info.get("longName") or info.get("shortName") or None
        sector = info.get("sector") or None
        industry = info.get("industry") or None
        description = info.get("longBusinessSummary") or None

        # Truncate description to first 200 chars for notes
        notes = None
        if description:
            notes = description[:200] + ("..." if len(description) > 200 else "")

        if not company_name:
            return JSONResponse(
                status_code=404,
                content={
                    "success": False,
                    "data": None,
                    "error": f"No company information found for ticker {ticker.upper()}",
                },
            )

        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "data": {
                    "ticker": ticker.upper(),
                    "company_name": company_name,
                    "sector": sector,
                    "industry": industry,
                    "notes": notes,
                },
                "error": None,
            },
        )
    except Exception:
        return JSONResponse(
            status_code=404,
            content={
                "success": False,
                "data": None,
                "error": f"Unable to fetch information for ticker {ticker.upper()}",
            },
        )


@router.get("/history/{ticker}")
def get_history(
    ticker: str, period: str = Query(default="30d")
) -> JSONResponse:
    """Fetch historical price data for a ticker.

    Args:
        ticker: Stock ticker symbol.
        period: Time period - one of "7d", "30d", "90d", "1y". Defaults to "30d".

    Returns:
        List of historical price points.
    """
    history = MarketDataService.fetch_history(ticker, period)

    return JSONResponse(
        status_code=200,
        content={
            "success": True,
            "data": [point.model_dump(mode="json") for point in history],
            "error": None,
        },
    )
