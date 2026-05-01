"""
Payment model for order payments
"""
from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.core.database import Base


class PaymentMethod(str, enum.Enum):
    CASH = "cash"
    CARD = "card"
    ONLINE = "online"
    WALLET = "wallet"


class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"
    PARTIAL_REFUND = "partial_refund"


class Payment(Base):
    """Payment record for orders"""
    __tablename__ = "payments"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, unique=True)
    
    # Amounts
    subtotal = Column(Float, nullable=False)
    tax_amount = Column(Float, default=0.0)
    discount_amount = Column(Float, default=0.0)
    tip_amount = Column(Float, default=0.0)
    total_amount = Column(Float, nullable=False)
    
    # Payment details
    payment_method = Column(Enum(PaymentMethod), nullable=False)
    status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING)
    
    # Transaction reference
    transaction_id = Column(String(200), nullable=True)
    
    # Refund info
    refund_amount = Column(Float, default=0.0)
    refund_reason = Column(Text, nullable=True)
    refunded_at = Column(DateTime, nullable=True)
    
    # Notes
    notes = Column(Text, nullable=True)
    
    # Cashier who processed
    cashier_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    # Relationships
    order = relationship("Order", back_populates="payment")
    cashier = relationship("User", back_populates="payments")
    
    def __repr__(self):
        return f"<Payment {self.id} - {self.payment_method} - ${self.total_amount}>"
    
    def process_refund(self, amount: float, reason: str = None):
        """Process a refund"""
        if amount > self.total_amount:
            raise ValueError("Refund amount cannot exceed payment amount")
        
        self.refund_amount = amount
        self.refund_reason = reason
        self.refunded_at = datetime.utcnow()
        
        if amount == self.total_amount:
            self.status = PaymentStatus.REFUNDED
        else:
            self.status = PaymentStatus.PARTIAL_REFUND
        
        return self
    
    def to_dict(self):
        return {
            "id": self.id,
            "order_id": self.order_id,
            "order_number": self.order.order_number if self.order else None,
            "subtotal": round(self.subtotal, 2),
            "tax_amount": round(self.tax_amount, 2),
            "discount_amount": round(self.discount_amount, 2),
            "tip_amount": round(self.tip_amount, 2),
            "total_amount": round(self.total_amount, 2),
            "payment_method": self.payment_method.value,
            "status": self.status.value,
            "transaction_id": self.transaction_id,
            "refund_amount": round(self.refund_amount, 2),
            "refund_reason": self.refund_reason,
            "refunded_at": self.refunded_at.isoformat() if self.refunded_at else None,
            "notes": self.notes,
            "cashier_id": self.cashier_id,
            "cashier_name": self.cashier.full_name if self.cashier else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None
        }
