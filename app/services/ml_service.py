from __future__ import annotations

from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sqlalchemy.orm import Session

from ..models import Product

MODEL_PATH = Path(__file__).resolve().parent.parent / "ml" / "models" / "stock_model.pkl"
LOW_STOCK_THRESHOLD = 10


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


def train_stock_model(db: Session) -> dict:
    products = db.query(Product).all()

    if not products:
        if MODEL_PATH.exists():
            MODEL_PATH.unlink()
        return {"trained": False, "message": "No products found to train on.", "product_count": 0}

    rows = [
        {
            "price": float(product.price or 0),
            "stock": int(product.stock or 0),
            "low_stock": 1 if int(product.stock or 0) < LOW_STOCK_THRESHOLD else 0,
        }
        for product in products
    ]
    df = pd.DataFrame(rows)

    if df["low_stock"].nunique() < 2:
        if MODEL_PATH.exists():
            MODEL_PATH.unlink()
        return {
            "trained": False,
            "message": "Using rule-based predictions until you have both low and healthy stock items.",
            "product_count": len(products),
            "method": "rules",
        }

    model = RandomForestClassifier(n_estimators=50, random_state=42)
    model.fit(df[["price", "stock"]], df["low_stock"])

    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, MODEL_PATH)

    return {
        "trained": True,
        "message": "Stock prediction model trained successfully.",
        "product_count": len(products),
        "method": "ml",
    }


def _load_model():
    if not MODEL_PATH.exists():
        return None
    return joblib.load(MODEL_PATH)


def predict_stock_risk(price: float, stock: int) -> dict:
    model = _load_model()
    if model is None:
        return _rule_based_prediction(price, stock)

    features = pd.DataFrame([{"price": price, "stock": stock}])
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
    model_available = MODEL_PATH.exists()

    insights = []
    low_stock_count = 0

    for product in products:
        price = float(product.price or 0)
        stock = int(product.stock or 0)
        prediction = predict_stock_risk(price, stock)
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
        "model_available": model_available,
        "threshold": LOW_STOCK_THRESHOLD,
        "total_products": len(products),
        "low_stock_count": low_stock_count,
        "insights": insights,
    }
