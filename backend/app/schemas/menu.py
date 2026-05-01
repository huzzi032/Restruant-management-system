"""
Menu schemas
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# Category Schemas
class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    sort_order: int = 0
    is_active: bool = True


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None


class CategoryResponse(CategoryBase):
    id: int
    item_count: int = 0
    
    model_config = {"from_attributes": True}


# Menu Item Ingredient Schemas
class MenuItemIngredientBase(BaseModel):
    inventory_item_id: int
    quantity_required: float = Field(default=1.0, gt=0)


class MenuItemIngredientCreate(MenuItemIngredientBase):
    pass


class MenuItemIngredientResponse(MenuItemIngredientBase):
    id: int
    name: Optional[str] = None
    unit: Optional[str] = None
    
    model_config = {"from_attributes": True}


# Menu Item Schemas
class MenuItemBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    price: float = Field(..., gt=0)
    cost: float = Field(default=0.0, ge=0)
    category_id: int
    is_available: bool = True
    is_vegetarian: bool = False
    is_spicy: bool = False
    preparation_time: int = Field(default=15, ge=1)
    image_url: Optional[str] = None


class MenuItemCreate(MenuItemBase):
    ingredients: Optional[List[MenuItemIngredientCreate]] = []


class MenuItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = Field(default=None, gt=0)
    cost: Optional[float] = Field(default=None, ge=0)
    category_id: Optional[int] = None
    is_available: Optional[bool] = None
    is_vegetarian: Optional[bool] = None
    is_spicy: Optional[bool] = None
    preparation_time: Optional[int] = Field(default=None, ge=1)
    image_url: Optional[str] = None
    ingredients: Optional[List[MenuItemIngredientCreate]] = None


class MenuItemResponse(MenuItemBase):
    id: int
    profit_margin: float
    category_name: Optional[str] = None
    ingredients: List[MenuItemIngredientResponse] = []
    created_at: Optional[datetime] = None
    
    model_config = {"from_attributes": True}
