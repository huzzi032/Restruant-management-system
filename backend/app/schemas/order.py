"""
Order schemas
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class OrderType(str, Enum):
    DINE_IN = "dine_in"
    TAKEAWAY = "takeaway"
    DELIVERY = "delivery"


class OrderStatus(str, Enum):
    PENDING = "pending"
    IN_KITCHEN = "in_kitchen"
    COOKING = "cooking"
    READY = "ready"
    SERVED = "served"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


# Order Item Schemas
class OrderItemBase(BaseModel):
    menu_item_id: int
    quantity: int = Field(..., gt=0)
    special_instructions: Optional[str] = None


class OrderItemCreate(OrderItemBase):
    pass


class OrderItemResponse(OrderItemBase):
    id: int
    order_id: int
    menu_item_name: str
    menu_item_image: Optional[str] = None
    unit_price: float
    total_price: float
    is_voided: bool
    created_at: Optional[datetime] = None
    
    model_config = {"from_attributes": True}


# Order Schemas
class OrderBase(BaseModel):
    order_type: OrderType = OrderType.DINE_IN
    table_id: Optional[int] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_address: Optional[str] = None
    special_instructions: Optional[str] = None


class OrderCreate(OrderBase):
    items: List[OrderItemCreate]
    discount_type: Optional[str] = None  # percentage, fixed
    discount_value: Optional[float] = Field(default=0.0, ge=0)


class OrderUpdate(BaseModel):
    table_id: Optional[int] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_address: Optional[str] = None
    special_instructions: Optional[str] = None
    discount_type: Optional[str] = None
    discount_value: Optional[float] = Field(default=None, ge=0)


class OrderStatusUpdate(BaseModel):
    status: OrderStatus
    reason: Optional[str] = None


class OrderResponse(OrderBase):
    id: int
    order_number: str
    status: OrderStatus
    table_number: Optional[str] = None
    
    subtotal: float
    tax_amount: float
    discount_amount: float
    total_amount: float
    discount_type: Optional[str] = None
    discount_value: float
    
    item_count: int
    items: List[OrderItemResponse] = []
    
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    kitchen_started_at: Optional[datetime] = None
    ready_at: Optional[datetime] = None
    served_at: Optional[datetime] = None
    picked_up_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    created_by: int
    creator_name: Optional[str] = None
    picked_up_by: Optional[int] = None
    picked_up_by_name: Optional[str] = None
    
    model_config = {"from_attributes": True}


class OrderFilter(BaseModel):
    status: Optional[OrderStatus] = None
    order_type: Optional[OrderType] = None
    table_id: Optional[int] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    created_by: Optional[int] = None
