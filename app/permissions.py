from fastapi import Depends, HTTPException, Query
from sqlalchemy.orm import Session

from . import models
from .database import get_db

def get_current_user_simulado(actor_id: int = Query(..., description="ID usuario que hace la petición, simula sesión sin JWT"), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == actor_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user

def require_role_simulado(*roles):
    def checker(user: models.User = Depends(get_current_user_simulado)):
        if user.role not in roles:
            raise HTTPException(status_code=403, detail=f"Requiere rol: {roles}")
        return user
    return checker
