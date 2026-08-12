from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from .. import schemas
from ..services.ml_service import get_stock_insights, train_stock_model

router = APIRouter(prefix="/ml", tags=["ml"])


@router.get("/stock-insights", response_model=schemas.StockInsightsResponse)
def stock_insights(db: Session = Depends(get_db)):
    return get_stock_insights(db)


@router.post("/retrain", response_model=schemas.MlTrainResponse)
def retrain_model(db: Session = Depends(get_db)):
    return train_stock_model(db)
