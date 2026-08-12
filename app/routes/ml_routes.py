from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from .. import schemas
from ..services.ml_service import get_model_status, get_stock_insights

router = APIRouter(prefix="/ml", tags=["ml"])


@router.get("/status", response_model=schemas.MlStatusResponse)
def ml_status():
    return get_model_status()


@router.get("/stock-insights", response_model=schemas.StockInsightsResponse)
def stock_insights(db: Session = Depends(get_db)):
    return get_stock_insights(db)
