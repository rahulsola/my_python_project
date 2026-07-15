from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models import User, Product, Game

router = APIRouter()


@router.get("/dashboard/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    # Counts
    total_users = db.query(User).count()
    total_products = db.query(Product).count()
    total_games = db.query(Game).count()

    # Total Stock & Inventory Value
    total_stock = db.query(func.sum(Product.stock)).scalar() or 0
    total_value = db.query(func.sum(Product.price * Product.stock)).scalar() or 0.0

    # Average Price
    avg_price = db.query(func.avg(Product.price)).scalar() or 0.0

    # Recent activities (last 5 created items)
    recent_users = db.query(User).order_by(User.id.desc()).limit(5).all()
    recent_products = db.query(Product).order_by(Product.id.desc()).limit(5).all()
    recent_games = db.query(Game).order_by(Game.id.desc()).limit(5).all()

    # Format recent users list
    users_list = []
    for u in recent_users:
        users_list.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "contact": u.contact,
            "type": "user",
        })

    # Format recent products list
    products_list = []
    for p in recent_products:
        products_list.append({
            "id": p.id,
            "name": p.name,
            "price": p.price,
            "stock": p.stock,
            "category": p.category,
            "type": "product",
        })

    # Format recent games list
    games_list = []
    for g in recent_games:
        games_list.append({
            "id": g.id,
            "title": g.title,
            "genre": g.genre,
            "platform": g.platform,
            "price": g.price,
            "rating": g.rating,
            "type": "game",
        })

    return {
        "total_users": total_users,
        "total_products": total_products,
        "total_games": total_games,
        "total_stock": total_stock,
        "total_inventory_value": round(total_value, 2),
        "avg_product_price": round(avg_price, 2),
        "recent_users": users_list,
        "recent_products": products_list,
        "recent_games": games_list
    }
