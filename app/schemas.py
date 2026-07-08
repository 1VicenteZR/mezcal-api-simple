from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from .models import RoleEnum

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    role: Optional[RoleEnum] = RoleEnum.usuario

class UserOut(BaseModel):
    id: int
    email: EmailStr
    full_name: Optional[str]
    role: RoleEnum
    created_at: datetime

    class Config:
        orm_mode = True

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[RoleEnum] = None

class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: int
    stock: int = 0
    tipo_mezcal: Optional[str] = None
    region: Optional[str] = None
    abv: Optional[int] = None

class ProductOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    price: int
    stock: int
    tipo_mezcal: Optional[str]
    region: Optional[str]
    abv: Optional[int]
    created_at: datetime

    class Config:
        orm_mode = True

class ReviewCreate(BaseModel):
    product_id: int
    user_id: int
    rating: int
    comment: Optional[str] = None

class ReviewOut(BaseModel):
    id: int
    product_id: int
    user_id: int
    rating: int
    comment: Optional[str]
    created_at: datetime

    class Config:
        orm_mode = True

class CartItemCreate(BaseModel):
    user_id: int
    product_id: int
    quantity: int = 1

class CartItemOut(BaseModel):
    id: int
    product_id: int
    quantity: int
    created_at: datetime

    class Config:
        orm_mode = True

class OrderItemOut(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: int

    class Config:
        orm_mode = True

class OrderOut(BaseModel):
    id: int
    total: int
    status: str
    created_at: datetime
    items: list[OrderItemOut] = []

    class Config:
        orm_mode = True

class ReviewCreateSimple(BaseModel):
    product_id: int
    rating: int
    comment: Optional[str] = None

class CartItemAdd(BaseModel):
    product_id: int
    quantity: int = 1
