"""
Inventory management models
"""
from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, DateTime, Enum, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.core.database import Base


class InventoryTransactionType(str, enum.Enum):
    IN = "in"  # Stock added
    OUT = "out"  # Stock used/deducted
    ADJUSTMENT = "adjustment"  # Manual adjustment
    WASTAGE = "wastage"  # Spoiled/wasted


class InventoryItem(Base):
    """Raw material / grocery item"""
    __tablename__ = "inventory_items"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Tenant isolation
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=True, index=True)

    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    
    # Quantity tracking
    quantity = Column(Float, default=0.0)
    unit = Column(String(50), default="pcs")  # kg, liter, pcs, etc.
    
    # Cost tracking
    cost_per_unit = Column(Float, default=0.0)
    
    # Stock levels
    min_stock_level = Column(Float, default=10.0)  # Alert when below this
    max_stock_level = Column(Float, default=100.0)
    reorder_point = Column(Float, default=20.0)
    
    # Supplier
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True)
    
    # Tracking
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    transactions = relationship("InventoryTransaction", back_populates="inventory_item")
    menu_usage = relationship("MenuItemIngredient", back_populates="inventory_item")
    supplier = relationship("Supplier", back_populates="inventory_items")
    purchase_orders = relationship("PurchaseOrder", back_populates="inventory_item")
    
    def __repr__(self):
        return f"<InventoryItem {self.name} - {self.quantity} {self.unit}>"
    
    @property
    def stock_value(self) -> float:
        """Calculate total value of current stock"""
        return self.quantity * self.cost_per_unit
    
    @property
    def is_low_stock(self) -> bool:
        """Check if stock is below minimum level"""
        return self.quantity <= self.min_stock_level
    
    @property
    def stock_status(self) -> str:
        """Get stock status"""
        if self.quantity <= 0:
            return "out_of_stock"
        elif self.quantity <= self.min_stock_level:
            return "low_stock"
        elif self.quantity <= self.reorder_point:
            return "reorder"
        return "adequate"
    
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "quantity": self.quantity,
            "unit": self.unit,
            "cost_per_unit": round(self.cost_per_unit, 2),
            "stock_value": round(self.stock_value, 2),
            "min_stock_level": self.min_stock_level,
            "max_stock_level": self.max_stock_level,
            "reorder_point": self.reorder_point,
            "supplier_id": self.supplier_id,
            "supplier_name": self.supplier.name if self.supplier else None,
            "is_active": self.is_active,
            "is_low_stock": self.is_low_stock,
            "stock_status": self.stock_status,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class InventoryTransaction(Base):
    """Stock movement transaction"""
    __tablename__ = "inventory_transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    inventory_item_id = Column(Integer, ForeignKey("inventory_items.id"), nullable=False)
    
    transaction_type = Column(Enum(InventoryTransactionType), nullable=False)
    quantity = Column(Float, nullable=False)  # Positive for IN, negative for OUT
    
    # Reference
    reference_type = Column(String(50), nullable=True)  # order, purchase, adjustment
    reference_id = Column(Integer, nullable=True)
    
    # Cost at time of transaction
    unit_cost = Column(Float, default=0.0)
    total_cost = Column(Float, default=0.0)
    
    # Notes
    notes = Column(Text, nullable=True)
    
    # User who made the transaction
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Timestamp
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    inventory_item = relationship("InventoryItem", back_populates="transactions")
    user = relationship("User")
    
    def __repr__(self):
        return f"<InventoryTransaction {self.transaction_type} - {self.quantity}>"
    
    def to_dict(self):
        return {
            "id": self.id,
            "inventory_item_id": self.inventory_item_id,
            "inventory_item_name": self.inventory_item.name if self.inventory_item else None,
            "transaction_type": self.transaction_type.value,
            "quantity": self.quantity,
            "reference_type": self.reference_type,
            "reference_id": self.reference_id,
            "unit_cost": round(self.unit_cost, 2),
            "total_cost": round(self.total_cost, 2),
            "notes": self.notes,
            "created_by": self.created_by,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class PurchaseOrder(Base):
    """Purchase order for inventory"""
    __tablename__ = "purchase_orders"
    
    id = Column(Integer, primary_key=True, index=True)
    inventory_item_id = Column(Integer, ForeignKey("inventory_items.id"), nullable=False)
    
    quantity = Column(Float, nullable=False)
    unit_cost = Column(Float, nullable=False)
    total_cost = Column(Float, nullable=False)
    
    # Supplier
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True)
    
    # Status
    status = Column(String(20), default="pending")  # pending, ordered, received, cancelled
    
    # Dates
    order_date = Column(DateTime, default=datetime.utcnow)
    expected_date = Column(DateTime, nullable=True)
    received_date = Column(DateTime, nullable=True)
    
    # Notes
    notes = Column(Text, nullable=True)
    
    # Relationships
    inventory_item = relationship("InventoryItem", back_populates="purchase_orders")
    supplier = relationship("Supplier", back_populates="purchase_orders")
    
    def __repr__(self):
        return f"<PurchaseOrder {self.inventory_item.name if self.inventory_item else 'Unknown'} - {self.status}>"
    
    def to_dict(self):
        return {
            "id": self.id,
            "inventory_item_id": self.inventory_item_id,
            "inventory_item_name": self.inventory_item.name if self.inventory_item else None,
            "quantity": self.quantity,
            "unit": self.inventory_item.unit if self.inventory_item else None,
            "unit_cost": round(self.unit_cost, 2),
            "total_cost": round(self.total_cost, 2),
            "supplier_id": self.supplier_id,
            "supplier_name": self.supplier.name if self.supplier else None,
            "status": self.status,
            "order_date": self.order_date.isoformat() if self.order_date else None,
            "expected_date": self.expected_date.isoformat() if self.expected_date else None,
            "received_date": self.received_date.isoformat() if self.received_date else None,
            "notes": self.notes
        }
