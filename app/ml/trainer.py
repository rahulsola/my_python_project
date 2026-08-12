"""Offline training script logic. Run via: python -m app.ml.train_stock_model"""

from __future__ import annotations

from datetime import datetime, timezone

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sqlalchemy.orm import Session

from ..models import Product
from .constants import LOW_STOCK_THRESHOLD, MODEL_PATH


def _build_feature_frame(products: list[Product]) -> tuple[pd.DataFrame, pd.Series]:
    rows = [
        {
            "price": float(product.price or 0),
            "stock": int(product.stock or 0),
            "category": (product.category or "General").strip() or "General",
            "low_stock": 1 if int(product.stock or 0) < LOW_STOCK_THRESHOLD else 0,
        }
        for product in products
    ]
    df = pd.DataFrame(rows)
    features = pd.get_dummies(df[["price", "stock", "category"]], columns=["category"])
    return features, df["low_stock"]


def train_stock_model(db: Session) -> dict:
    products = db.query(Product).all()

    if not products:
        if MODEL_PATH.exists():
            MODEL_PATH.unlink()
        return {"trained": False, "message": "No products found to train on.", "product_count": 0}

    features, labels = _build_feature_frame(products)

    if labels.nunique() < 2:
        if MODEL_PATH.exists():
            MODEL_PATH.unlink()
        return {
            "trained": False,
            "message": "Need both low-stock and healthy-stock products to train a model.",
            "product_count": len(products),
            "method": "rules",
        }

    model = RandomForestClassifier(n_estimators=50, random_state=42)
    model.fit(features, labels)

    bundle = {
        "model": model,
        "feature_columns": list(features.columns),
        "threshold": LOW_STOCK_THRESHOLD,
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "product_count": len(products),
    }

    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(bundle, MODEL_PATH)

    return {
        "trained": True,
        "message": "Stock prediction model saved to app/ml/models/stock_model.pkl",
        "product_count": len(products),
        "method": "ml",
        "feature_count": len(bundle["feature_columns"]),
        "trained_at": bundle["trained_at"],
    }
