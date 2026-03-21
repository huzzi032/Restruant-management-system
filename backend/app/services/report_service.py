"""
Reporting and analytics service
"""
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, desc
from typing import Dict, List, Any, Optional
from datetime import datetime, date, timedelta

from app.models.order import Order, OrderItem, OrderStatus
from app.models.menu import MenuItem, Category
from app.models.expense import Expense
from app.models.inventory import InventoryItem, InventoryTransaction
from app.models.employee import Employee, Attendance, Salary
from app.models.payment import Payment, PaymentMethod
from app.core.config import settings


class ReportService:
    """Service for generating reports and analytics"""

    @staticmethod
    def _to_iso_date(value) -> str:
        """Normalize DB date-like values to ISO date strings."""
        if value is None:
            return ""
        if isinstance(value, str):
            return value
        if hasattr(value, 'isoformat'):
            return value.isoformat()
        return str(value)
    
    @staticmethod
    def get_daily_report(db: Session, report_date: date = None) -> Dict[str, Any]:
        """Generate daily sales report"""
        if report_date is None:
            report_date = date.today()
        
        # Sales data
        sales_data = db.query(
            func.count(Order.id).label('order_count'),
            func.sum(Order.total_amount).label('total_sales'),
            func.sum(Order.tax_amount).label('total_tax'),
            func.sum(Order.discount_amount).label('total_discounts')
        ).filter(
            func.date(Order.created_at) == report_date,
            Order.status == OrderStatus.COMPLETED
        ).first()
        
        # Expenses
        expenses = db.query(
            func.sum(Expense.amount).label('total_expenses')
        ).filter(
            func.date(Expense.expense_date) == report_date
        ).first()
        
        # Payment breakdown
        payment_breakdown = db.query(
            Payment.payment_method,
            func.sum(Payment.total_amount).label('amount')
        ).join(Order).filter(
            func.date(Order.created_at) == report_date
        ).group_by(Payment.payment_method).all()
        
        # Top selling items
        top_items = db.query(
            MenuItem.id,
            MenuItem.name,
            func.sum(OrderItem.quantity).label('quantity_sold'),
            func.sum(OrderItem.total_price).label('revenue')
        ).join(OrderItem).join(Order).filter(
            func.date(Order.created_at) == report_date,
            Order.status == OrderStatus.COMPLETED
        ).group_by(MenuItem.id).order_by(desc('quantity_sold')).limit(5).all()
        
        total_sales = float(sales_data.total_sales or 0)
        total_expenses = float(expenses.total_expenses or 0)
        
        return {
            "date": report_date.isoformat(),
            "total_sales": round(total_sales, 2),
            "total_orders": sales_data.order_count or 0,
            "total_tax": round(float(sales_data.total_tax or 0), 2),
            "total_discounts": round(float(sales_data.total_discounts or 0), 2),
            "total_expenses": round(total_expenses, 2),
            "net_profit": round(total_sales - total_expenses, 2),
            "average_order_value": round(total_sales / (sales_data.order_count or 1), 2),
            "payment_breakdown": {
                p.payment_method.value: round(float(p.amount), 2) for p in payment_breakdown
            },
            "top_selling_items": [
                {
                    "id": item.id,
                    "name": item.name,
                    "quantity_sold": item.quantity_sold,
                    "revenue": round(float(item.revenue), 2)
                }
                for item in top_items
            ]
        }
    
    @staticmethod
    def get_monthly_report(db: Session, month: int = None, year: int = None) -> Dict[str, Any]:
        """Generate monthly sales report"""
        if month is None:
            month = datetime.now().month
        if year is None:
            year = datetime.now().year
        
        # Sales data
        sales_data = db.query(
            func.count(Order.id).label('order_count'),
            func.sum(Order.total_amount).label('total_sales'),
            func.sum(Order.tax_amount).label('total_tax'),
            func.sum(Order.discount_amount).label('total_discounts')
        ).filter(
            extract('month', Order.created_at) == month,
            extract('year', Order.created_at) == year,
            Order.status == OrderStatus.COMPLETED
        ).first()
        
        # Expenses
        expenses = db.query(
            func.sum(Expense.amount).label('total_expenses')
        ).filter(
            extract('month', Expense.expense_date) == month,
            extract('year', Expense.expense_date) == year
        ).first()
        
        # Daily breakdown
        daily_sales = db.query(
            func.date(Order.created_at).label('day'),
            func.count(Order.id).label('order_count'),
            func.sum(Order.total_amount).label('sales')
        ).filter(
            extract('month', Order.created_at) == month,
            extract('year', Order.created_at) == year,
            Order.status == OrderStatus.COMPLETED
        ).group_by(func.date(Order.created_at)).all()
        
        total_sales = float(sales_data.total_sales or 0)
        total_expenses = float(expenses.total_expenses or 0)
        
        return {
            "month": month,
            "year": year,
            "total_sales": round(total_sales, 2),
            "total_orders": sales_data.order_count or 0,
            "total_expenses": round(total_expenses, 2),
            "net_profit": round(total_sales - total_expenses, 2),
            "daily_average": round(total_sales / max(len(daily_sales), 1), 2),
            "daily_breakdown": [
                {
                    "date": ReportService._to_iso_date(day.day),
                    "orders": day.order_count,
                    "sales": round(float(day.sales), 2)
                }
                for day in daily_sales
            ]
        }
    
    @staticmethod
    def get_sales_report(
        db: Session,
        date_from: date,
        date_to: date
    ) -> Dict[str, Any]:
        """Generate sales report for date range"""
        # Overall stats
        overall = db.query(
            func.count(Order.id).label('order_count'),
            func.sum(Order.total_amount).label('total_sales'),
            func.sum(OrderItem.quantity).label('items_sold')
        ).join(OrderItem).filter(
            func.date(Order.created_at) >= date_from,
            func.date(Order.created_at) <= date_to,
            Order.status == OrderStatus.COMPLETED
        ).first()
        
        # Sales by category
        category_sales = db.query(
            Category.name,
            func.sum(OrderItem.quantity).label('quantity'),
            func.sum(OrderItem.total_price).label('revenue')
        ).join(MenuItem, OrderItem.menu_item_id == MenuItem.id).join(
            Category, MenuItem.category_id == Category.id
        ).join(Order).filter(
            func.date(Order.created_at) >= date_from,
            func.date(Order.created_at) <= date_to,
            Order.status == OrderStatus.COMPLETED
        ).group_by(Category.name).all()
        
        # Sales by day
        daily_sales = db.query(
            func.date(Order.created_at).label('day'),
            func.count(Order.id).label('orders'),
            func.sum(Order.total_amount).label('sales')
        ).filter(
            func.date(Order.created_at) >= date_from,
            func.date(Order.created_at) <= date_to,
            Order.status == OrderStatus.COMPLETED
        ).group_by(func.date(Order.created_at)).order_by('day').all()
        
        # Top items
        top_items = db.query(
            MenuItem.id,
            MenuItem.name,
            func.sum(OrderItem.quantity).label('quantity_sold'),
            func.sum(OrderItem.total_price).label('revenue')
        ).join(OrderItem).join(Order).filter(
            func.date(Order.created_at) >= date_from,
            func.date(Order.created_at) <= date_to,
            Order.status == OrderStatus.COMPLETED
        ).group_by(MenuItem.id).order_by(desc('quantity_sold')).limit(10).all()
        
        # Bottom items
        bottom_items = db.query(
            MenuItem.id,
            MenuItem.name,
            func.sum(OrderItem.quantity).label('quantity_sold'),
            func.sum(OrderItem.total_price).label('revenue')
        ).join(OrderItem).join(Order).filter(
            func.date(Order.created_at) >= date_from,
            func.date(Order.created_at) <= date_to,
            Order.status == OrderStatus.COMPLETED
        ).group_by(MenuItem.id).order_by('quantity_sold').limit(10).all()
        
        total_sales = float(overall.total_sales or 0)
        
        return {
            "period_start": date_from.isoformat(),
            "period_end": date_to.isoformat(),
            "total_sales": round(total_sales, 2),
            "total_orders": overall.order_count or 0,
            "total_items_sold": overall.items_sold or 0,
            "average_order_value": round(total_sales / (overall.order_count or 1), 2),
            "sales_by_category": [
                {
                    "category": c.name,
                    "quantity": c.quantity,
                    "revenue": round(float(c.revenue), 2)
                }
                for c in category_sales
            ],
            "sales_by_day": [
                {
                    "date": ReportService._to_iso_date(day.day),
                    "orders": day.orders,
                    "sales": round(float(day.sales), 2)
                }
                for day in daily_sales
            ],
            "top_items": [
                {
                    "id": item.id,
                    "name": item.name,
                    "quantity_sold": item.quantity_sold,
                    "revenue": round(float(item.revenue), 2)
                }
                for item in top_items
            ],
            "bottom_items": [
                {
                    "id": item.id,
                    "name": item.name,
                    "quantity_sold": item.quantity_sold,
                    "revenue": round(float(item.revenue), 2)
                }
                for item in bottom_items
            ]
        }
    
    @staticmethod
    def get_inventory_report(db: Session) -> Dict[str, Any]:
        """Generate inventory report"""
        # Total stats
        total_items = db.query(InventoryItem).filter(InventoryItem.is_active == True).count()
        
        total_value = db.query(
            func.sum(InventoryItem.quantity * InventoryItem.cost_per_unit).label('value')
        ).filter(InventoryItem.is_active == True).first()
        
        # Low stock items
        low_stock = db.query(InventoryItem).filter(
            InventoryItem.is_active == True,
            InventoryItem.quantity <= InventoryItem.min_stock_level,
            InventoryItem.quantity > 0
        ).all()
        
        # Out of stock items
        out_of_stock = db.query(InventoryItem).filter(
            InventoryItem.is_active == True,
            InventoryItem.quantity <= 0
        ).all()
        
        # Recent transactions
        recent_transactions = db.query(InventoryTransaction).order_by(
            desc(InventoryTransaction.created_at)
        ).limit(20).all()
        
        return {
            "total_items": total_items,
            "total_stock_value": round(float(total_value.value or 0), 2),
            "low_stock_count": len(low_stock),
            "out_of_stock_count": len(out_of_stock),
            "low_stock_items": [item.to_dict() for item in low_stock],
            "out_of_stock_items": [item.to_dict() for item in out_of_stock],
            "recent_transactions": [t.to_dict() for t in recent_transactions]
        }
    
    @staticmethod
    def get_employee_report(db: Session, month: int = None, year: int = None) -> Dict[str, Any]:
        """Generate employee report"""
        if month is None:
            month = datetime.now().month
        if year is None:
            year = datetime.now().year
        
        # Employee stats
        total_employees = db.query(Employee).count()
        active_employees = db.query(Employee).filter(
            Employee.status == 'active'
        ).count()
        
        # Attendance summary
        attendance_stats = db.query(
            Attendance.status,
            func.count(Attendance.id).label('count')
        ).filter(
            extract('month', Attendance.date) == month,
            extract('year', Attendance.date) == year
        ).group_by(Attendance.status).all()
        
        # Salary summary
        salary_summary = db.query(
            func.sum(Salary.total_earnings).label('total_earnings'),
            func.sum(Salary.total_deductions).label('total_deductions'),
            func.sum(Salary.net_salary).label('total_net')
        ).filter(
            Salary.month == month,
            Salary.year == year
        ).first()
        
        return {
            "month": month,
            "year": year,
            "total_employees": total_employees,
            "active_employees": active_employees,
            "attendance_summary": {
                stat.status.value if hasattr(stat.status, 'value') else stat.status: stat.count
                for stat in attendance_stats
            },
            "salary_summary": {
                "total_earnings": round(float(salary_summary.total_earnings or 0), 2),
                "total_deductions": round(float(salary_summary.total_deductions or 0), 2),
                "total_net": round(float(salary_summary.total_net or 0), 2)
            }
        }
    
    @staticmethod
    def get_dashboard_summary(db: Session) -> Dict[str, Any]:
        """Get dashboard summary data"""
        today = date.today()
        
        # Today's sales
        today_sales = db.query(
            func.sum(Order.total_amount).label('sales'),
            func.count(Order.id).label('orders')
        ).filter(
            func.date(Order.created_at) == today,
            Order.status == OrderStatus.COMPLETED
        ).first()
        
        # Active tables
        from app.models.table import Table, TableStatus
        active_tables = db.query(Table).filter(Table.status == TableStatus.OCCUPIED).count()
        
        # Pending orders
        pending_orders = db.query(Order).filter(
            Order.status.in_(['pending', 'in_kitchen', 'cooking', 'ready'])
        ).count()
        
        # Low stock count
        low_stock = db.query(InventoryItem).filter(
            InventoryItem.is_active == True,
            InventoryItem.quantity <= InventoryItem.min_stock_level
        ).count()
        
        return {
            "today_sales": round(float(today_sales.sales or 0), 2),
            "today_orders": today_sales.orders or 0,
            "active_tables": active_tables,
            "pending_orders": pending_orders,
            "low_stock_count": low_stock
        }
