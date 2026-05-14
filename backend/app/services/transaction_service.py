"""Service layer for transaction business logic."""

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.holding import Holding
from app.models.transaction import Transaction
from app.repositories.cash_balance_repository import CashBalanceRepository
from app.repositories.holdings_repository import HoldingsRepository
from app.repositories.transaction_repository import TransactionRepository
from app.schemas.transaction import TransactionCreate, TransactionResponse


class TransactionService:
    """Business logic for transaction operations including buy/sell processing."""

    @staticmethod
    def get_transactions(db: Session, holding_id: int) -> list[TransactionResponse]:
        """Retrieve all transactions for a holding ordered by date descending.

        Raises HTTPException 404 if the holding does not exist.
        """
        holding = HoldingsRepository.get_by_id(db, holding_id)
        if holding is None:
            raise HTTPException(status_code=404, detail="Holding not found")

        transactions = TransactionRepository.get_by_holding(db, holding_id)
        return [TransactionResponse.model_validate(t) for t in transactions]

    @staticmethod
    def create_transaction(
        db: Session, data: TransactionCreate
    ) -> TransactionResponse:
        """Create a buy or sell transaction and update the holding accordingly.

        Buy logic:
        - If no holding exists for the ticker, create a new one.
        - Recalculate weighted average buy price.
        - Increase holding quantity.
        - Decrease cash balance by (price × quantity + fees).

        Sell logic:
        - Reject if sell quantity > holding quantity (HTTPException 422).
        - Calculate realized gain = (sell_price - average_buy_price) × quantity.
        - Decrease holding quantity.
        - Increase cash balance by (price × quantity - fees).
        - If quantity becomes 0, remove the holding.
        """
        if data.transaction_type == "buy":
            return TransactionService._process_buy(db, data)
        else:
            return TransactionService._process_sell(db, data)

    @staticmethod
    def delete_transaction(db: Session, transaction_id: int) -> None:
        """Delete a transaction and recalculate the holding.

        - Remove the transaction record.
        - Replay all remaining buy transactions in chronological order
          to recalculate holding's average_buy_price and quantity.
        - If no transactions remain, delete the holding.
        - Adjust cash balance accordingly.
        """
        transaction = TransactionRepository.get_by_id(db, transaction_id)
        if transaction is None:
            raise HTTPException(status_code=404, detail="Transaction not found")

        holding_id = transaction.holding_id
        transaction_type = transaction.transaction_type
        quantity = transaction.quantity
        price = transaction.price
        fees = transaction.fees

        # Reverse the cash balance effect of the deleted transaction
        cash_balance = CashBalanceRepository.get_balance(db)
        if transaction_type == "buy":
            # Buy decreased cash, so we add back
            new_balance = cash_balance.balance + (price * quantity + fees)
        else:
            # Sell increased cash, so we subtract back
            new_balance = cash_balance.balance - (price * quantity - fees)
        CashBalanceRepository.update_balance(db, new_balance)

        # Delete the transaction
        TransactionRepository.delete(db, transaction_id)

        # Recalculate the holding from remaining transactions
        TransactionService._recalculate_holding(db, holding_id)

    @staticmethod
    def _recalculate_holding(db: Session, holding_id: int) -> None:
        """Recalculate holding by replaying all remaining transactions.

        Replays buy transactions in chronological order to compute
        average_buy_price and quantity. Sell transactions reduce quantity.
        If no transactions remain, delete the holding.
        """
        remaining = TransactionRepository.get_by_holding(db, holding_id)

        if not remaining:
            # No transactions left, delete the holding
            HoldingsRepository.delete(db, holding_id)
            return

        # Sort by transaction_date ascending for replay
        sorted_transactions = sorted(remaining, key=lambda t: t.transaction_date)

        # Replay to compute new average and quantity
        total_quantity = 0.0
        total_cost = 0.0

        for txn in sorted_transactions:
            if txn.transaction_type == "buy":
                total_cost += txn.price * txn.quantity
                total_quantity += txn.quantity
            elif txn.transaction_type == "sell":
                total_quantity -= txn.quantity
                # Sell doesn't change total_cost for average calculation
                # We reduce cost proportionally based on average at that point
                if total_quantity > 0:
                    avg_at_point = total_cost / (total_quantity + txn.quantity)
                    total_cost -= avg_at_point * txn.quantity
                else:
                    total_cost = 0.0

        holding = HoldingsRepository.get_by_id(db, holding_id)
        if holding is None:
            return

        if total_quantity <= 0:
            # All shares sold, remove holding
            HoldingsRepository.delete(db, holding_id)
        else:
            holding.quantity = total_quantity
            holding.average_buy_price = total_cost / total_quantity
            HoldingsRepository.update(db, holding)

    @staticmethod
    def _process_buy(db: Session, data: TransactionCreate) -> TransactionResponse:
        """Process a buy transaction."""
        holding = HoldingsRepository.get_by_ticker(db, data.ticker)

        if holding is None:
            # Create a new holding for this ticker
            holding = Holding(
                ticker=data.ticker,
                quantity=data.quantity,
                average_buy_price=data.price,
                current_price=data.price,
            )
            holding = HoldingsRepository.create(db, holding)
        else:
            # Recalculate weighted average
            old_avg = holding.average_buy_price
            old_qty = holding.quantity
            new_avg = ((old_avg * old_qty) + (data.price * data.quantity)) / (
                old_qty + data.quantity
            )
            holding.quantity = old_qty + data.quantity
            holding.average_buy_price = new_avg
            HoldingsRepository.update(db, holding)

        # Create the transaction record
        transaction = Transaction(
            holding_id=holding.id,
            ticker=data.ticker,
            transaction_type="buy",
            quantity=data.quantity,
            price=data.price,
            fees=data.fees,
            transaction_date=data.transaction_date,
            broker=data.broker,
            notes=data.notes,
        )
        transaction = TransactionRepository.create(db, transaction)

        # Decrease cash balance by (price × quantity + fees)
        cash_balance = CashBalanceRepository.get_balance(db)
        new_balance = cash_balance.balance - (data.price * data.quantity + data.fees)
        CashBalanceRepository.update_balance(db, new_balance)

        return TransactionResponse.model_validate(transaction)

    @staticmethod
    def _process_sell(db: Session, data: TransactionCreate) -> TransactionResponse:
        """Process a sell transaction."""
        holding = HoldingsRepository.get_by_ticker(db, data.ticker)

        if holding is None:
            raise HTTPException(
                status_code=422,
                detail=f"No holding found for ticker '{data.ticker}'",
            )

        # Reject if sell quantity > holding quantity
        if data.quantity > holding.quantity:
            raise HTTPException(
                status_code=422,
                detail=(
                    "Insufficient shares: cannot sell more"
                    " than current holding quantity"
                ),
            )

        # Update holding quantity
        new_quantity = holding.quantity - data.quantity

        if new_quantity == 0:
            # Create transaction first, then delete holding
            transaction = Transaction(
                holding_id=holding.id,
                ticker=data.ticker,
                transaction_type="sell",
                quantity=data.quantity,
                price=data.price,
                fees=data.fees,
                transaction_date=data.transaction_date,
                broker=data.broker,
                notes=data.notes,
            )
            transaction = TransactionRepository.create(db, transaction)

            # Increase cash balance by (price × quantity - fees)
            cash_balance = CashBalanceRepository.get_balance(db)
            new_balance = cash_balance.balance + (
                data.price * data.quantity - data.fees
            )
            CashBalanceRepository.update_balance(db, new_balance)

            # Remove the holding since quantity is 0
            HoldingsRepository.delete(db, holding.id)

            return TransactionResponse.model_validate(transaction)
        else:
            holding.quantity = new_quantity
            HoldingsRepository.update(db, holding)

            # Create the transaction record
            transaction = Transaction(
                holding_id=holding.id,
                ticker=data.ticker,
                transaction_type="sell",
                quantity=data.quantity,
                price=data.price,
                fees=data.fees,
                transaction_date=data.transaction_date,
                broker=data.broker,
                notes=data.notes,
            )
            transaction = TransactionRepository.create(db, transaction)

            # Increase cash balance by (price × quantity - fees)
            cash_balance = CashBalanceRepository.get_balance(db)
            new_balance = cash_balance.balance + (
                data.price * data.quantity - data.fees
            )
            CashBalanceRepository.update_balance(db, new_balance)

            return TransactionResponse.model_validate(transaction)
