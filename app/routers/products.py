from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session
from typing import List

from .. import models, schemas, permissions, ai_search
from ..database import get_db

router = APIRouter(prefix="/products", tags=["Products"])
reviews_router = APIRouter(prefix="/reviews", tags=["Reviews"])

# Público (invitado): ver productos, sin restricción

@router.get("/", response_model=List[schemas.ProductOut])
def list_products(db: Session = Depends(get_db)):
    return db.query(models.Product).all()

# Búsqueda inteligente (IA): debe ir antes de "/{product_id}" para que
# "/products/search" no sea interpretado como un product_id.
@router.get("/search", response_model=List[schemas.ProductOut])
def search_products_ai(q: str = Query(..., min_length=1), db: Session = Depends(get_db)):
    products = db.query(models.Product).all()
    if not products:
        return []

    products_dict = [
        {
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "tipo_mezcal": p.tipo_mezcal,
            "region": p.region,
            "abv": p.abv,
        }
        for p in products
    ]

    try:
        ranked_ids = ai_search.rank_products_by_query(q, products_dict)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))

    by_id = {p.id: p for p in products}
    return [by_id[i] for i in ranked_ids if i in by_id]

# Productos mejor valorados (para graficas del dashboard admin): debe ir antes
# de "/{product_id}" por la misma razon que "/search".
@router.get("/stats/top-rated", response_model=List[schemas.TopRatedProductOut])
def top_rated_products(limit: int = 5, db: Session = Depends(get_db), current_user: models.User = Depends(permissions.require_role_simulado("admin"))):
    rows = (
        db.query(
            models.Review.product_id,
            models.Product.name,
            func.avg(models.Review.rating).label("avg_rating"),
            func.count(models.Review.id).label("review_count"),
        )
        .join(models.Product, models.Product.id == models.Review.product_id)
        .group_by(models.Review.product_id, models.Product.name)
        .order_by(func.avg(models.Review.rating).desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "product_id": r.product_id,
            "name": r.name,
            "avg_rating": round(float(r.avg_rating), 2),
            "review_count": int(r.review_count),
        }
        for r in rows
    ]

@router.get("/{product_id}", response_model=schemas.ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return product

# Solo admin: crear/editar/eliminar

@router.post("/", response_model=schemas.ProductOut)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db), current_user: models.User = Depends(permissions.require_role_simulado("admin"))):
    new_product = models.Product(**product.dict())
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product

@router.put("/{product_id}", response_model=schemas.ProductOut)
def update_product(product_id: int, update: schemas.ProductCreate, db: Session = Depends(get_db), current_user: models.User = Depends(permissions.require_role_simulado("admin"))):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    for key, value in update.dict(exclude_unset=True).items():
        setattr(product, key, value)
    db.commit()
    db.refresh(product)
    return product

@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(permissions.require_role_simulado("admin"))):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    db.delete(product)
    db.commit()
    return {"detail": "Producto eliminado"}

# Reseñas: público lee, cualquier usuario registrado escribe (manda su user_id en body)

# Moderacion (admin): debe ir antes de "/{product_id}" por la misma razon
# que "/products/search".
@reviews_router.get("/all", response_model=List[schemas.ReviewAdminOut])
def list_all_reviews(db: Session = Depends(get_db), current_user: models.User = Depends(permissions.require_role_simulado("admin"))):
    reviews = db.query(models.Review).order_by(models.Review.created_at.desc()).all()
    result = []
    for r in reviews:
        product = db.query(models.Product).filter(models.Product.id == r.product_id).first()
        user = db.query(models.User).filter(models.User.id == r.user_id).first()
        result.append({
            "id": r.id,
            "product_id": r.product_id,
            "product_name": product.name if product else "Producto eliminado",
            "user_id": r.user_id,
            "user_email": user.email if user else None,
            "rating": r.rating,
            "comment": r.comment,
            "created_at": r.created_at,
        })
    return result

@reviews_router.delete("/{review_id}")
def delete_review(review_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(permissions.require_role_simulado("admin"))):
    review = db.query(models.Review).filter(models.Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Reseña no encontrada")
    db.delete(review)
    db.commit()
    return {"detail": "Reseña eliminada"}

@reviews_router.get("/{product_id}", response_model=List[schemas.ReviewOut])
def list_reviews(product_id: int, db: Session = Depends(get_db)):
    return db.query(models.Review).filter(models.Review.product_id == product_id).all()

@reviews_router.post("/", response_model=schemas.ReviewOut)
def create_review(review: schemas.ReviewCreateSimple, db: Session = Depends(get_db), current_user: models.User = Depends(permissions.get_current_user_simulado)):
    product = db.query(models.Product).filter(models.Product.id == review.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    new_review = models.Review(product_id=review.product_id, user_id=current_user.id, rating=review.rating, comment=review.comment)
    db.add(new_review)
    db.commit()
    db.refresh(new_review)
    return new_review

# ---- Subida de imágenes (solo admin) ----

import os
import uuid
from fastapi import UploadFile, File

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "..", "uploads", "products")
UPLOAD_DIR = os.path.abspath(UPLOAD_DIR)
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

@router.post("/upload-image")
def upload_product_image(file: UploadFile = File(...), current_user: models.User = Depends(permissions.require_role_simulado("admin"))):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Formato no permitido. Usa jpg, jpeg, png o webp")

    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    with open(filepath, "wb") as f:
        f.write(file.file.read())

    image_url = f"/uploads/products/{filename}"
    return {"imagen_url": image_url}
