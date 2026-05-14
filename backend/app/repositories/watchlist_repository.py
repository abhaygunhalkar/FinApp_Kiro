"""Repository for WatchlistItem CRUD operations."""

from sqlalchemy.orm import Session

from app.models.watchlist_item import WatchlistItem


class WatchlistRepository:
    """Data access layer for watchlist items."""

    @staticmethod
    def get_all(db: Session) -> list[WatchlistItem]:
        """Retrieve all watchlist items."""
        return list(db.query(WatchlistItem).all())

    @staticmethod
    def get_by_id(db: Session, item_id: int) -> WatchlistItem | None:
        """Retrieve a watchlist item by its ID."""
        return db.query(WatchlistItem).filter(WatchlistItem.id == item_id).first()

    @staticmethod
    def get_by_ticker(db: Session, ticker: str) -> WatchlistItem | None:
        """Retrieve a watchlist item by its ticker symbol."""
        return db.query(WatchlistItem).filter(WatchlistItem.ticker == ticker).first()

    @staticmethod
    def create(db: Session, item: WatchlistItem) -> WatchlistItem:
        """Create a new watchlist item record."""
        try:
            db.add(item)
            db.commit()
            db.refresh(item)
            return item
        except Exception:
            db.rollback()
            raise

    @staticmethod
    def update(db: Session, item: WatchlistItem) -> WatchlistItem:
        """Update an existing watchlist item record."""
        try:
            db.commit()
            db.refresh(item)
            return item
        except Exception:
            db.rollback()
            raise

    @staticmethod
    def delete(db: Session, item_id: int) -> None:
        """Delete a watchlist item by its ID."""
        try:
            item = db.query(WatchlistItem).filter(WatchlistItem.id == item_id).first()
            if item:
                db.delete(item)
                db.commit()
        except Exception:
            db.rollback()
            raise
