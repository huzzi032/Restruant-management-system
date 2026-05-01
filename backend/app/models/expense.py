"""
Expense and Supplier models
"""
from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, DateTime, Date, Enum
from sqlalchemy.orm import relationship
from datetime import datetime, date
import enum

from app.core.database import Base


class ExpenseCategory(str, enum.Enum):
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


class Expense(Base):
    """Business expense record"""
    __tablename__ = "expenses"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Tenant isolation
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=True, index=True)

    # Expense info
    category = Column(Enum(ExpenseCategory), nullable=False)
    description = Column(Text, nullable=False)
    amount = Column(Float, nullable=False)
    
    # Date
    expense_date = Column(Date, default=date.today)
    
    # Payment
    payment_method = Column(String(50), default="cash")
    
    # Receipt/Invoice
    receipt_number = Column(String(100), nullable=True)
    receipt_image = Column(String(500), nullable=True)
    
    # Supplier (optional)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True)
    
    # Notes
    notes = Column(Text, nullable=True)
    
    # User who recorded
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Tracking
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    supplier = relationship("Supplier", back_populates="expenses")
    user = relationship("User")
    
    def __repr__(self):
        return f"<Expense {self.category} - ${self.amount}>"
    
    def to_dict(self):
        return {
            "id": self.id,
            "category": self.category.value,
            "description": self.description,
            "amount": round(self.amount, 2),
            "expense_date": self.expense_date.isoformat() if self.expense_date else None,
            "payment_method": self.payment_method,
            "receipt_number": self.receipt_number,
            "receipt_image": self.receipt_image,
            "supplier_id": self.supplier_id,
            "supplier_name": self.supplier.name if self.supplier else None,
            "notes": self.notes,
            "created_by": self.created_by,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class Supplier(Base):
    """Supplier/Vendor record"""
    __tablename__ = "suppliers"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    contact_person = Column(String(100), nullable=True)
    
    # Contact info
    email = Column(String(100), nullable=True)
    phone = Column(String(20), nullable=True)
    address = Column(Text, nullable=True)
    
    # Business info
    tax_id = Column(String(100), nullable=True)
    
    # Payment terms
    payment_terms = Column(String(200), nullable=True)  # e.g., "Net 30"
    
    # Status
    is_active = Column(Enum("active", "inactive", name="supplier_status"), default="active")
    
    # Notes
    notes = Column(Text, nullable=True)
    
    # Tracking
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    expenses = relationship("Expense", back_populates="supplier")
    inventory_items = relationship("InventoryItem", back_populates="supplier")
    purchase_orders = relationship("PurchaseOrder", back_populates="supplier")
    
    def __repr__(self):
        return f"<Supplier {self.name}>"
    
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "contact_person": self.contact_person,
            "email": self.email,
            "phone": self.phone,
            "address": self.address,
            "tax_id": self.tax_id,
            "payment_terms": self.payment_terms,
            "is_active": self.is_active,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
