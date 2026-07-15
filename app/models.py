from sqlalchemy import Column, Integer, String, Float
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    contact = Column(String)


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    price = Column(Float, default=0.0)
    stock = Column(Integer, default=0)
    category = Column(String, index=True)


class Game(Base):
    __tablename__ = "games"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String, nullable=True)
    genre = Column(String, index=True)
    platform = Column(String, index=True)
    release_year = Column(Integer)
    rating = Column(Float, default=0.0)
    price = Column(Float, default=0.0)
    image_url = Column(String, nullable=True)