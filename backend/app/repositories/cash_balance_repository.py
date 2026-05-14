"""Repository for CashBalance read and update operations."""

from sqlalchemy.orm import Session

from app.models.cash_balance import CashBalance


class CashBalanceRepository:
    """Data access layer for cash balance."""

    @staticmethod
    def get_balance(db: Session) -> CashBalance:
        """Retrieve the cash balance record.

        Creates a default record with balance=0 if none exists.
        """
        balance = db.query(CashBalance).first()
        if balance is None:
            balance = CashBalance(balance=0.0)
            db.add(balance)
            db.commit()
            db.refresh(balance)
        return balance

    @staticmethod
    def update_balance(db: Session, amount: float) -> CashBalance:
        """Update the cash balance to the specified amount.

        Creates a default record if none exists, then sets the balance.
        """
        try:
            balance = db.query(CashBalance).first()
            if balance is None:
                balance = CashBalance(balance=amount)
                db.add(balance)
            else:
                balance.balance = amount
            db.commit()
            db.refresh(balance)
            return balance
        except Exception:
            db.rollback()
            raise
