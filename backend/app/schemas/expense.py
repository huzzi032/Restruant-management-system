"""
Expense and Supplier schemas
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, date
from enum import Enum


class ExpenseCategory(str, Enum):
    RENT = "rent"
    UTILITIES = "utilities"
    SALARIES = "salaries"
    INVENTORY = "inventory"
    MAINTENANCE = "maintenance"
    MARKETING = "marketing"
    SUPPLIES = "supplies"
    TAXES = "taxes"
    INSURANCE = "insurance"
    MISCELLANEOUS = "miscellaneous"


# Expense Schemas
class ExpenseBase(BaseModel):
    category: ExpenseCategory
    description: str = Field(..., min_length=1)
    amount: float = Field(..., gt=0)
    expense_date: date = Field(default_factory=date.today)
    payment_method: str = Field(default="cash")
    receipt_number: Optional[str] = None
    supplier_id: Optional[int] = None
    notes: Optional[str] = None


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseUpdate(BaseModel):
    category: Optional[ExpenseCategory] = None
    description: Optional[str] = None
    amount: Optional[float] = Field(default=None, gt=0)
    expense_date: Optional[date] = None
    payment_method: Optional[str] = None
    receipt_number: Optional[str] = None
    supplier_id: Optional[int] = None
    notes: Optional[str] = None


class ExpenseResponse(ExpenseBase):
    id: int
    receipt_image: Optional[str] = None
    supplier_name: Optional[str] = None
    created_by: Optional[int] = None
    created_at: Optional[datetime] = None
    
    model_config = {"from_attributes": True}


# Supplier Schemas
class SupplierBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    tax_id: Optional[str] = None
    payment_terms: Optional[str] = None
    is_active: str = Field(default="active")
    notes: Optional[str] = None


class SupplierCreate(SupplierBase):
    pass


class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    tax_id: Optional[str] = None
    payment_terms: Optional[str] = None
    is_active: Optional[str] = None
    notes: Optional[str] = None


class SupplierResponse(SupplierBase):
    id: int
    created_at: Optional[datetime] = None
    
    model_config = {"from_attributes": True}
