"""
Menu management service
"""
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from fastapi import HTTPException, status
from typing import List, Optional

from app.models.menu import Category, MenuItem, MenuItemIngredient
from app.models.inventory import InventoryItem
from app.schemas.menu import CategoryCreate, CategoryUpdate, MenuItemCreate, MenuItemUpdate


class MenuService:
    """Service for menu management"""
    
    # ========== Category Methods ==========
    
    @staticmethod
    def create_category(db: Session, category_data: CategoryCreate):
        """Create a new category"""
        # Check if name exists
        if db.query(Category).filter(Category.name == category_data.name).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Category name already exists"
            )
        
        db_category = Category(**category_data.model_dump())
        db.add(db_category)
        db.commit()
        db.refresh(db_category)
        return db_category
    
    @staticmethod
    def get_categories(db: Session, include_inactive: bool = False):
        """Get all categories"""
        query = db.query(Category)
        if not include_inactive:
            query = query.filter(Category.is_active == True)
        return query.order_by(Category.sort_order).all()
    
    @staticmethod
    def get_category_by_id(db: Session, category_id: int):
        """Get category by ID"""
        return db.query(Category).filter(Category.id == category_id).first()
    
    @staticmethod
    def update_category(db: Session, category_id: int, category_data: CategoryUpdate):
        """Update category"""
        category = db.query(Category).filter(Category.id == category_id).first()
        
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found"
            )
        
        update_data = category_data.model_dump(exclude_unset=True)
        
        # Check name uniqueness if updating name
        if "name" in update_data:
            existing = db.query(Category).filter(
                Category.name == update_data["name"],
                Category.id != category_id
            ).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Category name already exists"
                )
        
        for field, value in update_data.items():
            setattr(category, field, value)
        
        db.commit()
        db.refresh(category)
        return category
    
    @staticmethod
    def delete_category(db: Session, category_id: int):
        """Delete category"""
        category = db.query(Category).filter(Category.id == category_id).first()
        
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found"
            )
        
        # Check if category has items
        if category.items:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete category with existing items"
            )
        
        db.delete(category)
        db.commit()
        return True
    
    # ========== Menu Item Methods ==========
    
    @staticmethod
    def create_menu_item(db: Session, item_data: MenuItemCreate):
        """Create a new menu item"""
        # Check if category exists
        category = db.query(Category).filter(Category.id == item_data.category_id).first()
        if not category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Category not found"
            )
        
        # Create menu item
        item_dict = item_data.model_dump(exclude={"ingredients"})
        db_item = MenuItem(**item_dict)
        
        db.add(db_item)
        db.flush()  # Get the ID
        
        # Add ingredients
        if item_data.ingredients:
            for ing_data in item_data.ingredients:
                # Verify inventory item exists
                inv_item = db.query(InventoryItem).filter(
                    InventoryItem.id == ing_data.inventory_item_id
                ).first()
                if not inv_item:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Inventory item {ing_data.inventory_item_id} not found"
                    )
                
                ingredient = MenuItemIngredient(
                    menu_item_id=db_item.id,
                    inventory_item_id=ing_data.inventory_item_id,
                    quantity_required=ing_data.quantity_required
                )
                db.add(ingredient)
        
        db.commit()
        db.refresh(db_item)
        return db_item
    
    @staticmethod
    def get_menu_items(
        db: Session,
        category_id: Optional[int] = None,
        available_only: bool = True,
        search: Optional[str] = None
    ):
        """Get menu items with filtering"""
        query = db.query(MenuItem).options(
            joinedload(MenuItem.category),
            joinedload(MenuItem.ingredients_link).joinedload(MenuItemIngredient.inventory_item)
        )
        
        if category_id:
            query = query.filter(MenuItem.category_id == category_id)
        
        if available_only:
            query = query.filter(MenuItem.is_available == True)
        
        if search:
            query = query.filter(MenuItem.name.ilike(f"%{search}%"))
        
        return query.order_by(MenuItem.name).all()
    
    @staticmethod
    def get_menu_item_by_id(db: Session, item_id: int):
        """Get menu item by ID"""
        return db.query(MenuItem).options(
            joinedload(MenuItem.category),
            joinedload(MenuItem.ingredients_link).joinedload(MenuItemIngredient.inventory_item)
        ).filter(MenuItem.id == item_id).first()
    
    @staticmethod
    def update_menu_item(db: Session, item_id: int, item_data: MenuItemUpdate):
        """Update menu item"""
        item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
        
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Menu item not found"
            )
        
        update_data = item_data.model_dump(exclude_unset=True, exclude={"ingredients"})
        
        for field, value in update_data.items():
            setattr(item, field, value)
        
        # Update ingredients if provided
        if item_data.ingredients is not None:
            # Remove existing ingredients
            db.query(MenuItemIngredient).filter(
                MenuItemIngredient.menu_item_id == item_id
            ).delete()
            
            # Add new ingredients
            for ing_data in item_data.ingredients:
                ingredient = MenuItemIngredient(
                    menu_item_id=item_id,
                    inventory_item_id=ing_data.inventory_item_id,
                    quantity_required=ing_data.quantity_required
                )
                db.add(ingredient)
        
        db.commit()
        db.refresh(item)
        return item
    
    @staticmethod
    def delete_menu_item(db: Session, item_id: int):
        """Delete menu item"""
        item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
        
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Menu item not found"
            )
        
        db.delete(item)
        db.commit()
        return True
    
    @staticmethod
    def toggle_availability(db: Session, item_id: int):
        """Toggle item availability"""
        item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
        
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Menu item not found"
            )
        
        item.is_available = not item.is_available
        db.commit()
        db.refresh(item)
        return item
    
    @staticmethod
    def get_top_selling_items(db: Session, limit: int = 10, days: int = 30):
        """Get top selling menu items"""
        from app.models.order import OrderItem, Order
        from datetime import datetime, timedelta
        
        start_date = datetime.utcnow() - timedelta(days=days)
        
        results = db.query(
            MenuItem.id,
            MenuItem.name,
            func.sum(OrderItem.quantity).label('total_sold'),
            func.sum(OrderItem.total_price).label('total_revenue')
        ).join(
            OrderItem, MenuItem.id == OrderItem.menu_item_id
        ).join(
            Order, OrderItem.order_id == Order.id
        ).filter(
            Order.created_at >= start_date,
            Order.status != 'cancelled'
        ).group_by(
            MenuItem.id
        ).order_by(
            func.sum(OrderItem.quantity).desc()
        ).limit(limit).all()
        
        return [
            {
                "id": r.id,
                "name": r.name,
                "total_sold": r.total_sold or 0,
                "total_revenue": float(r.total_revenue or 0)
            }
            for r in results
        ]
