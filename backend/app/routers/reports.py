"""
Reports and analytics router — tenant-scoped by current user's restaurant_id.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date, timedelta

from app.core.database import get_db
from app.core.security import get_current_user, require_manager
from app.services.report_service import ReportService
from app.models.user import User

router = APIRouter()


@router.get("/daily")
def get_daily_report(
    report_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager),
):
    """Get daily report (manager and above)"""
    return ReportService.get_daily_report(db, report_date, current_user.restaurant_id)


@router.get("/monthly")
def get_monthly_report(
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None, ge=2000),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager),
):
    """Get monthly report (manager and above)"""
    return ReportService.get_monthly_report(db, month, year, current_user.restaurant_id)


@router.get("/sales")
def get_sales_report(
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager),
):
    """Get sales report for date range (manager and above)"""
    if date_from is None:
        date_from = date.today() - timedelta(days=30)
    if date_to is None:
        date_to = date.today()
    return ReportService.get_sales_report(db, date_from, date_to, current_user.restaurant_id)


@router.get("/inventory")
def get_inventory_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager),
):
    """Get inventory report (manager and above)"""
    return ReportService.get_inventory_report(db, current_user.restaurant_id)


@router.get("/employees")
def get_employee_report(
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None, ge=2000),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager),
):
    """Get employee report (manager and above)"""
    return ReportService.get_employee_report(db, month, year, current_user.restaurant_id)


@router.get("/dashboard")
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager),
):
    """Get dashboard summary (manager and above)"""
    return ReportService.get_dashboard_summary(db, current_user.restaurant_id)


@router.get("/profit-loss")
def get_profit_loss_report(
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager),
):
    """Get profit and loss report (manager and above)"""
    if date_from is None:
        date_from = date.today() - timedelta(days=30)
    if date_to is None:
        date_to = date.today()

    restaurant_id = current_user.restaurant_id
    sales_report = ReportService.get_sales_report(db, date_from, date_to, restaurant_id)

    from sqlalchemy import func
    from app.models.expense import Expense

    exp_filter = [
        Expense.expense_date >= date_from,
        Expense.expense_date <= date_to,
    ]
    if restaurant_id:
        exp_filter.append(Expense.restaurant_id == restaurant_id)

    expenses = (
        db.query(Expense.category, func.sum(Expense.amount).label("amount"))
        .filter(*exp_filter)
        .group_by(Expense.category)
        .all()
    )

    total_expenses = sum(float(e.amount) for e in expenses)
    total_sales = sales_report["total_sales"]
    net_profit = total_sales - total_expenses

    return {
        "period_start": date_from.isoformat(),
        "period_end": date_to.isoformat(),
        "revenue": {
            "total_sales": total_sales,
            "total_orders": sales_report["total_orders"],
            "average_order_value": sales_report["average_order_value"],
        },
        "expenses": {
            "total_expenses": round(total_expenses, 2),
            "breakdown": [
                {
                    "category": e.category.value
                    if hasattr(e.category, "value")
                    else str(e.category),
                    "amount": round(float(e.amount), 2),
                }
                for e in expenses
            ],
        },
        "profit_loss": {
            "gross_profit": round(total_sales, 2),
            "total_expenses": round(total_expenses, 2),
            "net_profit": round(net_profit, 2),
            "profit_margin": round(
                (net_profit / total_sales * 100) if total_sales > 0 else 0, 2
            ),
        },
    }
