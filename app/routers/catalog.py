from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from typing import List

from .. import models, schemas, permissions
from ..database import get_db

categories_router = APIRouter(prefix="/categories", tags=["Categories"])
brands_router = APIRouter(prefix="/brands", tags=["Brands"])


def _make_crud(router: APIRouter, model, create_schema, out_schema, label: str):
    @router.get("/", response_model=List[out_schema])
    def list_items(db: Session = Depends(get_db), current_user: models.User = Depends(permissions.require_role_simulado("admin"))):
        return db.query(model).order_by(model.name).all()

    @router.post("/", response_model=out_schema)
    def create_item(item: create_schema, db: Session = Depends(get_db), current_user: models.User = Depends(permissions.require_role_simulado("admin"))):
        new_item = model(name=item.name.strip())
        db.add(new_item)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            raise HTTPException(status_code=400, detail=f"Ya existe {label} con ese nombre")
        db.refresh(new_item)
        return new_item

    @router.delete("/{item_id}")
    def delete_item(item_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(permissions.require_role_simulado("admin"))):
        obj = db.query(model).filter(model.id == item_id).first()
        if not obj:
            raise HTTPException(status_code=404, detail=f"{label} no encontrada")
        db.delete(obj)
        db.commit()
        return {"detail": f"{label} eliminada"}


_make_crud(categories_router, models.Category, schemas.CategoryCreate, schemas.CategoryOut, "categoría")
_make_crud(brands_router, models.Brand, schemas.BrandCreate, schemas.BrandOut, "marca")
