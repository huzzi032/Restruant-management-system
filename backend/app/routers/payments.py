"""
Payment router
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date, timedelta

from app.core.database import get_db
from app.core.security import get_current_user, require_cashier
from app.schemas.payment import PaymentCreate, PaymentUpdate, PaymentResponse, RefundRequest
from app.models.payment import Payment, PaymentStatus
from app.models.order import Order, OrderStatus
from app.models.user import User

router = APIRouter()


@router.get("", response_model=List[PaymentResponse])
@router.get("/", response_model=List[PaymentResponse])
def get_payments(
    status: Optional[str] = Query(None),
    payment_method: Optional[str] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_cashier)
):
    """Get payments (cashier and above)"""
    query = db.query(Payment).join(Order)
    
    if status:
        query = query.filter(Payment.status == status)
    
    if payment_method:
        query = query.filter(Payment.payment_method == payment_method)
    
    if date_from:
        query = query.filter(Payment.created_at >= date_from)
    
    if date_to:
        query = query.filter(Payment.created_at <= date_to)
    
    payments = query.order_by(Payment.created_at.desc()).offset(skip).limit(limit).all()
    return [payment.to_dict() for payment in payments]


@router.get("/{payment_id}", response_model=PaymentResponse)
def get_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_cashier)
):
    """Get payment by ID"""
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    return payment.to_dict()


@router.post("", response_model=PaymentResponse)
@router.post("/", response_model=PaymentResponse)
def create_payment(
    payment_data: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_cashier)
):
    """Process payment for an order (cashier and above)"""
    # Get order
    order = db.query(Order).filter(Order.id == payment_data.order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Check if already paid
    existing_payment = db.query(Payment).filter(Payment.order_id == payment_data.order_id).first()
    if existing_payment and existing_payment.status == PaymentStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order already paid"
        )

    if order.status in [OrderStatus.CANCELLED, OrderStatus.COMPLETED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot process payment for cancelled or completed order"
        )

    if order.order_type.value == "dine_in" and order.status != OrderStatus.SERVED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Dine-in order must be served before payment"
        )

    if order.order_type.value != "dine_in" and order.status not in [OrderStatus.READY, OrderStatus.SERVED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order must be ready before payment"
        )
    
    # Calculate totals
    subtotal = order.subtotal
    tax_amount = order.tax_amount
    discount_amount = order.discount_amount
    tip_amount = payment_data.tip_amount or 0
    total_amount = subtotal - discount_amount + tax_amount + tip_amount
    
    # Create payment
    payment = Payment(
        order_id=payment_data.order_id,
        subtotal=subtotal,
        tax_amount=tax_amount,
        discount_amount=discount_amount,
        tip_amount=tip_amount,
        total_amount=total_amount,
        payment_method=payment_data.payment_method,
        status=PaymentStatus.COMPLETED,
        notes=payment_data.notes,
        cashier_id=current_user.id,
        completed_at=datetime.utcnow()
    )
    
    db.add(payment)
    
    # Update order status
    order.status = OrderStatus.COMPLETED
    order.completed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(payment)
    return payment.to_dict()


@router.get("/{payment_id}/receipt")
def get_payment_receipt(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_cashier)
):
    """Get printable receipt payload for a payment."""
    payment = db.query(Payment).join(Order).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )

    order = payment.order
    return {
        "payment_id": payment.id,
        "order_id": order.id,
        "order_number": order.order_number,
        "order_type": order.order_type.value,
        "table_number": order.table.table_number if order.table else None,
        "customer_name": order.customer_name,
        "items": [item.to_dict() for item in order.items if not item.is_voided],
        "subtotal": round(payment.subtotal, 2),
        "tax_amount": round(payment.tax_amount, 2),
        "discount_amount": round(payment.discount_amount, 2),
        "tip_amount": round(payment.tip_amount, 2),
        "total_amount": round(payment.total_amount, 2),
        "payment_method": payment.payment_method.value,
        "cashier_name": payment.cashier.full_name if payment.cashier else None,
        "completed_at": payment.completed_at.isoformat() if payment.completed_at else None,
    }


@router.put("/{payment_id}", response_model=PaymentResponse)
def update_payment(
    payment_id: int,
    payment_data: PaymentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_cashier)
):
    """Update payment (cashier and above)"""
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    
    update_data = payment_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(payment, field, value)
    
    db.commit()
    db.refresh(payment)
    return payment.to_dict()


@router.post("/{payment_id}/refund")
def process_refund(
    payment_id: int,
    refund_request: RefundRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_cashier)
):
    """Process refund (cashier and above)"""
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    
    if payment.status != PaymentStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot refund incomplete payment"
        )
    
    try:
        payment.process_refund(refund_request.amount, refund_request.reason)
        db.commit()
        db.refresh(payment)
        return payment.to_dict()
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/daily/summary")
def get_daily_payment_summary(
    report_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_cashier)
):
    """Get daily payment summary"""
    if report_date is None:
        report_date = date.today()
    
    from sqlalchemy import func
    
    summary = db.query(
        Payment.payment_method,
        func.count(Payment.id).label('transaction_count'),
        func.sum(Payment.total_amount).label('total_amount')
    ).filter(
        Payment.status == PaymentStatus.COMPLETED,
        Payment.created_at >= report_date,
        Payment.created_at < report_date + timedelta(days=1)
    ).group_by(Payment.payment_method).all()
    
    return {
        "date": report_date.isoformat(),
        "summary": [
            {
                "payment_method": s.payment_method.value,
                "transaction_count": s.transaction_count,
                "total_amount": round(float(s.total_amount), 2)
            }
            for s in summary
        ]
    }
