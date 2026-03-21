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
    def create_item(db: Session, item_data: InventoryItemCreate):
        """Create a new inventory item"""
        db_item = InventoryItem(**item_data.model_dump())
        db.add(db_item)
        db.commit()
        db.refresh(db_item)
        return db_item
    
    @staticmethod
    def get_items(
        db: Session,
        low_stock_only: bool = False,
        is_active: bool = True,
        search: Optional[str] = None
    ):
        """Get inventory items with filtering"""
        query = db.query(InventoryItem).options(
            joinedload(InventoryItem.supplier)
        )
        
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
    def get_item_by_id(db: Session, item_id: int):
        """Get inventory item by ID"""
        return db.query(InventoryItem).options(
            joinedload(InventoryItem.supplier)
        ).filter(InventoryItem.id == item_id).first()
    
    @staticmethod
    def update_item(db: Session, item_id: int, item_data: InventoryItemUpdate):
        """Update inventory item"""
        item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
        
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
    def delete_item(db: Session, item_id: int):
        """Delete (deactivate) inventory item"""
        item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
        
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
        created_by: int = None
    ):
        """Add stock to inventory"""
        item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
        
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
        created_by: int = None
    ):
        """Adjust inventory quantity"""
        item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
        
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
        created_by: int = None
    ):
        """Record inventory wastage"""
        item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
        
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
        limit: int = 100
    ):
        """Get inventory transactions"""
        query = db.query(InventoryTransaction).options(
            joinedload(InventoryTransaction.inventory_item)
        )
        
        if item_id:
            query = query.filter(InventoryTransaction.inventory_item_id == item_id)
        
        if transaction_type:
            query = query.filter(InventoryTransaction.transaction_type == transaction_type)
        
        return query.order_by(InventoryTransaction.created_at.desc()).limit(limit).all()
    
    # ========== Purchase Order Methods ==========
    
    @staticmethod
    def create_purchase_order(db: Session, order_data: PurchaseOrderCreate):
        """Create a new purchase order"""
        # Verify item exists
        item = db.query(InventoryItem).filter(
            InventoryItem.id == order_data.inventory_item_id
        ).first()
        
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
        item_id: Optional[int] = None
    ):
        """Get purchase orders with filtering"""
        query = db.query(PurchaseOrder).options(
            joinedload(PurchaseOrder.inventory_item),
            joinedload(PurchaseOrder.supplier)
        )
        
        if status:
            query = query.filter(PurchaseOrder.status == status)
        
        if item_id:
            query = query.filter(PurchaseOrder.inventory_item_id == item_id)
        
        return query.order_by(PurchaseOrder.order_date.desc()).all()
    
    @staticmethod
    def receive_purchase_order(db: Session, order_id: int, created_by: int = None):
        """Receive a purchase order and add stock"""
        order = db.query(PurchaseOrder).filter(PurchaseOrder.id == order_id).first()
        
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Purchase order not found"
            )
        
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
    def get_low_stock_items(db: Session):
        """Get items with low stock"""
        return db.query(InventoryItem).filter(
            InventoryItem.is_active == True,
            InventoryItem.quantity <= InventoryItem.min_stock_level
        ).all()
    
    @staticmethod
    def get_inventory_value(db: Session):
        """Get total inventory value"""
        result = db.query(
            func.sum(InventoryItem.quantity * InventoryItem.cost_per_unit).label('total_value')
        ).filter(InventoryItem.is_active == True).first()
        
        return float(result.total_value or 0)
