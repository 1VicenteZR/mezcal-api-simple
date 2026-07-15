from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from .. import models, auth
from ..database import get_db

router = APIRouter(prefix="/auth", tags=["Auth"])

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == data.email).first()
    if not user or not auth.verify_password(data.password, user.password):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Esta cuenta ha sido deshabilitada")

    token = auth.create_access_token({"sub": str(user.id), "role": user.role})
    return {"access_token": token, "token_type": "bearer", "expires_in_minutes": 5}

@router.post("/logout")
def logout():
    return {"detail": "Sesión cerrada. Elimina el token del cliente."}
