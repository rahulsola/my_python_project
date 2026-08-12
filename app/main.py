from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from .database import engine, SessionLocal
from .models import Base, Game
from .routes.user_routes import router as user_router
from .routes.product_routes import router as product_router
from .routes.dashboard_routes import router as dashboard_router
from .routes.game_routes import router as game_router
from .routes.chat_routes import router as chat_router
from .routes.auth_routes import router as auth_router
from .routes.ml_routes import router as ml_router

Base.metadata.create_all(bind=engine)

# Seed games database if empty
def seed_games():
    db = SessionLocal()
    try:
        if db.query(Game).count() == 0:
            initial_games = [
                Game(
                    title="The Witcher 3: Wild Hunt",
                    description="Action RPG set in a fantasy universe full of monsters and magic.",
                    genre="RPG",
                    platform="PC, PlayStation, Xbox",
                    release_year=2015,
                    rating=9.8,
                    price=39.99,
                    image_url="https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=600&auto=format&fit=crop"
                ),
                Game(
                    title="Cyberpunk 2077",
                    description="An open-world, action-adventure story set in Night City, a megalopolis obsessed with power, glamour and body modification.",
                    genre="RPG",
                    platform="PC, PlayStation, Xbox",
                    release_year=2020,
                    rating=8.5,
                    price=59.99,
                    image_url="https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=600&auto=format&fit=crop"
                ),
                Game(
                    title="Elden Ring",
                    description="Rise, Tarnished, and be guided by grace to brandish the power of the Elden Ring and become an Elden Lord in the Lands Between.",
                    genre="Action RPG",
                    platform="PC, PlayStation, Xbox",
                    release_year=2022,
                    rating=9.6,
                    price=59.99,
                    image_url="https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=600&auto=format&fit=crop"
                ),
                Game(
                    title="Red Dead Redemption 2",
                    description="Red Dead Redemption 2 is an epic tale of honor and loyalty at the dawn of the modern age.",
                    genre="Action-Adventure",
                    platform="PC, PlayStation, Xbox",
                    release_year=2018,
                    rating=9.7,
                    price=59.99,
                    image_url="https://images.unsplash.com/photo-1552820728-8b83bb6b773f?q=80&w=600&auto=format&fit=crop"
                ),
                Game(
                    title="Minecraft",
                    description="Explore infinite worlds and build everything from the simplest of homes to the grandest of castles.",
                    genre="Sandbox",
                    platform="PC, PlayStation, Xbox, Switch",
                    release_year=2011,
                    rating=9.0,
                    price=19.99,
                    image_url="https://images.unsplash.com/photo-1605901309584-818e25960a8f?q=80&w=600&auto=format&fit=crop"
                )
            ]
            db.add_all(initial_games)
            db.commit()
            print("Successfully seeded initial games data!")
    except Exception as e:
        print(f"Error seeding games: {e}")
    finally:
        db.close()

seed_games()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user_router)
app.include_router(product_router)
app.include_router(dashboard_router)
app.include_router(game_router)
app.include_router(chat_router)
app.include_router(auth_router)
app.include_router(ml_router)

# Mount the static files (built React app) if it exists
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))

if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")
else:
    @app.get("/")
    def home():
        return {"message": "API Running Successfully"}