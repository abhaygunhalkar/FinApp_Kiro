"""Service layer for holdings business logic and portfolio metrics."""

from datetime import date

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.holding import Holding
from app.models.transaction import Transaction
from app.repositories.cash_balance_repository import CashBalanceRepository
from app.repositories.holdings_repository import HoldingsRepository
from app.schemas.holding import HoldingCreate, HoldingResponse, HoldingUpdate


class HoldingsService:
    """Business logic for holdings CRUD and portfolio metric calculations."""

    @staticmethod
    def _calculate_total_portfolio_value(db: Session) -> float:
        """Calculate the total portfolio value across all holdings."""
        holdings = HoldingsRepository.get_all(db)
        return sum(h.current_price * h.quantity for h in holdings)

    @staticmethod
    def _build_holding_response(
        holding: Holding, total_portfolio_value: float
    ) -> HoldingResponse:
        """Build a HoldingResponse with all calculated fields."""
        total_invested = holding.average_buy_price * holding.quantity
        current_value = holding.current_price * holding.quantity
        unrealized_gain = (
            holding.current_price - holding.average_buy_price
        ) * holding.quantity

        if holding.average_buy_price > 0:
            unrealized_gain_pct = round(
                (
                    (holding.current_price - holding.average_buy_price)
                    / holding.average_buy_price
                )
                * 100,
                2,
            )
        else:
            unrealized_gain_pct = 0.0

        if total_portfolio_value > 0:
            allocation_pct = round(
                (current_value / total_portfolio_value) * 100, 2
            )
        else:
            allocation_pct = 0.0

        # annual_dividend_income = dividend_per_share * quantity
        # We use dividend_yield (stored as decimal, e.g. 0.05 = 5%) only as display.
        # The actual income is: dividend_yield * current_price * quantity
        # But dividend_yield from yfinance can be inflated for some ETFs.
        # Better approach: use the stored dividend_yield as the per-share rate
        # if it's reasonable (< 0.20 = 20%), otherwise cap it.
        dividend_yield = holding.dividend_yield if holding.dividend_yield else 0.0

        # Cap dividend yield at 20% to avoid unrealistic values from yfinance
        # (some ETFs report return-of-capital as dividends, inflating the yield)
        capped_yield = min(dividend_yield, 0.20)
        annual_dividend_income = round(capped_yield * holding.current_price * holding.quantity, 2)

        return HoldingResponse(
            id=holding.id,
            ticker=holding.ticker,
            company_name=holding.company_name,
            quantity=holding.quantity,
            average_buy_price=holding.average_buy_price,
            current_price=holding.current_price,
            total_invested=total_invested,
            current_value=current_value,
            unrealized_gain=unrealized_gain,
            unrealized_gain_pct=unrealized_gain_pct,
            allocation_pct=allocation_pct,
            sector=holding.sector,
            industry=holding.industry,
            dividend_yield=dividend_yield,
            annual_dividend_income=annual_dividend_income,
            broker=holding.broker,
            created_at=holding.created_at,
            updated_at=holding.updated_at,
        )

    @staticmethod
    def get_all_holdings(db: Session) -> list[HoldingResponse]:
        """Retrieve all holdings with calculated metrics.

        Returns a list of HoldingResponse objects with unrealized gain,
        allocation percentage, and annual dividend income computed.
        """
        holdings = HoldingsRepository.get_all(db)
        total_portfolio_value = sum(
            h.current_price * h.quantity for h in holdings
        )

        return [
            HoldingsService._build_holding_response(h, total_portfolio_value)
            for h in holdings
        ]

    @staticmethod
    def get_holding(db: Session, holding_id: int) -> HoldingResponse:
        """Retrieve a single holding by ID with calculated metrics.

        Raises HTTPException 404 if the holding does not exist.
        """
        holding = HoldingsRepository.get_by_id(db, holding_id)
        if holding is None:
            raise HTTPException(status_code=404, detail="Holding not found")

        total_portfolio_value = HoldingsService._calculate_total_portfolio_value(db)
        return HoldingsService._build_holding_response(holding, total_portfolio_value)

    @staticmethod
    def create_holding(db: Session, data: HoldingCreate) -> HoldingResponse:
        """Create a new holding with an initial buy transaction.

        Steps:
        1. Check if ticker already exists (reject with error if so)
        2. Fetch current market price from yfinance
        3. Create Holding record
        4. Create initial Transaction record (type="buy", quantity and price
           from input, date=today)
        5. Decrease cash balance by (quantity × buy_price)

        Raises HTTPException 400 if ticker already exists.
        """
        from app.services.market_data_service import MarketDataService

        # Check for duplicate ticker
        existing = HoldingsRepository.get_by_ticker(db, data.ticker)
        if existing is not None:
            raise HTTPException(
                status_code=400,
                detail=f"A holding for ticker '{data.ticker}' already exists",
            )

        # Fetch current market price
        current_price = data.buy_price  # fallback to buy price
        dividend_yield = 0.0
        quote = MarketDataService.fetch_quote(data.ticker)
        if quote is not None:
            current_price = quote.current_price
            # Cap dividend yield at 20% — yfinance can report inflated yields
            # for ETFs that include return-of-capital distributions
            raw_yield = quote.dividend_yield or 0.0
            dividend_yield = min(raw_yield, 0.20)

        # Create the holding record
        holding = Holding(
            ticker=data.ticker,
            company_name=data.company_name,
            quantity=data.quantity,
            average_buy_price=data.buy_price,
            current_price=current_price,
            sector=data.sector,
            industry=data.industry,
            dividend_yield=dividend_yield,
            broker=data.broker,
            notes=data.notes,
        )
        holding = HoldingsRepository.create(db, holding)

        # Create initial buy transaction
        transaction = Transaction(
            holding_id=holding.id,
            ticker=data.ticker,
            transaction_type="buy",
            quantity=data.quantity,
            price=data.buy_price,
            fees=0.0,
            transaction_date=date.today(),
        )
        db.add(transaction)

        # Decrease cash balance by (quantity × buy_price)
        cash_balance = CashBalanceRepository.get_balance(db)
        new_balance = cash_balance.balance - (data.quantity * data.buy_price)
        CashBalanceRepository.update_balance(db, new_balance)

        # Refresh holding to get updated timestamps
        db.refresh(holding)

        total_portfolio_value = HoldingsService._calculate_total_portfolio_value(db)
        return HoldingsService._build_holding_response(holding, total_portfolio_value)

    @staticmethod
    def update_holding(
        db: Session, holding_id: int, data: HoldingUpdate
    ) -> HoldingResponse:
        """Update editable fields of a holding.

        Only company_name, sector, industry, and notes are editable.
        Raises HTTPException 404 if the holding does not exist.
        """
        holding = HoldingsRepository.get_by_id(db, holding_id)
        if holding is None:
            raise HTTPException(status_code=404, detail="Holding not found")

        # Update only provided fields
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(holding, field, value)

        holding = HoldingsRepository.update(db, holding)

        total_portfolio_value = HoldingsService._calculate_total_portfolio_value(db)
        return HoldingsService._build_holding_response(holding, total_portfolio_value)

    @staticmethod
    def delete_holding(db: Session, holding_id: int) -> None:
        """Delete a holding and return invested amount to cash balance.

        Steps:
        1. Get holding (raise 404 if not found)
        2. Increase cash balance by (quantity × average_buy_price)
        3. Delete holding (cascade deletes transactions)
        """
        holding = HoldingsRepository.get_by_id(db, holding_id)
        if holding is None:
            raise HTTPException(status_code=404, detail="Holding not found")

        # Return invested amount to cash balance
        return_amount = holding.quantity * holding.average_buy_price
        cash_balance = CashBalanceRepository.get_balance(db)
        new_balance = cash_balance.balance + return_amount
        CashBalanceRepository.update_balance(db, new_balance)

        # Delete holding (cascade deletes transactions)
        HoldingsRepository.delete(db, holding_id)
