from pydantic import BaseModel, Field
from typing import Literal, Optional


class UserCreate(BaseModel):
    name: str
    email: str
    contact: str


class UserResponse(UserCreate):
    id: int

    class Config:
        from_attributes = True


class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    stock: int
    category: str


class ProductResponse(ProductCreate):
    id: int

    class Config:
        from_attributes = True


class GameCreate(BaseModel):
    title: str
    description: Optional[str] = None
    genre: str
    platform: str
    release_year: int
    rating: float
    price: float
    image_url: Optional[str] = None


class GameResponse(GameCreate):
    id: int

    class Config:
        from_attributes = True


class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(min_length=1)
    include_context: bool = True


class ChatResponse(BaseModel):
    message: ChatMessage
    model: str
    mode: Literal["demo", "live", "fallback"] = "live"


class ChatStatusResponse(BaseModel):
    configured: bool
    model: str
    mode: Literal["demo", "live", "fallback"] = "live"