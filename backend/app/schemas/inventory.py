"""
Inventory schemas
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class TransactionType(str, Enum):
    IN = "in"
    OUT = "out"
    ADJUSTMENT = "adjustment"
    WASTAGE = "wastage"


# Inventory Item Schemas
class InventoryItemBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    quantity: float = Field(default=0.0, ge=0)
    unit: str = Field(default="pcs")
    cost_per_unit: float = Field(default=0.0, ge=0)
    min_stock_level: float = Field(default=10.0, ge=0)
    max_stock_level: float = Field(default=100.0, ge=0)
    reorder_point: float = Field(default=20.0, ge=0)
    supplier_id: Optional[int] = None
    is_active: bool = True


class InventoryItemCreate(InventoryItemBase):
    pass


class InventoryItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    quantity: Optional[float] = Field(default=None, ge=0)
    unit: Optional[str] = None
    cost_per_unit: Optional[float] = Field(default=None, ge=0)
    min_stock_level: Optional[float] = Field(default=None, ge=0)
    max_stock_level: Optional[float] = Field(default=None, ge=0)
    reorder_point: Optional[float] = Field(default=None, ge=0)
    supplier_id: Optional[int] = None
    is_active: Optional[bool] = None


class InventoryItemResponse(InventoryItemBase):
    id: int
    stock_value: float
    supplier_name: Optional[str] = None
    is_low_stock: bool
    stock_status: str
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# Inventory Transaction Schemas
class InventoryTransactionBase(BaseModel):
    inventory_item_id: int
    transaction_type: TransactionType
    quantity: float
    reference_type: Optional[str] = None
    reference_id: Optional[int] = None
    notes: Optional[str] = None


class InventoryTransactionCreate(InventoryTransactionBase):
    pass


class InventoryTransactionResponse(InventoryTransactionBase):
    id: int
    inventory_item_name: Optional[str] = None
    unit_cost: float
    total_cost: float
    created_by: Optional[int] = None
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# Purchase Order Schemas
class PurchaseOrderBase(BaseModel):
    inventory_item_id: int
    quantity: float = Field(..., gt=0)
    unit_cost: float = Field(..., gt=0)
    supplier_id: Optional[int] = None
    expected_date: Optional[datetime] = None
    notes: Optional[str] = None


class PurchaseOrderCreate(PurchaseOrderBase):
    pass


class PurchaseOrderUpdate(BaseModel):
    quantity: Optional[float] = Field(default=None, gt=0)
    unit_cost: Optional[float] = Field(default=None, gt=0)
    status: Optional[str] = None
    expected_date: Optional[datetime] = None
    notes: Optional[str] = None


class PurchaseOrderResponse(PurchaseOrderBase):
    id: int
    total_cost: float
    status: str
    inventory_item_name: Optional[str] = None
    unit: Optional[str] = None
    supplier_name: Optional[str] = None
    order_date: Optional[datetime] = None
    received_date: Optional[datetime] = None
    
    class Config:
        from_attributes = True
