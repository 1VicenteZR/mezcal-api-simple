from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
import os as _os
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

from .database import engine, Base
from .routers import users, products, orders, auth

load_dotenv()

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Mezcal API Simple - Users CRUD")

_uploads_dir = _os.path.join(_os.path.dirname(__file__), "..", "uploads")
app.mount("/uploads", StaticFiles(directory=_uploads_dir), name="uploads")

CORS_ENABLED = os.getenv("CORS_ENABLED", "false").lower() == "true"

if CORS_ENABLED:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(products.router)
app.include_router(products.reviews_router)
app.include_router(orders.cart_router)
app.include_router(orders.orders_router)

@app.get("/")
def root():
    return {"message": "Mezcal API Simple activa", "cors_enabled": CORS_ENABLED}
