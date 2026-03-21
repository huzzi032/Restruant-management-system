"""
Menu models - Categories, Menu Items, and Ingredients
"""
from sqlalchemy import Column, Integer, String, Float, Boolean, Text, ForeignKey, DateTime, Table
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base


class Category(Base):
    """Menu category (Fast Food, Desi, BBQ, Drinks, etc.)"""
    __tablename__ = "categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    sort_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    items = relationship("MenuItem", back_populates="category")
    
    def __repr__(self):
        return f"<Category {self.name}>"
    
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "sort_order": self.sort_order,
            "is_active": self.is_active,
            "item_count": len(self.items) if self.items else 0
        }


class MenuItemIngredient(Base):
    """Link between MenuItem and InventoryItem (ingredients)"""
    __tablename__ = "menu_item_ingredients"
    
    id = Column(Integer, primary_key=True, index=True)
    menu_item_id = Column(Integer, ForeignKey("menu_items.id"), nullable=False)
    inventory_item_id = Column(Integer, ForeignKey("inventory_items.id"), nullable=False)
    quantity_required = Column(Float, default=1.0)  # Amount needed per serving
    
    # Relationships
    menu_item = relationship("MenuItem", back_populates="ingredients_link")
    inventory_item = relationship("InventoryItem", back_populates="menu_usage")


class MenuItem(Base):
    """Menu item / dish"""
    __tablename__ = "menu_items"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    
    # Pricing
    price = Column(Float, nullable=False)  # Selling price
    cost = Column(Float, default=0.0)  # Cost to make (for profit calc)
    
    # Category
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    
    # Status
    is_available = Column(Boolean, default=True)
    is_vegetarian = Column(Boolean, default=False)
    is_spicy = Column(Boolean, default=False)
    
    # Preparation
    preparation_time = Column(Integer, default=15)  # Minutes
    
    # Media
    image_url = Column(String(500), nullable=True)
    
    # Tracking
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    category = relationship("Category", back_populates="items")
    ingredients_link = relationship("MenuItemIngredient", back_populates="menu_item", cascade="all, delete-orphan")
    order_items = relationship("OrderItem", back_populates="menu_item")
    
    def __repr__(self):
        return f"<MenuItem {self.name} - ${self.price}>"
    
    @property
    def profit_margin(self) -> float:
        """Calculate profit margin percentage"""
        if self.price > 0:
            return ((self.price - self.cost) / self.price) * 100
        return 0
    
    @property
    def ingredients(self):
        """Get list of ingredients with details"""
        return [
            {
                "id": ing.inventory_item_id,
                "name": ing.inventory_item.name if ing.inventory_item else None,
                "quantity_required": ing.quantity_required,
                "unit": ing.inventory_item.unit if ing.inventory_item else None
            }
            for ing in self.ingredients_link
        ]
    
    def to_dict(self, include_ingredients=False):
        data = {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "price": self.price,
            "cost": self.cost,
            "profit_margin": round(self.profit_margin, 2),
            "category_id": self.category_id,
            "category_name": self.category.name if self.category else None,
            "is_available": self.is_available,
            "is_vegetarian": self.is_vegetarian,
            "is_spicy": self.is_spicy,
            "preparation_time": self.preparation_time,
            "image_url": self.image_url,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
        
        if include_ingredients:
            data["ingredients"] = self.ingredients
        
        return data
