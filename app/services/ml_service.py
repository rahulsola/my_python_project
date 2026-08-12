from __future__ import annotations

import joblib
import pandas as pd
from sqlalchemy.orm import Session

from ..ml.constants import LOW_STOCK_THRESHOLD, MODEL_PATH
from ..models import Product

_model_bundle: dict | None = None


def init_ml_model() -> None:
    """Load the saved model once when FastAPI starts."""
    global _model_bundle

    if not MODEL_PATH.exists():
        _model_bundle = None
        print("[ML] No model file found. Train offline with: python -m app.ml.train_stock_model")
        return

    loaded = joblib.load(MODEL_PATH)
    if isinstance(loaded, dict) and "model" in loaded:
        _model_bundle = loaded
    else:
        _model_bundle = {
            "model": loaded,
            "feature_columns": ["price", "stock"],
            "threshold": LOW_STOCK_THRESHOLD,
            "trained_at": None,
            "product_count": None,
        }
    feature_count = len(_model_bundle.get("feature_columns", []))
    trained_at = _model_bundle.get("trained_at", "unknown")
    print(f"[ML] Model loaded ({feature_count} features, trained at {trained_at})")


def get_model_status() -> dict:
    if _model_bundle is None:
        return {
            "model_loaded": False,
            "method": "rules",
            "threshold": LOW_STOCK_THRESHOLD,
            "trained_at": None,
            "product_count": None,
            "feature_count": None,
            "train_command": "python -m app.ml.train_stock_model",
        }

    return {
        "model_loaded": True,
        "method": "ml",
        "threshold": _model_bundle.get("threshold", LOW_STOCK_THRESHOLD),
        "trained_at": _model_bundle.get("trained_at"),
        "product_count": _model_bundle.get("product_count"),
        "feature_count": len(_model_bundle.get("feature_columns", [])),
        "train_command": "python -m app.ml.train_stock_model",
    }


def _rule_based_prediction(price: float, stock: int) -> dict:
    is_low = stock < LOW_STOCK_THRESHOLD
    if stock <= 0:
        confidence = 0.99
    elif stock < 5:
        confidence = 0.9
    elif stock < LOW_STOCK_THRESHOLD:
        confidence = 0.75
    else:
        confidence = 0.8
    return {
        "low_stock": is_low,
        "confidence": confidence,
        "method": "rules",
    }


def _build_features(price: float, stock: int, category: str | None) -> pd.DataFrame:
    row = pd.DataFrame(
        [{"price": price, "stock": stock, "category": (category or "General").strip() or "General"}]
    )
    features = pd.get_dummies(row, columns=["category"])
    feature_columns = _model_bundle["feature_columns"]
    return features.reindex(columns=feature_columns, fill_value=0)


def predict_stock_risk(price: float, stock: int, category: str | None = None) -> dict:
    if _model_bundle is None:
        return _rule_based_prediction(price, stock)

    features = _build_features(price, stock, category)
    model = _model_bundle["model"]
    prediction = int(model.predict(features)[0])
    probabilities = model.predict_proba(features)[0]
    confidence = float(probabilities[prediction])

    return {
        "low_stock": bool(prediction),
        "confidence": round(confidence, 2),
        "method": "ml",
    }


def get_stock_insights(db: Session) -> dict:
    products = db.query(Product).order_by(Product.stock.asc()).all()
    status = get_model_status()

    insights = []
    low_stock_count = 0

    for product in products:
        price = float(product.price or 0)
        stock = int(product.stock or 0)
        prediction = predict_stock_risk(price, stock, product.category)
        if prediction["low_stock"]:
            low_stock_count += 1

        insights.append(
            {
                "product_id": product.id,
                "name": product.name,
                "category": product.category,
                "price": price,
                "stock": stock,
                "low_stock": prediction["low_stock"],
                "confidence": prediction["confidence"],
                "method": prediction["method"],
            }
        )

    return {
        "model_available": status["model_loaded"],
        "trained_at": status["trained_at"],
        "threshold": status["threshold"],
        "total_products": len(products),
        "low_stock_count": low_stock_count,
        "insights": insights,
    }
