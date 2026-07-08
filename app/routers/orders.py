from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from .. import models, schemas, permissions
from ..database import get_db

cart_router = APIRouter(prefix="/cart", tags=["Cart"])
orders_router = APIRouter(prefix="/orders", tags=["Orders"])

@cart_router.get("/", response_model=List[schemas.CartItemOut])
def get_cart(db: Session = Depends(get_db), current_user: models.User = Depends(permissions.get_current_user_simulado)):
    return db.query(models.CartItem).filter(models.CartItem.user_id == current_user.id).all()

@cart_router.post("/", response_model=schemas.CartItemOut)
def add_to_cart(item: schemas.CartItemAdd, db: Session = Depends(get_db), current_user: models.User = Depends(permissions.get_current_user_simulado)):
    product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    if product.stock < item.quantity:
        raise HTTPException(status_code=400, detail="Stock insuficiente")

    existing = db.query(models.CartItem).filter(
        models.CartItem.user_id == current_user.id,
        models.CartItem.product_id == item.product_id
    ).first()

    if existing:
        existing.quantity += item.quantity
        db.commit()
        db.refresh(existing)
        return existing

    new_item = models.CartItem(user_id=current_user.id, product_id=item.product_id, quantity=item.quantity)
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item

@cart_router.delete("/{item_id}")
def remove_from_cart(item_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(permissions.get_current_user_simulado)):
    item = db.query(models.CartItem).filter(
        models.CartItem.id == item_id,
        models.CartItem.user_id == current_user.id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item no encontrado en tu carrito")
    db.delete(item)
    db.commit()
    return {"detail": "Item eliminado del carrito"}

@orders_router.post("/checkout", response_model=schemas.OrderOut)
def checkout(db: Session = Depends(get_db), current_user: models.User = Depends(permissions.get_current_user_simulado)):
    if current_user.role == "admin":
        raise HTTPException(status_code=403, detail="El admin no puede realizar compras")

    cart_items = db.query(models.CartItem).filter(models.CartItem.user_id == current_user.id).all()
    if not cart_items:
        raise HTTPException(status_code=400, detail="Carrito vacío")

    total = 0
    order_items_data = []

    for cart_item in cart_items:
        product = db.query(models.Product).filter(models.Product.id == cart_item.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Producto {cart_item.product_id} ya no existe")
        if product.stock < cart_item.quantity:
            raise HTTPException(status_code=400, detail=f"Stock insuficiente para {product.name}")

        subtotal = product.price * cart_item.quantity
        total += subtotal
        order_items_data.append((product, cart_item.quantity, product.price))

    new_order = models.Order(user_id=current_user.id, total=total, status="pendiente")
    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    for product, quantity, unit_price in order_items_data:
        order_item = models.OrderItem(
            order_id=new_order.id,
            product_id=product.id,
            quantity=quantity,
            unit_price=unit_price
        )
        db.add(order_item)
        product.stock -= quantity

    for cart_item in cart_items:
        db.delete(cart_item)

    db.commit()
    db.refresh(new_order)

    items = db.query(models.OrderItem).filter(models.OrderItem.order_id == new_order.id).all()
    new_order.items = items
    return new_order

@orders_router.get("/", response_model=List[schemas.OrderOut])
def list_my_orders(db: Session = Depends(get_db), current_user: models.User = Depends(permissions.get_current_user_simulado)):
    orders = db.query(models.Order).filter(models.Order.user_id == current_user.id).all()
    for order in orders:
        order.items = db.query(models.OrderItem).filter(models.OrderItem.order_id == order.id).all()
    return orders
