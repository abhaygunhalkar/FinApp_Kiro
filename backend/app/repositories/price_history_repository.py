"""Repository for PriceHistory queries and cleanup operations."""

from datetime import date, timedelta

from sqlalchemy.orm import Session

from app.models.price_history import PriceHistory


class PriceHistoryRepository:
    """Data access layer for price history records."""

    @staticmethod
    def get_history(db: Session, ticker: str, days: int) -> list[PriceHistory]:
        """Retrieve price history for a ticker within the last N days.

        Returns records ordered by date ascending.
        """
        cutoff_date = date.today() - timedelta(days=days)
        return list(
            db.query(PriceHistory)
            .filter(
                PriceHistory.ticker == ticker,
                PriceHistory.date >= cutoff_date,
            )
            .order_by(PriceHistory.date.asc())
            .all()
        )

    @staticmethod
    def store_prices(db: Session, prices: list[PriceHistory]) -> None:
        """Store a batch of price history records.

        Uses merge to handle upserts for existing ticker+date combinations.
        """
        try:
            for price in prices:
                db.merge(price)
            db.commit()
        except Exception:
            db.rollback()
            raise

    @staticmethod
    def delete_older_than(db: Session, days: int) -> int:
        """Delete price history records older than N days.

        Returns the number of records deleted.
        """
        try:
            cutoff_date = date.today() - timedelta(days=days)
            count = (
                db.query(PriceHistory).filter(PriceHistory.date < cutoff_date).delete()
            )
            db.commit()
            return count
        except Exception:
            db.rollback()
            raise
