"""
Inventory management service
"""
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from fastapi import HTTPException, status
from typing import List, Optional
from datetime import datetime

from app.models.inventory import InventoryItem, InventoryTransaction, PurchaseOrder, InventoryTransactionType
from app.schemas.inventory import InventoryItemCreate, InventoryItemUpdate, InventoryTransactionCreate, PurchaseOrderCreate, PurchaseOrderUpdate


class InventoryService:
    """Service for inventory management"""
    
    # ========== Inventory Item Methods ==========
    
    @staticmethod
    def create_item(db: Session, item_data: InventoryItemCreate, restaurant_id: int = None):
        """Create a new inventory item"""
        data = item_data.model_dump()
        if restaurant_id:
            data["restaurant_id"] = restaurant_id
        db_item = InventoryItem(**data)
        db.add(db_item)
        db.commit()
        db.refresh(db_item)
        return db_item
    
    @staticmethod
    def get_items(
        db: Session,
        restaurant_id: int = None,
        low_stock_only: bool = False,
        is_active: bool = True,
        search: Optional[str] = None
    ):
        """Get inventory items with filtering (scoped to restaurant)"""
        query = db.query(InventoryItem).options(
            joinedload(InventoryItem.supplier)
        )

        if restaurant_id:
            query = query.filter(InventoryItem.restaurant_id == restaurant_id)

        if is_active:
            query = query.filter(InventoryItem.is_active == True)

        if low_stock_only:
            query = query.filter(
                InventoryItem.quantity <= InventoryItem.min_stock_level
            )

        if search:
            query = query.filter(InventoryItem.name.ilike(f"%{search}%"))

        return query.order_by(InventoryItem.name).all()
    
    @staticmethod
    def get_item_by_id(db: Session, item_id: int, restaurant_id: int = None):
        """Get inventory item by ID (scoped to restaurant)"""
        query = db.query(InventoryItem).options(
            joinedload(InventoryItem.supplier)
        ).filter(InventoryItem.id == item_id)
        if restaurant_id:
            query = query.filter(InventoryItem.restaurant_id == restaurant_id)
        return query.first()
    
    @staticmethod
    def update_item(db: Session, item_id: int, item_data: InventoryItemUpdate, restaurant_id: int = None):
        """Update inventory item (scoped to restaurant)"""
        query = db.query(InventoryItem).filter(InventoryItem.id == item_id)
        if restaurant_id:
            query = query.filter(InventoryItem.restaurant_id == restaurant_id)
        item = query.first()
        
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Inventory item not found"
            )
        
        update_data = item_data.model_dump(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(item, field, value)
        
        db.commit()
        db.refresh(item)
        return item
    
    @staticmethod
    def delete_item(db: Session, item_id: int, restaurant_id: int = None):
        """Delete (deactivate) inventory item (scoped to restaurant)"""
        query = db.query(InventoryItem).filter(InventoryItem.id == item_id)
        if restaurant_id:
            query = query.filter(InventoryItem.restaurant_id == restaurant_id)
        item = query.first()
        
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Inventory item not found"
            )
        
        item.is_active = False
        db.commit()
        return item
    
    # ========== Transaction Methods ==========
    
    @staticmethod
    def add_stock(
        db: Session,
        item_id: int,
        quantity: float,
        unit_cost: float,
        notes: str = None,
        created_by: int = None,
        restaurant_id: int = None,
    ):
        """Add stock to inventory (scoped to restaurant)"""
        query = db.query(InventoryItem).filter(InventoryItem.id == item_id)
        if restaurant_id:
            query = query.filter(InventoryItem.restaurant_id == restaurant_id)
        item = query.first()
        
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Inventory item not found"
            )
        
        # Update quantity
        item.quantity += quantity
        
        # Update cost per unit (weighted average)
        if quantity > 0:
            total_value = (item.quantity * item.cost_per_unit) + (quantity * unit_cost)
            total_quantity = item.quantity + quantity
            if total_quantity > 0:
                item.cost_per_unit = total_value / total_quantity
        
        # Create transaction
        transaction = InventoryTransaction(
            inventory_item_id=item_id,
            transaction_type=InventoryTransactionType.IN,
            quantity=quantity,
            reference_type="manual",
            unit_cost=unit_cost,
            total_cost=quantity * unit_cost,
            notes=notes or "Manual stock addition",
            created_by=created_by
        )
        db.add(transaction)
        
        db.commit()
        db.refresh(item)
        return item
    
    @staticmethod
    def adjust_stock(
        db: Session,
        item_id: int,
        new_quantity: float,
        reason: str,
        created_by: int = None,
        restaurant_id: int = None,
    ):
        """Adjust inventory quantity (scoped to restaurant)"""
        query = db.query(InventoryItem).filter(InventoryItem.id == item_id)
        if restaurant_id:
            query = query.filter(InventoryItem.restaurant_id == restaurant_id)
        item = query.first()
        
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Inventory item not found"
            )
        
        difference = new_quantity - item.quantity
        
        # Create transaction
        transaction = InventoryTransaction(
            inventory_item_id=item_id,
            transaction_type=InventoryTransactionType.ADJUSTMENT,
            quantity=difference,
            reference_type="adjustment",
            unit_cost=item.cost_per_unit,
            total_cost=difference * item.cost_per_unit,
            notes=reason,
            created_by=created_by
        )
        db.add(transaction)
        
        # Update quantity
        item.quantity = new_quantity
        
        db.commit()
        db.refresh(item)
        return item
    
    @staticmethod
    def record_wastage(
        db: Session,
        item_id: int,
        quantity: float,
        reason: str,
        created_by: int = None,
        restaurant_id: int = None,
    ):
        """Record inventory wastage (scoped to restaurant)"""
        query = db.query(InventoryItem).filter(InventoryItem.id == item_id)
        if restaurant_id:
            query = query.filter(InventoryItem.restaurant_id == restaurant_id)
        item = query.first()
        
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Inventory item not found"
            )
        
        if item.quantity < quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Insufficient stock to record wastage"
            )
        
        # Update quantity
        item.quantity -= quantity
        
        # Create transaction
        transaction = InventoryTransaction(
            inventory_item_id=item_id,
            transaction_type=InventoryTransactionType.WASTAGE,
            quantity=-quantity,
            reference_type="wastage",
            unit_cost=item.cost_per_unit,
            total_cost=quantity * item.cost_per_unit,
            notes=reason,
            created_by=created_by
        )
        db.add(transaction)
        
        db.commit()
        db.refresh(item)
        return item
    
    @staticmethod
    def get_transactions(
        db: Session,
        item_id: Optional[int] = None,
        transaction_type: Optional[str] = None,
        limit: int = 100,
        restaurant_id: int = None,
    ):
        """Get inventory transactions (scoped to restaurant)"""
        query = db.query(InventoryTransaction).options(
            joinedload(InventoryTransaction.inventory_item)
        )

        if restaurant_id:
            query = query.join(
                InventoryItem,
                InventoryTransaction.inventory_item_id == InventoryItem.id,
            ).filter(InventoryItem.restaurant_id == restaurant_id)

        if item_id:
            query = query.filter(InventoryTransaction.inventory_item_id == item_id)

        if transaction_type:
            query = query.filter(InventoryTransaction.transaction_type == transaction_type)

        return query.order_by(InventoryTransaction.created_at.desc()).limit(limit).all()
    
    # ========== Purchase Order Methods ==========
    
    @staticmethod
    def create_purchase_order(db: Session, order_data: PurchaseOrderCreate, restaurant_id: int = None):
        """Create a new purchase order (scoped to restaurant)"""
        query = db.query(InventoryItem).filter(
            InventoryItem.id == order_data.inventory_item_id
        )
        if restaurant_id:
            query = query.filter(InventoryItem.restaurant_id == restaurant_id)
        item = query.first()
        
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Inventory item not found"
            )
        
        total_cost = order_data.quantity * order_data.unit_cost
        
        db_order = PurchaseOrder(
            **order_data.model_dump(),
            total_cost=total_cost
        )
        db.add(db_order)
        db.commit()
        db.refresh(db_order)
        return db_order
    
    @staticmethod
    def get_purchase_orders(
        db: Session,
        status: Optional[str] = None,
        item_id: Optional[int] = None,
        restaurant_id: int = None,
    ):
        """Get purchase orders with filtering (scoped to restaurant)"""
        query = db.query(PurchaseOrder).options(
            joinedload(PurchaseOrder.inventory_item),
            joinedload(PurchaseOrder.supplier),
        )

        if restaurant_id:
            query = query.join(
                InventoryItem,
                PurchaseOrder.inventory_item_id == InventoryItem.id,
            ).filter(InventoryItem.restaurant_id == restaurant_id)

        if status:
            query = query.filter(PurchaseOrder.status == status)

        if item_id:
            query = query.filter(PurchaseOrder.inventory_item_id == item_id)

        return query.order_by(PurchaseOrder.order_date.desc()).all()
    
    @staticmethod
    def receive_purchase_order(db: Session, order_id: int, created_by: int = None, restaurant_id: int = None):
        """Receive a purchase order and add stock (scoped to restaurant)"""
        order = db.query(PurchaseOrder).filter(PurchaseOrder.id == order_id).first()

        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Purchase order not found")

        # Verify order belongs to restaurant
        if restaurant_id:
            item = db.query(InventoryItem).filter(
                InventoryItem.id == order.inventory_item_id,
                InventoryItem.restaurant_id == restaurant_id,
            ).first()
            if not item:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Purchase order not found")
        
        if order.status != "pending":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Order already received or cancelled"
            )
        
        # Add stock
        InventoryService.add_stock(
            db,
            order.inventory_item_id,
            order.quantity,
            order.unit_cost,
            f"Purchase order #{order_id}",
            created_by
        )
        
        # Update order status
        order.status = "received"
        order.received_date = datetime.utcnow()
        
        db.commit()
        db.refresh(order)
        return order
    
    @staticmethod
    def get_low_stock_items(db: Session, restaurant_id: int = None):
        """Get items with low stock (scoped to restaurant)"""
        query = db.query(InventoryItem).filter(
            InventoryItem.is_active == True,
            InventoryItem.quantity <= InventoryItem.min_stock_level,
        )
        if restaurant_id:
            query = query.filter(InventoryItem.restaurant_id == restaurant_id)
        return query.all()

    @staticmethod
    def get_inventory_value(db: Session, restaurant_id: int = None):
        """Get total inventory value (scoped to restaurant)"""
        query = db.query(
            func.sum(InventoryItem.quantity * InventoryItem.cost_per_unit).label("total_value")
        ).filter(InventoryItem.is_active == True)
        if restaurant_id:
            query = query.filter(InventoryItem.restaurant_id == restaurant_id)
        result = query.first()
        return float(result.total_value or 0)

    @staticmethod
    def predict_stock_depletion(db: Session, analysis_days: int = 14, restaurant_id: int = None):
        """
        Predict when each inventory item will run out based on historical
        order data cross-referenced with menu item ingredient links.
        Scoped to the given restaurant.
        """
        from app.models.menu import MenuItemIngredient, MenuItem
        from app.models.order import Order, OrderItem, OrderStatus
        from datetime import timedelta, date

        cutoff = datetime.utcnow() - timedelta(days=analysis_days)

        # All active inventory items (scoped)
        items_q = db.query(InventoryItem).filter(InventoryItem.is_active == True)
        if restaurant_id:
            items_q = items_q.filter(InventoryItem.restaurant_id == restaurant_id)
        items = items_q.all()

        predictions = []

        for item in items:
            # Find menu items that use this ingredient
            ingredient_links = (
                db.query(MenuItemIngredient)
                .filter(MenuItemIngredient.inventory_item_id == item.id)
                .all()
            )

            if not ingredient_links:
                # No menu items linked — fall back to transaction-based estimate
                total_out = (
                    db.query(func.sum(func.abs(InventoryTransaction.quantity)))
                    .filter(
                        InventoryTransaction.inventory_item_id == item.id,
                        InventoryTransaction.transaction_type.in_(["out", "wastage"]),
                        InventoryTransaction.created_at >= cutoff,
                    )
                    .scalar()
                ) or 0.0

                daily_usage = total_out / max(analysis_days, 1)
            else:
                # Calculate usage from actual orders
                daily_usage = 0.0
                linked_menu_names = []

                for link in ingredient_links:
                    menu_item = db.query(MenuItem).filter(MenuItem.id == link.menu_item_id).first()
                    if menu_item:
                        linked_menu_names.append(menu_item.name)

                    # Count how many of this menu item were sold in the period
                    total_sold = (
                        db.query(func.sum(OrderItem.quantity))
                        .join(Order, OrderItem.order_id == Order.id)
                        .filter(
                            OrderItem.menu_item_id == link.menu_item_id,
                            OrderItem.is_voided == False,
                            Order.status == OrderStatus.COMPLETED,
                            Order.created_at >= cutoff,
                        )
                        .scalar()
                    ) or 0

                    # Each sale consumes link.quantity_required of this ingredient
                    daily_usage += (total_sold * link.quantity_required) / max(analysis_days, 1)

            # Calculate days until stockout
            if daily_usage > 0:
                days_left = item.quantity / daily_usage
                stockout_date = date.today() + timedelta(days=int(days_left))
            else:
                days_left = 999  # effectively infinite
                stockout_date = None

            # Determine risk level
            if days_left <= 3:
                risk_level = "critical"
            elif days_left <= 7:
                risk_level = "warning"
            else:
                risk_level = "healthy"

            # Collect linked menu item names
            if not ingredient_links:
                menu_names = []
            else:
                menu_names = []
                for link in ingredient_links:
                    mi = db.query(MenuItem).filter(MenuItem.id == link.menu_item_id).first()
                    if mi:
                        menu_names.append(mi.name)

            predictions.append({
                "item_id": item.id,
                "item_name": item.name,
                "current_stock": item.quantity,
                "unit": item.unit,
                "daily_usage_rate": round(daily_usage, 2),
                "days_until_stockout": round(days_left, 1) if days_left < 999 else None,
                "predicted_stockout_date": stockout_date.isoformat() if stockout_date else None,
                "risk_level": risk_level,
                "linked_menu_items": menu_names,
            })

        # Sort: critical first, then warning, then healthy
        risk_order = {"critical": 0, "warning": 1, "healthy": 2}
        predictions.sort(key=lambda p: (risk_order.get(p["risk_level"], 3), p.get("days_until_stockout") or 9999))

        return predictions
