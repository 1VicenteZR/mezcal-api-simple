from fastapi import FastAPI

from .database import engine, Base
from .routers import users, products, orders, auth

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Mezcal API Simple - Users CRUD")

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(products.router)
app.include_router(products.reviews_router)
app.include_router(orders.cart_router)
app.include_router(orders.orders_router)

@app.get("/")
def root():
    return {"message": "Mezcal API Simple activa"}
