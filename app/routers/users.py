from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from .. import models, schemas, permissions, auth
from ..database import get_db

router = APIRouter(prefix="/users", tags=["Users"])

@router.post("/", response_model=schemas.UserOut)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe una cuenta registrada con ese email")
    hashed = auth.hash_password(user.password)
    new_user = models.User(email=user.email, password=hashed, full_name=user.full_name, role=user.role)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.get("/", response_model=List[schemas.UserOut])
def list_users(db: Session = Depends(get_db), current_user: models.User = Depends(permissions.require_role_simulado("admin"))):
    return db.query(models.User).all()

# "/me": debe ir antes de "/{user_id}" para que no se interprete "me"
# como un id (misma razon que "/products/search").
@router.get("/me", response_model=schemas.UserOut)
def get_me(current_user: models.User = Depends(permissions.get_current_user_simulado)):
    return current_user

@router.put("/me", response_model=schemas.UserOut)
def update_me(
    update: schemas.UserSelfUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(permissions.get_current_user_simulado),
):
    data = update.dict(exclude_unset=True)
    if "email" in data and data["email"] != current_user.email:
        existing = db.query(models.User).filter(models.User.email == data["email"]).first()
        if existing:
            raise HTTPException(status_code=400, detail="Ya existe una cuenta registrada con ese email")
    for key, value in data.items():
        setattr(current_user, key, value)
    db.commit()
    db.refresh(current_user)
    return current_user

@router.get("/{user_id}", response_model=schemas.UserOut)
def get_user(user_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(permissions.require_role_simulado("admin"))):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user

@router.put("/{user_id}", response_model=schemas.UserOut)
def update_user(user_id: int, update: schemas.UserUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(permissions.require_role_simulado("admin"))):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    data = update.dict(exclude_unset=True)
    if "password" in data:
        data["password"] = auth.hash_password(data["password"])
    for key, value in data.items():
        setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return user

@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(permissions.require_role_simulado("admin"))):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    db.delete(user)
    db.commit()
    return {"detail": "Usuario eliminado correctamente"}
