"""Watchlist API router."""

from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.watchlist import WatchlistCreate, WatchlistUpdate
from app.services.watchlist_service import WatchlistService

router = APIRouter(prefix="/api/watchlist", tags=["watchlist"])


@router.get("")
def get_watchlist(db: Session = Depends(get_db)) -> JSONResponse:
    """Retrieve all watchlist items."""
    items = WatchlistService.get_all_items(db)
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "data": [item.model_dump(mode="json") for item in items],
            "error": None,
        },
    )


@router.post("", status_code=status.HTTP_201_CREATED)
def create_watchlist_item(
    data: WatchlistCreate, db: Session = Depends(get_db)
) -> JSONResponse:
    """Add a new stock to the watchlist."""
    try:
        item = WatchlistService.create_item(db, data)
        return JSONResponse(
            status_code=status.HTTP_201_CREATED,
            content={
                "success": True,
                "data": item.model_dump(mode="json"),
                "error": None,
            },
        )
    except ValueError as e:
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "success": False,
                "data": None,
                "error": str(e),
            },
        )


@router.put("/{item_id}")
def update_watchlist_item(
    item_id: int, data: WatchlistUpdate, db: Session = Depends(get_db)
) -> JSONResponse:
    """Update an existing watchlist item."""
    try:
        item = WatchlistService.update_item(db, item_id, data)
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "success": True,
                "data": item.model_dump(mode="json"),
                "error": None,
            },
        )
    except ValueError as e:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={
                "success": False,
                "data": None,
                "error": str(e),
            },
        )


@router.delete("/{item_id}")
def delete_watchlist_item(
    item_id: int, db: Session = Depends(get_db)
) -> JSONResponse:
    """Remove a stock from the watchlist."""
    try:
        WatchlistService.delete_item(db, item_id)
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "success": True,
                "data": None,
                "error": None,
            },
        )
    except ValueError as e:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={
                "success": False,
                "data": None,
                "error": str(e),
            },
        )
