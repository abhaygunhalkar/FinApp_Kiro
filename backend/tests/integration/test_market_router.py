"""Integration tests for the market router endpoints."""

from collections.abc import Generator
from datetime import date
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.database import get_db
from app.main import app
from app.schemas.market import MarketQuote, PricePoint


@pytest.fixture()
def test_client(db_session: Session) -> Generator[TestClient, None, None]:
    """Provide a synchronous test client with the test DB session injected."""

    def _override_get_db() -> Generator[Session, None, None]:
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as tc:
        yield tc
    app.dependency_overrides.clear()


def test_get_quote_success(test_client: TestClient) -> None:
    """GET /api/market/quote/{ticker} returns quote data on success."""
    mock_quote = MarketQuote(
        ticker="AAPL",
        current_price=150.25,
        previous_close=148.50,
        daily_change=1.75,
        daily_change_pct=1.18,
        week_52_high=180.0,
        week_52_low=120.0,
        market_cap=2500000000000,
        pe_ratio=28.5,
        dividend_yield=0.006,
        analyst_rating="buy",
    )

    with patch(
        "app.routers.market.MarketDataService.fetch_quote",
        return_value=mock_quote,
    ):
        response = test_client.get("/api/market/quote/AAPL")

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["error"] is None
    assert body["data"]["ticker"] == "AAPL"
    assert body["data"]["current_price"] == 150.25
    assert body["data"]["daily_change"] == 1.75


def test_get_quote_not_available_returns_404(test_client: TestClient) -> None:
    """GET /api/market/quote/{ticker} returns 404 when quote unavailable."""
    with (
        patch(
            "app.routers.market.MarketDataService.fetch_quote",
            return_value=None,
        ),
        patch(
            "app.routers.market.MarketDataService.get_cached_price",
            return_value=None,
        ),
    ):
        response = test_client.get("/api/market/quote/INVALID")

    assert response.status_code == 404
    body = response.json()
    assert body["success"] is False
    assert body["data"] is None
    assert body["error"] == "Quote not available for ticker INVALID"


def test_get_quote_falls_back_to_cached_price(test_client: TestClient) -> None:
    """GET /api/market/quote/{ticker} returns cached price when fetch fails."""
    with (
        patch(
            "app.routers.market.MarketDataService.fetch_quote",
            return_value=None,
        ),
        patch(
            "app.routers.market.MarketDataService.get_cached_price",
            return_value=145.50,
        ),
    ):
        response = test_client.get("/api/market/quote/AAPL")

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["data"]["ticker"] == "AAPL"
    assert body["data"]["current_price"] == 145.50
    assert body["data"]["cached"] is True


def test_get_history_success(test_client: TestClient) -> None:
    """GET /api/market/history/{ticker} returns price history."""
    mock_history = [
        PricePoint(
            date=date(2024, 1, 1),
            open=100.0,
            close=101.0,
            high=102.0,
            low=99.0,
            volume=1000000,
        ),
        PricePoint(
            date=date(2024, 1, 2),
            open=101.0,
            close=103.0,
            high=104.0,
            low=100.0,
            volume=1100000,
        ),
    ]

    with patch(
        "app.routers.market.MarketDataService.fetch_history",
        return_value=mock_history,
    ) as mock_fetch:
        response = test_client.get("/api/market/history/AAPL")

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["error"] is None
    assert len(body["data"]) == 2
    assert body["data"][0]["date"] == "2024-01-01"
    assert body["data"][0]["close"] == 101.0
    mock_fetch.assert_called_once_with("AAPL", "30d")


def test_get_history_custom_period(test_client: TestClient) -> None:
    """GET /api/market/history/{ticker}?period=7d uses custom period."""
    with patch(
        "app.routers.market.MarketDataService.fetch_history",
        return_value=[],
    ) as mock_fetch:
        response = test_client.get("/api/market/history/AAPL?period=7d")

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["data"] == []
    mock_fetch.assert_called_once_with("AAPL", "7d")


def test_get_history_empty_result(test_client: TestClient) -> None:
    """GET /api/market/history/{ticker} returns empty list when no data."""
    with patch(
        "app.routers.market.MarketDataService.fetch_history",
        return_value=[],
    ):
        response = test_client.get("/api/market/history/UNKNOWN?period=1y")

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["data"] == []
    assert body["error"] is None
