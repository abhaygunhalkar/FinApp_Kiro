"""Holdings API router."""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.common import ApiResponse
from app.schemas.holding import HoldingCreate, HoldingResponse, HoldingUpdate
from app.services.holdings_service import HoldingsService

router = APIRouter(prefix="/api/holdings", tags=["holdings"])


@router.get("", response_model=ApiResponse[list[HoldingResponse]])
def get_holdings(db: Session = Depends(get_db)) -> ApiResponse[list[HoldingResponse]]:
    """Retrieve all holdings with calculated metrics."""
    holdings = HoldingsService.get_all_holdings(db)
    return ApiResponse(success=True, data=holdings, error=None)


@router.get("/{holding_id}", response_model=ApiResponse[HoldingResponse])
def get_holding(
    holding_id: int, db: Session = Depends(get_db)
) -> JSONResponse | ApiResponse[HoldingResponse]:
    """Retrieve a single holding by ID."""
    try:
        holding = HoldingsService.get_holding(db, holding_id)
    except HTTPException as exc:
        return JSONResponse(
            status_code=exc.status_code,
            content={"success": False, "data": None, "error": exc.detail},
        )
    return ApiResponse(success=True, data=holding, error=None)


@router.post("", response_model=ApiResponse[HoldingResponse], status_code=201)
def create_holding(
    data: HoldingCreate, db: Session = Depends(get_db)
) -> JSONResponse | ApiResponse[HoldingResponse]:
    """Create a new holding with an initial buy transaction."""
    try:
        holding = HoldingsService.create_holding(db, data)
    except HTTPException as exc:
        return JSONResponse(
            status_code=exc.status_code,
            content={"success": False, "data": None, "error": exc.detail},
        )
    except ValueError as exc:
        return JSONResponse(
            status_code=400,
            content={"success": False, "data": None, "error": str(exc)},
        )
    return ApiResponse(success=True, data=holding, error=None)


@router.put("/{holding_id}", response_model=ApiResponse[HoldingResponse])
def update_holding(
    holding_id: int, data: HoldingUpdate, db: Session = Depends(get_db)
) -> JSONResponse | ApiResponse[HoldingResponse]:
    """Update editable fields of a holding."""
    try:
        holding = HoldingsService.update_holding(db, holding_id, data)
    except HTTPException as exc:
        return JSONResponse(
            status_code=exc.status_code,
            content={"success": False, "data": None, "error": exc.detail},
        )
    return ApiResponse(success=True, data=holding, error=None)


@router.delete("/{holding_id}", response_model=ApiResponse[None])
def delete_holding(
    holding_id: int, db: Session = Depends(get_db)
) -> JSONResponse | ApiResponse[None]:
    """Delete a holding and return invested amount to cash balance."""
    try:
        HoldingsService.delete_holding(db, holding_id)
    except HTTPException as exc:
        return JSONResponse(
            status_code=exc.status_code,
            content={"success": False, "data": None, "error": exc.detail},
        )
    return ApiResponse(success=True, data=None, error=None)
