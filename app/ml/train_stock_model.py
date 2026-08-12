"""Train the stock prediction model offline from current product data."""

from app.database import SessionLocal
from app.ml.trainer import train_stock_model


def main():
    db = SessionLocal()
    try:
        result = train_stock_model(db)
        print(result)
        if result.get("trained"):
            print("\nRestart the FastAPI server to load the new model.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
