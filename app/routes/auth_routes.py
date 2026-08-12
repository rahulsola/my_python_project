from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from ..database import get_db
from .. import crud, schemas
from ..utils.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    needs_rehash,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])
security = HTTPBearer(auto_error=False)


def get_current_account(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
):
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    email = decode_access_token(credentials.credentials)
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    account = crud.get_account_by_email(db, email)
    if not account:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account not found",
        )

    return account


@router.post("/register", response_model=schemas.AuthResponse, status_code=status.HTTP_201_CREATED)
def register(payload: schemas.RegisterRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    existing = crud.get_account_by_email(db, email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    account = crud.create_account(
        db,
        name=payload.name.strip(),
        email=email,
        password_hash=hash_password(payload.password),
    )
    token = create_access_token(account.email)

    return schemas.AuthResponse(
        access_token=token,
        user=schemas.AccountResponse.model_validate(account),
    )


@router.post("/login", response_model=schemas.AuthResponse)
def login(payload: schemas.LoginRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    account = crud.get_account_by_email(db, email)
    if not account or not verify_password(payload.password, account.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if needs_rehash(account.password_hash):
        account.password_hash = hash_password(payload.password)
        db.commit()
        db.refresh(account)

    token = create_access_token(account.email)
    return schemas.AuthResponse(
        access_token=token,
        user=schemas.AccountResponse.model_validate(account),
    )


@router.get("/me", response_model=schemas.AccountResponse)
def me(account=Depends(get_current_account)):
    return schemas.AccountResponse.model_validate(account)
