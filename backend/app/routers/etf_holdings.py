"""ETF holdings API router."""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.common import ApiResponse
from app.schemas.holding import HoldingCreate, HoldingResponse, HoldingUpdate
from app.services.holdings_service import HoldingsService

router = APIRouter(prefix="/api/etf-holdings", tags=["etf-holdings"])


@router.get("", response_model=ApiResponse[list[HoldingResponse]])
def get_etf_holdings(
    db: Session = Depends(get_db),
) -> ApiResponse[list[HoldingResponse]]:
    """Retrieve all ETF holdings with calculated metrics."""
    holdings = HoldingsService.get_all_holdings(db, holding_type="etf")
    return ApiResponse(success=True, data=holdings, error=None)


@router.get("/{holding_id}", response_model=ApiResponse[HoldingResponse])
def get_etf_holding(
    holding_id: int, db: Session = Depends(get_db)
) -> JSONResponse | ApiResponse[HoldingResponse]:
    """Retrieve a single ETF holding by ID."""
    try:
        holding = HoldingsService.get_holding(
            db, holding_id, holding_type="etf"
        )
    except HTTPException as exc:
        return JSONResponse(
            status_code=exc.status_code,
            content={"success": False, "data": None, "error": exc.detail},
        )
    return ApiResponse(success=True, data=holding, error=None)


@router.post("", response_model=ApiResponse[HoldingResponse], status_code=201)
def create_etf_holding(
    data: HoldingCreate, db: Session = Depends(get_db)
) -> JSONResponse | ApiResponse[HoldingResponse]:
    """Create a new ETF holding with an initial buy transaction."""
    try:
        holding = HoldingsService.create_holding(
            db, data, holding_type="etf"
        )
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
def update_etf_holding(
    holding_id: int, data: HoldingUpdate, db: Session = Depends(get_db)
) -> JSONResponse | ApiResponse[HoldingResponse]:
    """Update editable fields of an ETF holding."""
    try:
        holding = HoldingsService.update_holding(
            db, holding_id, data, holding_type="etf"
        )
    except HTTPException as exc:
        return JSONResponse(
            status_code=exc.status_code,
            content={"success": False, "data": None, "error": exc.detail},
        )
    return ApiResponse(success=True, data=holding, error=None)


@router.delete("/{holding_id}", response_model=ApiResponse[None])
def delete_etf_holding(
    holding_id: int, db: Session = Depends(get_db)
) -> JSONResponse | ApiResponse[None]:
    """Delete an ETF holding and return invested amount to cash balance."""
    try:
        HoldingsService.delete_holding(db, holding_id, holding_type="etf")
    except HTTPException as exc:
        return JSONResponse(
            status_code=exc.status_code,
            content={"success": False, "data": None, "error": exc.detail},
        )
    return ApiResponse(success=True, data=None, error=None)
