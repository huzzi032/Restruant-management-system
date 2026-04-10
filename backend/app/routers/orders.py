"""
Order management router
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_user, require_staff, require_cashier
from app.schemas.order import (
    OrderCreate, OrderUpdate, OrderResponse, 
    OrderItemCreate, OrderStatusUpdate, OrderFilter
)
from app.services.order_service import OrderService
from app.models.user import User
from app.models.order import OrderStatus, OrderType

router = APIRouter()

# WebSocket connection manager for real-time updates
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                pass

manager = ConnectionManager()


def _broadcast_safe(payload: dict):
    """Broadcast only when an event loop is available in current context."""
    try:
        import asyncio
        loop = asyncio.get_running_loop()
        loop.create_task(manager.broadcast(payload))
    except RuntimeError:
        # Sync route handlers run in a threadpool and may not have an active loop.
        pass


@router.get("", response_model=List[OrderResponse])
@router.get("/", response_model=List[OrderResponse])
def get_orders(
    status: Optional[OrderStatus] = Query(None),
    order_type: Optional[OrderType] = Query(None),
    table_id: Optional[int] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """Get orders with filtering"""
    orders = OrderService.get_orders(
        db,
        current_user.restaurant_id,
        status=status,
        order_type=order_type,
        table_id=table_id,
        date_from=date_from,
        date_to=date_to,
        skip=skip,
        limit=limit
    )
    return [order.to_dict(include_items=True) for order in orders]


@router.get("/active", response_model=List[OrderResponse])
def get_active_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """Get all active orders"""
    orders = OrderService.get_active_orders(db, current_user.restaurant_id)
    return [order.to_dict(include_items=True) for order in orders]


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """Get order by ID"""
    order = OrderService.get_order_by_id(db, order_id, current_user.restaurant_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    return order.to_dict(include_items=True)


@router.get("/by-number/{order_number}", response_model=OrderResponse)
def get_order_by_number(
    order_number: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """Get order by order number"""
    order = OrderService.get_order_by_number(db, order_number, current_user.restaurant_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    return order.to_dict(include_items=True)


@router.post("", response_model=OrderResponse)
@router.post("/", response_model=OrderResponse)
def create_order(
    order_data: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """Create new order"""
    order = OrderService.create_order(db, order_data, current_user.id, current_user.restaurant_id)

    # Broadcast to connected clients when loop is available.
    _broadcast_safe({
        "type": "new_order",
        "order": order.to_dict(include_items=True)
    })

    return order.to_dict(include_items=True)


@router.put("/{order_id}", response_model=OrderResponse)
def update_order(
    order_id: int,
    order_data: OrderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """Update order"""
    order = OrderService.update_order(db, order_id, order_data, current_user.id, current_user.restaurant_id)
    return order.to_dict(include_items=True)


@router.patch("/{order_id}/status", response_model=OrderResponse)
def update_order_status(
    order_id: int,
    status_update: OrderStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """Update order status"""
    order = OrderService.update_order_status(db, order_id, status_update, current_user.id, current_user.restaurant_id)

    # Broadcast status update
    _broadcast_safe({
        "type": "order_status_update",
        "order_id": order_id,
        "status": order.status.value
    })

    return order.to_dict(include_items=True)


@router.post("/{order_id}/items", response_model=OrderResponse)
def add_order_item(
    order_id: int,
    item_data: OrderItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """Add item to order"""
    order = OrderService.add_order_item(db, order_id, item_data, current_user.id, current_user.restaurant_id)
    return order.to_dict(include_items=True)


@router.delete("/{order_id}/items/{item_id}", response_model=OrderResponse)
def remove_order_item(
    order_id: int,
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """Remove item from order"""
    order = OrderService.remove_order_item(db, order_id, item_id, current_user.id, current_user.restaurant_id)
    return order.to_dict(include_items=True)


# WebSocket endpoint for real-time order updates
@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive and handle client messages
            data = await websocket.receive_text()
            # Echo back or handle specific commands
            await websocket.send_json({"type": "ping", "message": "Connected"})
    except WebSocketDisconnect:
        manager.disconnect(websocket)
