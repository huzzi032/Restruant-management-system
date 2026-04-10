"""
Order management service
"""
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from fastapi import HTTPException, status
from typing import List, Optional
from datetime import datetime

from app.models.order import Order, OrderItem, OrderStatus, OrderType
from app.models.table import Table, TableStatus
from app.models.menu import MenuItem
from app.models.inventory import InventoryItem, InventoryTransaction, InventoryTransactionType
from app.core.config import settings
from app.core.business_settings import business_settings_store
from app.schemas.order import OrderCreate, OrderUpdate, OrderItemCreate, OrderStatusUpdate


class OrderService:
    """Service for order management"""

    @staticmethod
    def _current_tax_rate() -> float:
        return float(business_settings_store.get().get("tax_rate", settings.TAX_RATE))

    @staticmethod
    def _reroute_to_kitchen_after_modification(order: Order):
        """If an order was already ready/served, send it back to kitchen after edits."""
        if order.status in [OrderStatus.READY, OrderStatus.SERVED]:
            order.status = OrderStatus.IN_KITCHEN
            order.kitchen_started_at = datetime.utcnow()
            order.ready_at = None
            order.served_at = None
    
    @staticmethod
    def generate_order_number(db: Session, restaurant_id: int) -> str:
        """Generate unique order number"""
        today = datetime.utcnow()
        prefix = today.strftime("%Y%m%d")
        
        # Get count of orders today
        count = db.query(Order).filter(
            Order.restaurant_id == restaurant_id,
            func.date(Order.created_at) == today.date()
        ).count()
        
        return f"ORD-R{restaurant_id}-{prefix}-{count + 1:04d}"
    
    @staticmethod
    def create_order(db: Session, order_data: OrderCreate, created_by: int, restaurant_id: int):
        """Create a new order"""
        # Generate order number
        order_number = OrderService.generate_order_number(db, restaurant_id)
        
        # Create order
        db_order = Order(
            restaurant_id=restaurant_id,
            order_number=order_number,
            order_type=order_data.order_type,
            table_id=order_data.table_id,
            customer_name=order_data.customer_name,
            customer_phone=order_data.customer_phone,
            customer_address=order_data.customer_address,
            special_instructions=order_data.special_instructions,
            discount_type=order_data.discount_type,
            discount_value=order_data.discount_value or 0,
            status=OrderStatus.IN_KITCHEN,
            kitchen_started_at=datetime.utcnow(),
            created_by=created_by
        )
        
        db.add(db_order)
        db.flush()  # Get order ID
        
        # Add order items
        for item_data in order_data.items:
            menu_item = db.query(MenuItem).filter(
                MenuItem.id == item_data.menu_item_id,
                MenuItem.restaurant_id == restaurant_id,
            ).first()
            
            if not menu_item:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Menu item {item_data.menu_item_id} not found"
                )
            
            if not menu_item.is_available:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Menu item '{menu_item.name}' is not available"
                )
            
            order_item = OrderItem(
                order_id=db_order.id,
                menu_item_id=item_data.menu_item_id,
                quantity=item_data.quantity,
                unit_price=menu_item.price,
                total_price=menu_item.price * item_data.quantity,
                special_instructions=item_data.special_instructions
            )
            db.add(order_item)
            
            # Deduct inventory
            OrderService._deduct_inventory(db, menu_item, item_data.quantity, db_order.id)
        
        # Calculate totals
        db_order.calculate_totals(OrderService._current_tax_rate())
        
        # Update table status if dine-in
        if db_order.table_id:
            table = db.query(Table).filter(Table.id == db_order.table_id, Table.restaurant_id == restaurant_id).first()
            if table:
                table.status = TableStatus.OCCUPIED
                table.current_order_id = db_order.id
        
        db.commit()
        db.refresh(db_order)
        return db_order
    
    @staticmethod
    def _deduct_inventory(db: Session, menu_item: MenuItem, quantity: int, order_id: int):
        """Deduct inventory for order items"""
        for ingredient_link in menu_item.ingredients_link:
            inventory_item = ingredient_link.inventory_item
            amount_needed = ingredient_link.quantity_required * quantity
            
            if inventory_item.quantity >= amount_needed:
                inventory_item.quantity -= amount_needed
                
                # Create transaction record
                transaction = InventoryTransaction(
                    inventory_item_id=inventory_item.id,
                    transaction_type=InventoryTransactionType.OUT,
                    quantity=-amount_needed,
                    reference_type="order",
                    reference_id=order_id,
                    unit_cost=inventory_item.cost_per_unit,
                    total_cost=inventory_item.cost_per_unit * amount_needed,
                    notes=f"Used in order #{order_id}"
                )
                db.add(transaction)
    
    @staticmethod
    def get_orders(
        db: Session,
        restaurant_id: int,
        status: Optional[OrderStatus] = None,
        order_type: Optional[OrderType] = None,
        table_id: Optional[int] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        skip: int = 0,
        limit: int = 100
    ):
        """Get orders with filtering"""
        query = db.query(Order).options(
            joinedload(Order.table),
            joinedload(Order.items).joinedload(OrderItem.menu_item),
            joinedload(Order.creator)
        ).filter(Order.restaurant_id == restaurant_id)
        
        if status:
            query = query.filter(Order.status == status)
        
        if order_type:
            query = query.filter(Order.order_type == order_type)
        
        if table_id:
            query = query.filter(Order.table_id == table_id)
        
        if date_from:
            query = query.filter(Order.created_at >= date_from)
        
        if date_to:
            query = query.filter(Order.created_at <= date_to)
        
        return query.order_by(Order.created_at.desc()).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_order_by_id(db: Session, order_id: int, restaurant_id: int):
        """Get order by ID"""
        return db.query(Order).options(
            joinedload(Order.table),
            joinedload(Order.items).joinedload(OrderItem.menu_item),
            joinedload(Order.creator)
        ).filter(Order.id == order_id, Order.restaurant_id == restaurant_id).first()
    
    @staticmethod
    def get_order_by_number(db: Session, order_number: str, restaurant_id: int):
        """Get order by order number"""
        return db.query(Order).options(
            joinedload(Order.table),
            joinedload(Order.items).joinedload(OrderItem.menu_item),
            joinedload(Order.creator)
        ).filter(Order.order_number == order_number, Order.restaurant_id == restaurant_id).first()
    
    @staticmethod
    def update_order(db: Session, order_id: int, order_data: OrderUpdate, updated_by: int, restaurant_id: int):
        """Update order"""
        order = db.query(Order).filter(Order.id == order_id, Order.restaurant_id == restaurant_id).first()
        
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )
        
        if order.status in [OrderStatus.COMPLETED, OrderStatus.CANCELLED]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot update completed or cancelled order"
            )
        
        update_data = order_data.model_dump(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(order, field, value)
        
        order.updated_by = updated_by
        
        # Recalculate totals
        order.calculate_totals(OrderService._current_tax_rate())
        
        db.commit()
        db.refresh(order)
        return order
    
    @staticmethod
    def update_order_status(
        db: Session,
        order_id: int,
        status_update: OrderStatusUpdate,
        updated_by: int,
        restaurant_id: int,
    ):
        """Update order status"""
        order = db.query(Order).filter(Order.id == order_id, Order.restaurant_id == restaurant_id).first()
        
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )
        
        new_status = status_update.status
        
        # Validate status transition
        valid_transitions = {
            OrderStatus.PENDING: [OrderStatus.IN_KITCHEN, OrderStatus.CANCELLED],
            OrderStatus.IN_KITCHEN: [OrderStatus.COOKING, OrderStatus.CANCELLED],
            OrderStatus.COOKING: [OrderStatus.READY, OrderStatus.CANCELLED],
            OrderStatus.READY: [OrderStatus.SERVED, OrderStatus.CANCELLED],
            OrderStatus.SERVED: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
            OrderStatus.COMPLETED: [],
            OrderStatus.CANCELLED: []
        }
        
        if new_status not in valid_transitions.get(order.status, []):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status transition from {order.status} to {new_status}"
            )
        
        order.status = new_status
        order.updated_by = updated_by
        
        # Update timestamps based on status
        now = datetime.utcnow()
        if new_status == OrderStatus.IN_KITCHEN:
            order.kitchen_started_at = now
        elif new_status == OrderStatus.READY:
            order.ready_at = now
        elif new_status == OrderStatus.SERVED:
            order.served_at = now
        elif new_status == OrderStatus.COMPLETED:
            order.completed_at = now
        elif new_status == OrderStatus.CANCELLED:
            order.cancelled_by = updated_by
            order.cancellation_reason = status_update.reason
            
            # Free up table
            if order.table_id:
                table = db.query(Table).filter(Table.id == order.table_id, Table.restaurant_id == restaurant_id).first()
                if table:
                    table.status = TableStatus.AVAILABLE
                    table.current_order_id = None
        
        db.commit()
        db.refresh(order)
        return order

    @staticmethod
    def mark_order_picked_up(db: Session, order_id: int, picked_up_by: int, restaurant_id: int):
        """Mark a ready order as picked up by service staff and served."""
        order = db.query(Order).filter(Order.id == order_id, Order.restaurant_id == restaurant_id).first()

        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )

        if order.status != OrderStatus.READY:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only ready orders can be picked up"
            )

        now = datetime.utcnow()
        order.status = OrderStatus.SERVED
        order.served_at = now
        order.picked_up_at = now
        order.picked_up_by = picked_up_by
        order.updated_by = picked_up_by

        db.commit()
        db.refresh(order)
        return order
    
    @staticmethod
    def get_active_orders(db: Session, restaurant_id: int):
        """Get all active orders (not completed or cancelled)"""
        return db.query(Order).options(
            joinedload(Order.table),
            joinedload(Order.items).joinedload(OrderItem.menu_item)
        ).filter(
            Order.restaurant_id == restaurant_id,
            Order.status.notin_([OrderStatus.COMPLETED, OrderStatus.CANCELLED])
        ).order_by(Order.created_at.asc()).all()
    
    @staticmethod
    def get_kitchen_orders(db: Session, restaurant_id: int):
        """Get orders for kitchen display"""
        return db.query(Order).options(
            joinedload(Order.table),
            joinedload(Order.items).joinedload(OrderItem.menu_item)
        ).filter(
            Order.restaurant_id == restaurant_id,
            Order.status.in_([OrderStatus.IN_KITCHEN, OrderStatus.COOKING, OrderStatus.READY])
        ).order_by(
            Order.kitchen_started_at.asc()
        ).all()
    
    @staticmethod
    def add_order_item(
        db: Session,
        order_id: int,
        item_data: OrderItemCreate,
        updated_by: int,
        restaurant_id: int,
    ):
        """Add item to existing order"""
        order = db.query(Order).filter(Order.id == order_id, Order.restaurant_id == restaurant_id).first()
        
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )
        
        if order.status in [OrderStatus.COMPLETED, OrderStatus.CANCELLED]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot modify completed or cancelled order"
            )
        
        menu_item = db.query(MenuItem).filter(
            MenuItem.id == item_data.menu_item_id,
            MenuItem.restaurant_id == restaurant_id,
        ).first()
        
        if not menu_item:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Menu item not found"
            )
        
        order_item = OrderItem(
            order_id=order_id,
            menu_item_id=item_data.menu_item_id,
            quantity=item_data.quantity,
            unit_price=menu_item.price,
            total_price=menu_item.price * item_data.quantity,
            special_instructions=item_data.special_instructions
        )
        db.add(order_item)
        
        # Deduct inventory
        OrderService._deduct_inventory(db, menu_item, item_data.quantity, order_id)
        
        # Recalculate totals
        db.flush()
        OrderService._reroute_to_kitchen_after_modification(order)
        order.calculate_totals(OrderService._current_tax_rate())
        order.updated_by = updated_by
        
        db.commit()
        db.refresh(order)
        return order
    
    @staticmethod
    def remove_order_item(db: Session, order_id: int, item_id: int, updated_by: int, restaurant_id: int):
        """Remove item from order (void)"""
        order = db.query(Order).filter(Order.id == order_id, Order.restaurant_id == restaurant_id).first()
        
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )
        
        if order.status in [OrderStatus.COMPLETED, OrderStatus.CANCELLED]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot modify completed or cancelled order"
            )
        
        item = db.query(OrderItem).filter(
            OrderItem.id == item_id,
            OrderItem.order_id == order_id
        ).first()
        
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order item not found"
            )
        
        item.is_voided = True
        item.void_reason = "Removed by staff"
        
        # Recalculate totals
        OrderService._reroute_to_kitchen_after_modification(order)
        order.calculate_totals(OrderService._current_tax_rate())
        order.updated_by = updated_by
        
        db.commit()
        db.refresh(order)
        return order
