"""
Kitchen dashboard router
"""
from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user, require_kitchen, require_service
from app.services.order_service import OrderService
from app.schemas.order import OrderResponse, OrderStatusUpdate
from app.models.user import User
from app.models.order import OrderStatus

router = APIRouter()

# WebSocket connection manager for kitchen
class KitchenConnectionManager:
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

kitchen_manager = KitchenConnectionManager()


def _broadcast_safe(payload: dict):
    """Broadcast only when an event loop exists in current execution context."""
    try:
        import asyncio
        loop = asyncio.get_running_loop()
        loop.create_task(kitchen_manager.broadcast(payload))
    except RuntimeError:
        pass


@router.get("/orders", response_model=List[OrderResponse])
def get_kitchen_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_kitchen)
):
    """Get orders for kitchen display (chef and above)"""
    orders = OrderService.get_kitchen_orders(db)
    return [order.to_dict(include_items=True) for order in orders]


@router.get("/orders/pending", response_model=List[OrderResponse])
def get_pending_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_kitchen)
):
    """Get pending orders waiting to be prepared"""
    orders = OrderService.get_orders(db, status=OrderStatus.IN_KITCHEN)
    return [order.to_dict(include_items=True) for order in orders]


@router.get("/orders/cooking", response_model=List[OrderResponse])
def get_cooking_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_kitchen)
):
    """Get orders currently being cooked"""
    orders = OrderService.get_orders(db, status=OrderStatus.COOKING)
    return [order.to_dict(include_items=True) for order in orders]


@router.get("/orders/ready", response_model=List[OrderResponse])
def get_ready_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_service)
):
    """Get orders ready for serving"""
    orders = OrderService.get_orders(db, status=OrderStatus.READY)
    return [order.to_dict(include_items=True) for order in orders]


@router.patch("/orders/{order_id}/start-cooking", response_model=OrderResponse)
def start_cooking(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_kitchen)
):
    """Mark order as being cooked (chef and above)"""
    status_update = OrderStatusUpdate(status=OrderStatus.COOKING)
    order = OrderService.update_order_status(db, order_id, status_update, current_user.id)
    
    # Broadcast to kitchen displays
    _broadcast_safe({
        "type": "order_status_update",
        "order_id": order_id,
        "status": "cooking"
    })
    
    return order.to_dict(include_items=True)


@router.patch("/orders/{order_id}/mark-ready", response_model=OrderResponse)
def mark_order_ready(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_kitchen)
):
    """Mark order as ready for serving (chef and above)"""
    status_update = OrderStatusUpdate(status=OrderStatus.READY)
    order = OrderService.update_order_status(db, order_id, status_update, current_user.id)
    
    # Broadcast to kitchen displays
    _broadcast_safe({
        "type": "order_status_update",
        "order_id": order_id,
        "status": "ready"
    })
    
    return order.to_dict(include_items=True)


@router.patch("/orders/{order_id}/pickup", response_model=OrderResponse)
def pickup_ready_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_service)
):
    """Mark ready order as picked up by waiter/service staff."""
    order = OrderService.mark_order_picked_up(db, order_id, current_user.id)

    _broadcast_safe({
        "type": "order_status_update",
        "order_id": order_id,
        "status": "served",
        "picked_up_by": current_user.full_name
    })

    return order.to_dict(include_items=True)


@router.get("/stats")
def get_kitchen_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_kitchen)
):
    """Get kitchen statistics (chef and above)"""
    from sqlalchemy import func
    from app.models.order import Order
    
    # Count orders by status
    pending_count = db.query(Order).filter(Order.status == OrderStatus.IN_KITCHEN).count()
    cooking_count = db.query(Order).filter(Order.status == OrderStatus.COOKING).count()
    ready_count = db.query(Order).filter(Order.status == OrderStatus.READY).count()
    
    # Average preparation time (last 24 hours)
    from datetime import datetime, timedelta
    yesterday = datetime.utcnow() - timedelta(hours=24)
    
    avg_prep_time = db.query(
        func.avg(
            func.julianday(Order.ready_at) - func.julianday(Order.kitchen_started_at)
        ) * 24 * 60
    ).filter(
        Order.ready_at.isnot(None),
        Order.kitchen_started_at.isnot(None),
        Order.ready_at >= yesterday
    ).scalar()
    
    return {
        "pending_orders": pending_count,
        "cooking_orders": cooking_count,
        "ready_orders": ready_count,
        "total_active": pending_count + cooking_count + ready_count,
        "average_prep_time_minutes": round(avg_prep_time, 1) if avg_prep_time else 0
    }


# WebSocket endpoint for kitchen real-time updates
@router.websocket("/ws")
async def kitchen_websocket(websocket: WebSocket):
    await kitchen_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Handle client messages if needed
            await websocket.send_json({"type": "ping", "message": "Kitchen connected"})
    except Exception:
        kitchen_manager.disconnect(websocket)
