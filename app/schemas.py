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


class StoredChatMessageResponse(ChatMessage):
    id: int
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(min_length=1)
    include_context: bool = True


class ChatResponse(BaseModel):
    message: ChatMessage
    model: str
    mode: Literal["demo", "live", "fallback"] = "live"
    id: Optional[int] = None
    created_at: Optional[str] = None


class ChatStatusResponse(BaseModel):
    configured: bool
    model: str
    mode: Literal["demo", "live", "fallback"] = "live"


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: str = Field(min_length=5, max_length=255)
    password: str = Field(min_length=6, max_length=128)


class LoginRequest(BaseModel):
    email: str
    password: str


class AccountResponse(BaseModel):
    id: int
    name: str
    email: str

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: AccountResponse