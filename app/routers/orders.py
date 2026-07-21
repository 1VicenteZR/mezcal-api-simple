from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session
from typing import List

from .. import models, schemas, permissions
from ..database import get_db

cart_router = APIRouter(prefix="/cart", tags=["Cart"])
orders_router = APIRouter(prefix="/orders", tags=["Orders"])

@cart_router.get("/", response_model=List[schemas.CartItemDetailOut])
def get_cart(db: Session = Depends(get_db), current_user: models.User = Depends(permissions.get_current_user_simulado)):
    items = db.query(models.CartItem).filter(models.CartItem.user_id == current_user.id).all()
    result = []
    for item in items:
        product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        if not product:
            continue
        result.append({
            "id": item.id,
            "product_id": item.product_id,
            "product_name": product.name,
            "product_price": product.price,
            "product_stock": product.stock,
            "imagen_url": product.imagen_url,
            "quantity": item.quantity,
            "created_at": item.created_at,
        })
    return result

@cart_router.post("/", response_model=schemas.CartItemOut)
def add_to_cart(item: schemas.CartItemAdd, db: Session = Depends(get_db), current_user: models.User = Depends(permissions.get_current_user_simulado)):
    if current_user.role == "admin":
        raise HTTPException(status_code=403, detail="Acceso no permitido: el administrador no puede usar el carrito")
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

@cart_router.put("/{item_id}", response_model=schemas.CartItemDetailOut)
def update_cart_item(item_id: int, update: schemas.CartItemUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(permissions.get_current_user_simulado)):
    if current_user.role == "admin":
        raise HTTPException(status_code=403, detail="Acceso no permitido: el administrador no puede usar el carrito")
    item = db.query(models.CartItem).filter(
        models.CartItem.id == item_id,
        models.CartItem.user_id == current_user.id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item no encontrado en tu carrito")
    if update.quantity < 1:
        raise HTTPException(status_code=400, detail="La cantidad debe ser al menos 1")
    product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    if product.stock < update.quantity:
        raise HTTPException(status_code=400, detail="Stock insuficiente")
    item.quantity = update.quantity
    db.commit()
    db.refresh(item)
    return {
        "id": item.id,
        "product_id": item.product_id,
        "product_name": product.name,
        "product_price": product.price,
        "product_stock": product.stock,
        "imagen_url": product.imagen_url,
        "quantity": item.quantity,
        "created_at": item.created_at,
    }

@cart_router.delete("/{item_id}")
def remove_from_cart(item_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(permissions.get_current_user_simulado)):
    if current_user.role == "admin":
        raise HTTPException(status_code=403, detail="Acceso no permitido: el administrador no puede usar el carrito")
    item = db.query(models.CartItem).filter(
        models.CartItem.id == item_id,
        models.CartItem.user_id == current_user.id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item no encontrado en tu carrito")
    db.delete(item)
    db.commit()
    return {"detail": "Item eliminado del carrito"}

def _serialize_order_mine(db: Session, order: models.Order) -> dict:
    items = db.query(models.OrderItem).filter(models.OrderItem.order_id == order.id).all()
    items_out = []
    for item in items:
        product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        items_out.append({
            "id": item.id,
            "product_id": item.product_id,
            "product_name": product.name if product else "Producto eliminado",
            "imagen_url": product.imagen_url if product else None,
            "quantity": item.quantity,
            "unit_price": item.unit_price,
        })
    return {
        "id": order.id,
        "total": order.total,
        "status": order.status,
        "created_at": order.created_at,
        "items": items_out,
    }

@orders_router.post("/checkout", response_model=schemas.OrderMineOut)
def checkout(payment_method: str = "efectivo", db: Session = Depends(get_db), current_user: models.User = Depends(permissions.get_current_user_simulado)):
    if current_user.role == "admin":
        raise HTTPException(status_code=403, detail="Acceso no permitido: el administrador no puede realizar compras")

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

    initial_status = "pagado" if payment_method == "tarjeta" else "pendiente"
    new_order = models.Order(user_id=current_user.id, total=total, status=initial_status)
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

    return _serialize_order_mine(db, new_order)

@orders_router.get("/", response_model=List[schemas.OrderMineOut])
def list_my_orders(db: Session = Depends(get_db), current_user: models.User = Depends(permissions.get_current_user_simulado)):
    orders = db.query(models.Order).filter(models.Order.user_id == current_user.id).order_by(models.Order.created_at.desc()).all()
    return [_serialize_order_mine(db, order) for order in orders]

@orders_router.put("/{order_id}/cancel", response_model=schemas.OrderMineOut)
def cancel_my_order(order_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(permissions.get_current_user_simulado)):
    order = db.query(models.Order).filter(
        models.Order.id == order_id,
        models.Order.user_id == current_user.id
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    if order.status not in ("pendiente", "pagado"):
        raise HTTPException(status_code=400, detail="Este pedido ya no se puede cancelar")

    # Devolver el stock reservado al cancelar
    items = db.query(models.OrderItem).filter(models.OrderItem.order_id == order.id).all()
    for item in items:
        product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        if product:
            product.stock += item.quantity

    order.status = "cancelado"
    db.commit()
    db.refresh(order)
    return _serialize_order_mine(db, order)

@orders_router.get("/stats/top-products", response_model=List[schemas.TopSellingProductOut])
def top_selling_products(limit: int = 5, db: Session = Depends(get_db), current_user: models.User = Depends(permissions.require_role_simulado("admin"))):
    rows = (
        db.query(
            models.OrderItem.product_id,
            models.Product.name,
            func.sum(models.OrderItem.quantity).label("total_quantity"),
        )
        .join(models.Product, models.Product.id == models.OrderItem.product_id)
        .group_by(models.OrderItem.product_id, models.Product.name)
        .order_by(func.sum(models.OrderItem.quantity).desc())
        .limit(limit)
        .all()
    )
    return [
        {"product_id": r.product_id, "name": r.name, "total_quantity": int(r.total_quantity)}
        for r in rows
    ]

# ---- Vistas de administrador (todas las ventas) ----

def _serialize_order_admin(db: Session, order: models.Order) -> dict:
    user = db.query(models.User).filter(models.User.id == order.user_id).first()
    items = db.query(models.OrderItem).filter(models.OrderItem.order_id == order.id).all()
    items_out = []
    for item in items:
        product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        items_out.append({
            "id": item.id,
            "product_id": item.product_id,
            "product_name": product.name if product else "Producto eliminado",
            "quantity": item.quantity,
            "unit_price": item.unit_price,
        })
    return {
        "id": order.id,
        "total": order.total,
        "status": order.status,
        "created_at": order.created_at,
        "items": items_out,
        "customer": {"id": user.id, "email": user.email, "full_name": user.full_name} if user else None,
    }

@orders_router.get("/all", response_model=List[schemas.OrderAdminOut])
def list_all_orders(db: Session = Depends(get_db), current_user: models.User = Depends(permissions.require_role_simulado("admin"))):
    orders = db.query(models.Order).order_by(models.Order.created_at.desc()).all()
    return [_serialize_order_admin(db, order) for order in orders]

ORDER_STEPS = ["pendiente", "pagado", "enviado", "entregado"]

@orders_router.put("/{order_id}/status", response_model=schemas.OrderAdminOut)
def update_order_status(order_id: int, update: schemas.OrderStatusUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(permissions.require_role_simulado("admin"))):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")

    current = order.status
    new = update.status

    if new == current:
        raise HTTPException(status_code=400, detail="El pedido ya está en ese estado")
    if current in ("entregado", "cancelado"):
        raise HTTPException(status_code=400, detail="Este pedido ya no se puede modificar")

    if new != "cancelado":
        current_idx = ORDER_STEPS.index(current)
        expected_next = ORDER_STEPS[current_idx + 1] if current_idx + 1 < len(ORDER_STEPS) else None
        if new != expected_next:
            detail = (
                f"No puedes saltar pasos: el siguiente estado debe ser '{expected_next}'"
                if expected_next
                else "Este pedido ya llegó al último paso"
            )
            raise HTTPException(status_code=400, detail=detail)

    order.status = new
    db.commit()
    db.refresh(order)
    return _serialize_order_admin(db, order)
