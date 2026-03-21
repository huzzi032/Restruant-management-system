"""
Table management model
"""
from sqlalchemy import Column, Integer, String, Enum, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.core.database import Base


class TableStatus(str, enum.Enum):
    AVAILABLE = "available"
    OCCUPIED = "occupied"
    RESERVED = "reserved"
    CLEANING = "cleaning"


class Table(Base):
    """Restaurant table"""
    __tablename__ = "tables"
    
    id = Column(Integer, primary_key=True, index=True)
    table_number = Column(String(20), unique=True, nullable=False)
    capacity = Column(Integer, default=4)
    status = Column(Enum(TableStatus), default=TableStatus.AVAILABLE)
    location = Column(String(100), nullable=True)  # e.g., "Indoor", "Outdoor", "Balcony"
    
    # Current order (if occupied)
    current_order_id = Column(Integer, nullable=True)
    
    # Notes
    notes = Column(Text, nullable=True)
    
    # Tracking
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    orders = relationship("Order", back_populates="table")
    
    def __repr__(self):
        return f"<Table {self.table_number} - {self.status}>"
    
    def to_dict(self):
        return {
            "id": self.id,
            "table_number": self.table_number,
            "capacity": self.capacity,
            "status": self.status.value,
            "location": self.location,
            "current_order_id": self.current_order_id,
            "notes": self.notes
        }
