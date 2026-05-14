"""CashBalance model for tracking available cash in the portfolio."""

from datetime import datetime

from sqlalchemy import DateTime, Float, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class CashBalance(Base):
    """Represents the user's available cash balance."""

    __tablename__ = "cash_balance"

    id: Mapped[int] = mapped_column(primary_key=True)
    balance: Mapped[float] = mapped_column(Float, default=0.0)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=func.now(), onupdate=func.now()
    )
