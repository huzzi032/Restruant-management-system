"""
Menu management router
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from io import BytesIO
import base64
import qrcode
import os
import time

from app.core.database import get_db
from app.core.security import get_current_user, require_manager, require_staff
from app.core.config import settings
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


@router.get("/public/categories", response_model=List[CategoryResponse])
def get_public_categories(
    db: Session = Depends(get_db)
):
    """Public categories endpoint for customer menu."""
    categories = MenuService.get_categories(db, include_inactive=False)
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


@router.get("/public/items", response_model=List[MenuItemResponse])
def get_public_menu_items(
    category_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Public menu endpoint for customer QR menu."""
    items = MenuService.get_menu_items(
        db,
        category_id=category_id,
        available_only=True,
        search=search,
    )
    return [item.to_dict(include_ingredients=True) for item in items]


@router.get("/public/qr-code")
def get_public_menu_qr(
    request: Request,
    size: int = Query(240, ge=120, le=640)
):
    """Generate QR image for public menu URL."""
    menu_url = settings.PUBLIC_MENU_URL
    if "localhost" in menu_url or "127.0.0.1" in menu_url:
        origin = str(request.base_url).rstrip("/")
        menu_url = f"{origin.replace(':8000', ':5173')}/menu/public"

    qr = qrcode.QRCode(version=1, box_size=10, border=2)
    qr.add_data(menu_url)
    qr.make(fit=True)

    image = qr.make_image(fill_color="black", back_color="white").resize((size, size))
    buffer = BytesIO()
    image.save(buffer, format="PNG")

    return {
        "menu_url": menu_url,
        "qr_code_base64": base64.b64encode(buffer.getvalue()).decode("utf-8"),
        "content_type": "image/png",
    }


@router.get("/public/qr-code/image")
def get_public_menu_qr_image(
    request: Request,
    size: int = Query(240, ge=120, le=640)
):
    """Generate raw QR PNG image for public menu URL."""
    menu_url = settings.PUBLIC_MENU_URL
    if "localhost" in menu_url or "127.0.0.1" in menu_url:
        origin = str(request.base_url).rstrip("/")
        menu_url = f"{origin.replace(':8000', ':5173')}/menu/public"

    qr = qrcode.QRCode(version=1, box_size=10, border=2)
    qr.add_data(menu_url)
    qr.make(fit=True)

    image = qr.make_image(fill_color="black", back_color="white").resize((size, size))
    buffer = BytesIO()
    image.save(buffer, format="PNG")
    buffer.seek(0)
    return StreamingResponse(buffer, media_type="image/png")


@router.post("/upload-image")
def upload_menu_image(
    image: UploadFile = File(...),
    current_user: User = Depends(require_manager),
):
    """Upload a menu item image and return a URL that frontend can use."""
    content_type = (image.content_type or "").lower()
    if content_type not in {"image/jpeg", "image/png", "image/webp", "image/jpg"}:
        raise HTTPException(status_code=400, detail="Only JPG, PNG, or WEBP files are allowed")

    ext = os.path.splitext(image.filename or "")[1].lower() or ".png"
    if ext not in {".jpg", ".jpeg", ".png", ".webp"}:
        ext = ".png"

    menu_dir = os.path.join(settings.UPLOAD_DIR, "menu")
    os.makedirs(menu_dir, exist_ok=True)

    filename = f"menu_{int(time.time() * 1000)}{ext}"
    file_path = os.path.join(menu_dir, filename)
    with open(file_path, "wb") as out:
        out.write(image.file.read())

    relative_url = f"/uploads/menu/{filename}"
    return {
        "image_url": relative_url,
        "absolute_url": f"http://localhost:8000{relative_url}",
    }


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
