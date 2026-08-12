"""Train the stock prediction model from current product data."""

from app.database import SessionLocal
from app.services.ml_service import train_stock_model


def main():
    db = SessionLocal()
    try:
        result = train_stock_model(db)
        print(result)
    finally:
        db.close()


if __name__ == "__main__":
    main()
