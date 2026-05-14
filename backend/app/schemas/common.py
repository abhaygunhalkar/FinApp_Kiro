"""Common Pydantic schemas shared across the application."""

from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    """Generic API response envelope."""

    success: bool
    data: T | None = None
    error: str | None = None
