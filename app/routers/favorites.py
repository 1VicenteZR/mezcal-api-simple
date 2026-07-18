from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from .. import models, schemas, permissions
from ..database import get_db

router = APIRouter(prefix="/favorites", tags=["Favorites"])

def _serialize(db: Session, favorite: models.Favorite):
    product = db.query(models.Product).filter(models.Product.id == favorite.product_id).first()
    if not product:
        return None
    return {
        "id": favorite.id,
        "product_id": favorite.product_id,
        "product_name": product.name,
        "product_price": product.price,
        "product_stock": product.stock,
        "imagen_url": product.imagen_url,
        "tipo_mezcal": product.tipo_mezcal,
        "description": product.description,
        "abv": product.abv,
        "created_at": favorite.created_at,
    }

@router.get("/", response_model=List[schemas.FavoriteProductOut])
def list_favorites(db: Session = Depends(get_db), current_user: models.User = Depends(permissions.get_current_user_simulado)):
    favorites = db.query(models.Favorite).filter(models.Favorite.user_id == current_user.id).order_by(models.Favorite.created_at.desc()).all()
    result = [_serialize(db, f) for f in favorites]
    return [r for r in result if r is not None]

@router.post("/", response_model=schemas.FavoriteProductOut)
def add_favorite(favorite: schemas.FavoriteCreate, db: Session = Depends(get_db), current_user: models.User = Depends(permissions.get_current_user_simulado)):
    product = db.query(models.Product).filter(models.Product.id == favorite.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    existing = db.query(models.Favorite).filter(
        models.Favorite.user_id == current_user.id,
        models.Favorite.product_id == favorite.product_id
    ).first()
    if existing:
        return _serialize(db, existing)

    new_favorite = models.Favorite(user_id=current_user.id, product_id=favorite.product_id)
    db.add(new_favorite)
    db.commit()
    db.refresh(new_favorite)
    return _serialize(db, new_favorite)

@router.delete("/{product_id}")
def remove_favorite(product_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(permissions.get_current_user_simulado)):
    favorite = db.query(models.Favorite).filter(
        models.Favorite.user_id == current_user.id,
        models.Favorite.product_id == product_id
    ).first()
    if not favorite:
        raise HTTPException(status_code=404, detail="No estaba en tus favoritos")
    db.delete(favorite)
    db.commit()
    return {"detail": "Eliminado de favoritos"}
