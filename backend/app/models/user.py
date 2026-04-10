"""
User model for authentication and role management
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.core.database import Base


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    WAITER = "waiter"
    CHEF = "chef"
    CASHIER = "cashier"


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=False, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=True)
    full_name = Column(String(100), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.WAITER, nullable=False)
    
    # Status
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    
    # Tracking
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    
    # Relationships
    restaurant = relationship("Restaurant", back_populates="users")
    orders_created = relationship("Order", foreign_keys="Order.created_by", back_populates="creator")
    orders_updated = relationship("Order", foreign_keys="Order.updated_by", back_populates="updater")
    payments = relationship("Payment", back_populates="cashier")
    attendance_records = relationship("Attendance", back_populates="user")
    
    def __repr__(self):
        return f"<User {self.username} - {self.role}>"
    
    def has_role(self, roles: list) -> bool:
        """Check if user has any of the given roles"""
        return self.role in roles
    
    def to_dict(self):
        return {
            "id": self.id,
            "restaurant_id": self.restaurant_id,
            "restaurant_name": self.restaurant.name if self.restaurant else None,
            "restaurant_code": self.restaurant.code if self.restaurant else None,
            "username": self.username,
            "email": self.email,
            "full_name": self.full_name,
            "role": self.role.value,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "last_login": self.last_login.isoformat() if self.last_login else None
        }
