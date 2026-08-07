from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models import User, Product, Game
from .. import crud, schemas
from ..services.llm_service import (
    generate_chat_response,
    generate_fallback_response,
    is_llm_configured,
    _active_model_name,
    DEMO_MODEL,
    _is_auth_error,
    _is_quota_error,
    _is_permission_error,
)

router = APIRouter()


def _build_app_context(db: Session) -> str:
    total_users = db.query(User).count()
    total_products = db.query(Product).count()
    total_games = db.query(Game).count()
    total_stock = db.query(func.sum(Product.stock)).scalar() or 0
    total_value = db.query(func.sum(Product.price * Product.stock)).scalar() or 0.0
    low_stock = (
        db.query(Product)
        .filter(Product.stock <= 5)
        .order_by(Product.stock.asc())
        .limit(5)
        .all()
    )

    lines = [
        f"- Total users: {total_users}",
        f"- Total products: {total_products}",
        f"- Total games: {total_games}",
        f"- Total stock units: {total_stock}",
        f"- Inventory value: ${total_value:.2f}",
    ]

    if low_stock:
        items = ", ".join(f"{p.name} ({p.stock} left)" for p in low_stock)
        lines.append(f"- Low stock alerts: {items}")

    return "\n".join(lines)


def _serialize_message(message) -> schemas.StoredChatMessageResponse:
    return schemas.StoredChatMessageResponse(
        id=message.id,
        role=message.role,
        content=message.content,
        created_at=message.created_at.isoformat() if message.created_at else None,
    )


def _db_messages_to_history(db: Session) -> list[dict]:
    return [
        {"role": message.role, "content": message.content}
        for message in crud.get_chat_messages(db)
        if message.role in {"user", "assistant"}
    ]


@router.get("/chat/status", response_model=schemas.ChatStatusResponse)
def get_chat_status():
    configured = is_llm_configured()
    return schemas.ChatStatusResponse(
        configured=configured,
        model=_active_model_name() if configured else DEMO_MODEL,
        mode="live" if configured else "demo",
    )


@router.get("/chat/messages", response_model=list[schemas.StoredChatMessageResponse])
def list_chat_messages(db: Session = Depends(get_db)):
    return [_serialize_message(message) for message in crud.get_chat_messages(db)]


@router.delete("/chat/messages")
def delete_chat_messages(db: Session = Depends(get_db)):
    crud.clear_chat_messages(db)
    return {"message": "Chat history cleared"}


@router.post("/chat", response_model=schemas.ChatResponse)
def chat(request: schemas.ChatRequest, db: Session = Depends(get_db)):
    if not request.messages:
        raise HTTPException(status_code=400, detail="At least one message is required")

    last_message = request.messages[-1]
    if last_message.role != "user":
        raise HTTPException(status_code=400, detail="Last message must be from the user")

    crud.create_chat_message(db, role="user", content=last_message.content)

    context = _build_app_context(db) if request.include_context else None
    history = _db_messages_to_history(db)

    try:
        reply, model, mode = generate_chat_response(history, context=context)
    except Exception as exc:
        if _is_permission_error(exc):
            reply, model, mode = generate_fallback_response(history, context, reason="permission")
        elif _is_auth_error(exc):
            reply, model, mode = generate_fallback_response(history, context, reason="auth")
        elif _is_quota_error(exc):
            reply, model, mode = generate_fallback_response(history, context, reason="quota")
        else:
            raise HTTPException(status_code=502, detail=f"LLM request failed: {exc}") from exc

    saved_reply = crud.create_chat_message(db, role="assistant", content=reply)

    return schemas.ChatResponse(
        message=schemas.ChatMessage(role="assistant", content=reply),
        model=model,
        mode=mode,
        id=saved_reply.id,
        created_at=saved_reply.created_at.isoformat() if saved_reply.created_at else None,
    )
