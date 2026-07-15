from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from .. import crud, schemas

router = APIRouter()


@router.post("/games", response_model=schemas.GameResponse)
def create_game(game: schemas.GameCreate, db: Session = Depends(get_db)):
    return crud.create_game(db, game)


@router.get("/games")
def get_games(db: Session = Depends(get_db)):
    return crud.get_games(db)


@router.put("/games/{game_id}", response_model=schemas.GameResponse)
def update_game(
    game_id: int,
    game: schemas.GameCreate,
    db: Session = Depends(get_db)
):
    updated_game = crud.update_game(db, game_id, game)

    if not updated_game:
        raise HTTPException(status_code=404, detail="Game not found")

    return updated_game


@router.delete("/games/{game_id}")
def delete_game(game_id: int, db: Session = Depends(get_db)):
    deleted_game = crud.delete_game(db, game_id)

    if not deleted_game:
        raise HTTPException(status_code=404, detail="Game not found")

    return {"message": "Game deleted successfully"}
