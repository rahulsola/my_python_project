from sqlalchemy.orm import Session
from . import models, schemas


def create_user(db: Session, user: schemas.UserCreate):
    db_user = models.User(
        name=user.name,
        email=user.email,
        contact=user.contact
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user


def get_users(db: Session):
    return db.query(models.User).all()


def get_user_by_id(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()


def update_user(db: Session, user_id: int, user: schemas.UserCreate):
    db_user = get_user_by_id(db, user_id)

    if not db_user:
        return None

    db_user.name = user.name
    db_user.email = user.email
    db_user.contact = user.contact

    db.commit()
    db.refresh(db_user)

    return db_user


def delete_user(db: Session, user_id: int):
    db_user = get_user_by_id(db, user_id)

    if not db_user:
        return None

    db.delete(db_user)
    db.commit()

    return db_user


# Product CRUD operations
def create_product(db: Session, product: schemas.ProductCreate):
    db_product = models.Product(
        name=product.name,
        description=product.description,
        price=product.price,
        stock=product.stock,
        category=product.category
    )

    db.add(db_product)
    db.commit()
    db.refresh(db_product)

    return db_product


def get_products(db: Session):
    return db.query(models.Product).all()


def get_product_by_id(db: Session, product_id: int):
    return db.query(models.Product).filter(models.Product.id == product_id).first()


def update_product(db: Session, product_id: int, product: schemas.ProductCreate):
    db_product = get_product_by_id(db, product_id)

    if not db_product:
        return None

    db_product.name = product.name
    db_product.description = product.description
    db_product.price = product.price
    db_product.stock = product.stock
    db_product.category = product.category

    db.commit()
    db.refresh(db_product)

    return db_product


def delete_product(db: Session, product_id: int):
    db_product = get_product_by_id(db, product_id)

    if not db_product:
        return None

    db.delete(db_product)
    db.commit()

    return db_product


# Game CRUD operations
def create_game(db: Session, game: schemas.GameCreate):
    db_game = models.Game(
        title=game.title,
        description=game.description,
        genre=game.genre,
        platform=game.platform,
        release_year=game.release_year,
        rating=game.rating,
        price=game.price,
        image_url=game.image_url
    )

    db.add(db_game)
    db.commit()
    db.refresh(db_game)

    return db_game


def get_games(db: Session):
    return db.query(models.Game).all()


def get_game_by_id(db: Session, game_id: int):
    return db.query(models.Game).filter(models.Game.id == game_id).first()


def update_game(db: Session, game_id: int, game: schemas.GameCreate):
    db_game = get_game_by_id(db, game_id)

    if not db_game:
        return None

    db_game.title = game.title
    db_game.description = game.description
    db_game.genre = game.genre
    db_game.platform = game.platform
    db_game.release_year = game.release_year
    db_game.rating = game.rating
    db_game.price = game.price
    db_game.image_url = game.image_url

    db.commit()
    db.refresh(db_game)

    return db_game


def delete_game(db: Session, game_id: int):
    db_game = get_game_by_id(db, game_id)

    if not db_game:
        return None

    db.delete(db_game)
    db.commit()

    return db_game


def get_chat_messages(db: Session):
    return db.query(models.StoredChatMessage).order_by(models.StoredChatMessage.id.asc()).all()


def create_chat_message(db: Session, role: str, content: str):
    message = models.StoredChatMessage(role=role, content=content)
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


def clear_chat_messages(db: Session):
    db.query(models.StoredChatMessage).delete()
    db.commit()