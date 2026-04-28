"""
Inventory management router
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.core.security import get_current_user, require_staff, require_manager
from app.schemas.inventory import (
    InventoryItemCreate, InventoryItemUpdate, InventoryItemResponse,
    InventoryTransactionCreate, InventoryTransactionResponse,
    PurchaseOrderCreate, PurchaseOrderUpdate, PurchaseOrderResponse
)
from app.services.inventory_service import InventoryService
from app.models.user import User

router = APIRouter()


# ========== Inventory Item Endpoints ==========

@router.get("/items", response_model=List[InventoryItemResponse])
def get_inventory_items(
    low_stock_only: bool = Query(False),
    is_active: bool = Query(True),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """Get inventory items"""
    items = InventoryService.get_items(
        db,
        low_stock_only=low_stock_only,
        is_active=is_active,
        search=search
    )
    return [item.to_dict() for item in items]


@router.get("/items/low-stock")
def get_low_stock_items(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """Get low stock items"""
    items = InventoryService.get_low_stock_items(db)
    return {"low_stock_items": [item.to_dict() for item in items], "count": len(items)}


@router.get("/items/{item_id}", response_model=InventoryItemResponse)
def get_inventory_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """Get inventory item by ID"""
    item = InventoryService.get_item_by_id(db, item_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory item not found"
        )
    return item.to_dict()


@router.post("/items", response_model=InventoryItemResponse)
def create_inventory_item(
    item_data: InventoryItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Create new inventory item (manager and above)"""
    item = InventoryService.create_item(db, item_data)
    return item.to_dict()


@router.put("/items/{item_id}", response_model=InventoryItemResponse)
def update_inventory_item(
    item_id: int,
    item_data: InventoryItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Update inventory item (manager and above)"""
    item = InventoryService.update_item(db, item_id, item_data)
    return item.to_dict()


@router.delete("/items/{item_id}")
def delete_inventory_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Delete (deactivate) inventory item (manager and above)"""
    InventoryService.delete_item(db, item_id)
    return {"message": "Inventory item deactivated successfully"}


# ========== Stock Management Endpoints ==========

@router.post("/items/{item_id}/add-stock")
def add_stock(
    item_id: int,
    quantity: float = Query(..., gt=0),
    unit_cost: float = Query(..., gt=0),
    notes: str = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Add stock to inventory"""
    item = InventoryService.add_stock(db, item_id, quantity, unit_cost, notes, current_user.id)
    return item.to_dict()


@router.post("/items/{item_id}/adjust")
def adjust_stock(
    item_id: int,
    new_quantity: float = Query(..., ge=0),
    reason: str = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Adjust inventory quantity"""
    item = InventoryService.adjust_stock(db, item_id, new_quantity, reason, current_user.id)
    return item.to_dict()


@router.post("/items/{item_id}/wastage")
def record_wastage(
    item_id: int,
    quantity: float = Query(..., gt=0),
    reason: str = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Record inventory wastage"""
    item = InventoryService.record_wastage(db, item_id, quantity, reason, current_user.id)
    return item.to_dict()


# ========== Transaction Endpoints ==========

@router.get("/transactions", response_model=List[InventoryTransactionResponse])
def get_transactions(
    item_id: Optional[int] = Query(None),
    transaction_type: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """Get inventory transactions"""
    transactions = InventoryService.get_transactions(db, item_id, transaction_type, limit)
    return [t.to_dict() for t in transactions]


# ========== Purchase Order Endpoints ==========

@router.get("/purchase-orders", response_model=List[PurchaseOrderResponse])
def get_purchase_orders(
    status: Optional[str] = Query(None),
    item_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """Get purchase orders"""
    orders = InventoryService.get_purchase_orders(db, status, item_id)
    return [order.to_dict() for order in orders]


@router.post("/purchase-orders", response_model=PurchaseOrderResponse)
def create_purchase_order(
    order_data: PurchaseOrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Create purchase order (manager and above)"""
    order = InventoryService.create_purchase_order(db, order_data)
    return order.to_dict()


@router.post("/purchase-orders/{order_id}/receive")
def receive_purchase_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Receive purchase order (manager and above)"""
    order = InventoryService.receive_purchase_order(db, order_id, current_user.id)
    return order.to_dict()


@router.get("/predictions")
def get_stock_predictions(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """AI-powered stock depletion predictions based on historical sales data."""
    predictions = InventoryService.predict_stock_depletion(db)
    return {
        "predictions": predictions,
        "analysis_period_days": 14
    }


@router.get("/value")
def get_inventory_value(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Get total inventory value"""
    value = InventoryService.get_inventory_value(db)
    return {"total_value": round(value, 2)}
