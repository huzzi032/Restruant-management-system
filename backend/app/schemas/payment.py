"""
Payment schemas
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class PaymentMethod(str, Enum):
    CASH = "cash"
    CARD = "card"
    ONLINE = "online"
    WALLET = "wallet"


class PaymentStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"
    PARTIAL_REFUND = "partial_refund"


class PaymentBase(BaseModel):
    order_id: int
    payment_method: PaymentMethod
    tip_amount: float = Field(default=0.0, ge=0)
    notes: Optional[str] = None


class PaymentCreate(PaymentBase):
    pass


class PaymentUpdate(BaseModel):
    payment_method: Optional[PaymentMethod] = None
    status: Optional[PaymentStatus] = None
    transaction_id: Optional[str] = None
    tip_amount: Optional[float] = Field(default=None, ge=0)
    notes: Optional[str] = None


class PaymentResponse(BaseModel):
    id: int
    order_id: int
    order_number: Optional[str] = None
    subtotal: float
    tax_amount: float
    discount_amount: float
    tip_amount: float
    total_amount: float
    payment_method: PaymentMethod
    status: PaymentStatus
    transaction_id: Optional[str] = None
    refund_amount: float
    refund_reason: Optional[str] = None
    refunded_at: Optional[datetime] = None
    cashier_id: Optional[int] = None
    cashier_name: Optional[str] = None
    created_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class RefundRequest(BaseModel):
    amount: float = Field(..., gt=0)
    reason: Optional[str] = None
