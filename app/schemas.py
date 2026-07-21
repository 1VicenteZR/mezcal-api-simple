from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from .models import RoleEnum, OrderStatusEnum

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
    is_active: bool
    created_at: datetime

    class Config:
        orm_mode = True

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[RoleEnum] = None
    is_active: Optional[bool] = None

class UserSelfUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None

class CategoryCreate(BaseModel):
    name: str

class CategoryOut(BaseModel):
    id: int
    name: str

    class Config:
        orm_mode = True

class BrandCreate(BaseModel):
    name: str

class BrandOut(BaseModel):
    id: int
    name: str

    class Config:
        orm_mode = True

class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: int
    stock: int = 0
    tipo_mezcal: Optional[str] = None
    region: Optional[str] = None
    abv: Optional[int] = None
    imagen_url: Optional[str] = None

class ProductOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    price: int
    stock: int
    tipo_mezcal: Optional[str]
    region: Optional[str]
    abv: Optional[int]
    imagen_url: Optional[str]
    created_at: datetime
    avg_rating: Optional[float] = None

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
    user_name: Optional[str] = None
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

class CartItemDetailOut(BaseModel):
    id: int
    product_id: int
    product_name: str
    product_price: int
    product_stock: int
    imagen_url: Optional[str] = None
    quantity: int
    created_at: datetime

class CartItemUpdate(BaseModel):
    quantity: int

class FavoriteCreate(BaseModel):
    product_id: int

class FavoriteProductOut(BaseModel):
    id: int
    product_id: int
    product_name: str
    product_price: int
    product_stock: int
    imagen_url: Optional[str] = None
    tipo_mezcal: Optional[str] = None
    description: Optional[str] = None
    abv: Optional[int] = None
    created_at: datetime

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

class OrderItemMineOut(BaseModel):
    id: int
    product_id: int
    product_name: str
    imagen_url: Optional[str] = None
    quantity: int
    unit_price: int

class OrderMineOut(BaseModel):
    id: int
    total: int
    status: str
    created_at: datetime
    items: list[OrderItemMineOut] = []

class OrderItemAdminOut(BaseModel):
    id: int
    product_id: int
    product_name: str
    quantity: int
    unit_price: int

class OrderCustomerOut(BaseModel):
    id: int
    email: EmailStr
    full_name: Optional[str]

class OrderAdminOut(BaseModel):
    id: int
    total: int
    status: str
    created_at: datetime
    items: list[OrderItemAdminOut] = []
    customer: Optional[OrderCustomerOut] = None

class DirectCheckoutRequest(BaseModel):
    product_id: int
    quantity: int = 1

class OrderStatusUpdate(BaseModel):
    status: OrderStatusEnum

class ReviewCreateSimple(BaseModel):
    product_id: int
    rating: int
    comment: Optional[str] = None

class ReviewUpdate(BaseModel):
    rating: Optional[int] = None
    comment: Optional[str] = None

class CartItemAdd(BaseModel):
    product_id: int
    quantity: int = 1

class TopSellingProductOut(BaseModel):
    product_id: int
    name: str
    total_quantity: int

class TopRatedProductOut(BaseModel):
    product_id: int
    name: str
    avg_rating: float
    review_count: int

class ReviewAdminOut(BaseModel):
    id: int
    product_id: int
    product_name: str
    user_id: int
    user_email: Optional[str] = None
    rating: int
    comment: Optional[str]
    created_at: datetime
