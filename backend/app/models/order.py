"""
Order models - Orders and Order Items
"""
from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, DateTime, Enum, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.core.database import Base


class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    IN_KITCHEN = "in_kitchen"
    COOKING = "cooking"
    READY = "ready"
    SERVED = "served"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class OrderType(str, enum.Enum):
    DINE_IN = "dine_in"
    TAKEAWAY = "takeaway"
    DELIVERY = "delivery"


class Order(Base):
    """Customer order"""
    __tablename__ = "orders"
    
    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(50), unique=True, nullable=False)
    
    # Order type
    order_type = Column(Enum(OrderType), default=OrderType.DINE_IN)
    
    # Table (for dine-in)
    table_id = Column(Integer, ForeignKey("tables.id"), nullable=True)
    
    # Customer info (for takeaway/delivery)
    customer_name = Column(String(100), nullable=True)
    customer_phone = Column(String(20), nullable=True)
    customer_address = Column(Text, nullable=True)
    
    # Status
    status = Column(Enum(OrderStatus), default=OrderStatus.PENDING)
    
    # Financial
    subtotal = Column(Float, default=0.0)
    tax_amount = Column(Float, default=0.0)
    discount_amount = Column(Float, default=0.0)
    total_amount = Column(Float, default=0.0)
    
    # Discount info
    discount_type = Column(String(20), nullable=True)  # percentage, fixed
    discount_value = Column(Float, default=0.0)
    
    # Special instructions
    special_instructions = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    kitchen_started_at = Column(DateTime, nullable=True)
    ready_at = Column(DateTime, nullable=True)
    served_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    
    # Users
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    updated_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Cancellation
    cancelled_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    cancellation_reason = Column(Text, nullable=True)
    
    # Relationships
    table = relationship("Table", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    payment = relationship("Payment", back_populates="order", uselist=False)
    creator = relationship("User", foreign_keys=[created_by], back_populates="orders_created")
    updater = relationship("User", foreign_keys=[updated_by], back_populates="orders_updated")
    
    def __repr__(self):
        return f"<Order {self.order_number} - {self.status}>"
    
    @property
    def item_count(self) -> int:
        """Total number of items in order"""
        return sum(item.quantity for item in self.items if not item.is_voided) if self.items else 0
    
    @property
    def preparation_time(self) -> int:
        """Calculate preparation time in minutes"""
        if self.kitchen_started_at and self.ready_at:
            delta = self.ready_at - self.kitchen_started_at
            return int(delta.total_seconds() / 60)
        return 0
    
    def calculate_totals(self, tax_rate: float = 0.10):
        """Calculate order totals"""
        self.subtotal = sum(item.total_price for item in self.items if not item.is_voided) if self.items else 0
        
        # Apply discount
        if self.discount_type == "percentage" and self.discount_value > 0:
            self.discount_amount = self.subtotal * (self.discount_value / 100)
        elif self.discount_type == "fixed":
            self.discount_amount = min(self.discount_value, self.subtotal)
        else:
            self.discount_amount = 0
        
        # Calculate tax
        taxable_amount = self.subtotal - self.discount_amount
        self.tax_amount = taxable_amount * tax_rate
        
        # Total
        self.total_amount = taxable_amount + self.tax_amount
        
        return self.total_amount
    
    def to_dict(self, include_items=False):
        data = {
            "id": self.id,
            "order_number": self.order_number,
            "order_type": self.order_type.value,
            "table_id": self.table_id,
            "table_number": self.table.table_number if self.table else None,
            "customer_name": self.customer_name,
            "customer_phone": self.customer_phone,
            "status": self.status.value,
            "subtotal": round(self.subtotal, 2),
            "tax_amount": round(self.tax_amount, 2),
            "discount_amount": round(self.discount_amount, 2),
            "total_amount": round(self.total_amount, 2),
            "discount_type": self.discount_type,
            "discount_value": self.discount_value,
            "special_instructions": self.special_instructions,
            "item_count": self.item_count,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "kitchen_started_at": self.kitchen_started_at.isoformat() if self.kitchen_started_at else None,
            "ready_at": self.ready_at.isoformat() if self.ready_at else None,
            "served_at": self.served_at.isoformat() if self.served_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "created_by": self.created_by,
            "creator_name": self.creator.full_name if self.creator else None
        }
        
        if include_items:
            data["items"] = [item.to_dict() for item in self.items if not item.is_voided] if self.items else []
        
        return data


class OrderItem(Base):
    """Individual item in an order"""
    __tablename__ = "order_items"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    menu_item_id = Column(Integer, ForeignKey("menu_items.id"), nullable=False)
    
    quantity = Column(Integer, default=1)
    unit_price = Column(Float, nullable=False)
    total_price = Column(Float, nullable=False)
    
    # Special instructions for this item
    special_instructions = Column(Text, nullable=True)
    
    # Status tracking
    is_voided = Column(Boolean, default=False)
    void_reason = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    order = relationship("Order", back_populates="items")
    menu_item = relationship("MenuItem", back_populates="order_items")
    
    def __repr__(self):
        return f"<OrderItem {self.menu_item.name if self.menu_item else 'Unknown'} x{self.quantity}>"
    
    def to_dict(self):
        return {
            "id": self.id,
            "order_id": self.order_id,
            "menu_item_id": self.menu_item_id,
            "menu_item_name": self.menu_item.name if self.menu_item else "Unknown",
            "menu_item_image": self.menu_item.image_url if self.menu_item else None,
            "quantity": self.quantity,
            "unit_price": round(self.unit_price, 2),
            "total_price": round(self.total_price, 2),
            "special_instructions": self.special_instructions,
            "is_voided": self.is_voided,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
