"""
Menu management router
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.core.security import get_current_user, require_manager, require_staff
from app.schemas.menu import (
    CategoryCreate, CategoryUpdate, CategoryResponse,
    MenuItemCreate, MenuItemUpdate, MenuItemResponse
)
from app.services.menu_service import MenuService
from app.models.user import User

router = APIRouter()


# ========== Category Endpoints ==========

@router.get("/categories", response_model=List[CategoryResponse])
def get_categories(
    include_inactive: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all categories"""
    categories = MenuService.get_categories(db, include_inactive=include_inactive)
    return [cat.to_dict() for cat in categories]


@router.get("/categories/{category_id}", response_model=CategoryResponse)
def get_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get category by ID"""
    category = MenuService.get_category_by_id(db, category_id)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    return category.to_dict()


@router.post("/categories", response_model=CategoryResponse)
def create_category(
    category_data: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Create new category (manager and above)"""
    category = MenuService.create_category(db, category_data)
    return category.to_dict()


@router.put("/categories/{category_id}", response_model=CategoryResponse)
def update_category(
    category_id: int,
    category_data: CategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Update category (manager and above)"""
    category = MenuService.update_category(db, category_id, category_data)
    return category.to_dict()


@router.delete("/categories/{category_id}")
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Delete category (manager and above)"""
    MenuService.delete_category(db, category_id)
    return {"message": "Category deleted successfully"}


# ========== Menu Item Endpoints ==========

@router.get("/items", response_model=List[MenuItemResponse])
def get_menu_items(
    category_id: Optional[int] = Query(None),
    available_only: bool = Query(True),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get menu items with filtering"""
    items = MenuService.get_menu_items(
        db,
        category_id=category_id,
        available_only=available_only,
        search=search
    )
    return [item.to_dict(include_ingredients=True) for item in items]


@router.get("/items/{item_id}", response_model=MenuItemResponse)
def get_menu_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get menu item by ID"""
    item = MenuService.get_menu_item_by_id(db, item_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Menu item not found"
        )
    return item.to_dict(include_ingredients=True)


@router.post("/items", response_model=MenuItemResponse)
def create_menu_item(
    item_data: MenuItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Create new menu item (manager and above)"""
    item = MenuService.create_menu_item(db, item_data)
    return item.to_dict(include_ingredients=True)


@router.put("/items/{item_id}", response_model=MenuItemResponse)
def update_menu_item(
    item_id: int,
    item_data: MenuItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Update menu item (manager and above)"""
    item = MenuService.update_menu_item(db, item_id, item_data)
    return item.to_dict(include_ingredients=True)


@router.delete("/items/{item_id}")
def delete_menu_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Delete menu item (manager and above)"""
    MenuService.delete_menu_item(db, item_id)
    return {"message": "Menu item deleted successfully"}


@router.patch("/items/{item_id}/toggle-availability")
def toggle_availability(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """Toggle menu item availability"""
    item = MenuService.toggle_availability(db, item_id)
    return {
        "message": f"Item is now {'available' if item.is_available else 'unavailable'}",
        "is_available": item.is_available
    }


@router.get("/analytics/top-selling")
def get_top_selling_items(
    limit: int = Query(10, ge=1, le=50),
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Get top selling items"""
    items = MenuService.get_top_selling_items(db, limit=limit, days=days)
    return {"top_items": items}
