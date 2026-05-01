"""
Reporting and analytics service — all queries are tenant-scoped by restaurant_id.
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
    """Service for generating reports and analytics (fully tenant-aware)."""

    @staticmethod
    def _to_iso_date(value) -> str:
        """Normalize DB date-like values to ISO date strings."""
        if value is None:
            return ""
        if isinstance(value, str):
            return value
        if hasattr(value, "isoformat"):
            return value.isoformat()
        return str(value)

    # ------------------------------------------------------------------ #
    # Daily Report                                                         #
    # ------------------------------------------------------------------ #
    @staticmethod
    def get_daily_report(
        db: Session, report_date: date = None, restaurant_id: int = None
    ) -> Dict[str, Any]:
        """Generate daily sales report (scoped to restaurant)."""
        if report_date is None:
            report_date = date.today()

        rid_filter = [Order.restaurant_id == restaurant_id] if restaurant_id else []

        # Sales data
        sales_data = (
            db.query(
                func.count(Order.id).label("order_count"),
                func.sum(Order.total_amount).label("total_sales"),
                func.sum(Order.tax_amount).label("total_tax"),
                func.sum(Order.discount_amount).label("total_discounts"),
            )
            .filter(
                func.date(Order.created_at) == report_date,
                Order.status == OrderStatus.COMPLETED,
                *rid_filter,
            )
            .first()
        )

        # Expenses
        exp_filter = [func.date(Expense.expense_date) == report_date]
        if restaurant_id:
            exp_filter.append(Expense.restaurant_id == restaurant_id)
        expenses = db.query(func.sum(Expense.amount).label("total_expenses")).filter(
            *exp_filter
        ).first()

        # Payment breakdown
        pay_filter = [func.date(Order.created_at) == report_date]
        if restaurant_id:
            pay_filter.append(Order.restaurant_id == restaurant_id)
        payment_breakdown = (
            db.query(
                Payment.payment_method,
                func.sum(Payment.total_amount).label("amount"),
            )
            .join(Order)
            .filter(*pay_filter)
            .group_by(Payment.payment_method)
            .all()
        )

        # Top selling items
        top_filter = [
            func.date(Order.created_at) == report_date,
            Order.status == OrderStatus.COMPLETED,
        ]
        if restaurant_id:
            top_filter.append(Order.restaurant_id == restaurant_id)
        top_items = (
            db.query(
                MenuItem.id,
                MenuItem.name,
                func.sum(OrderItem.quantity).label("quantity_sold"),
                func.sum(OrderItem.total_price).label("revenue"),
            )
            .join(OrderItem)
            .join(Order)
            .filter(*top_filter)
            .group_by(MenuItem.id)
            .order_by(desc("quantity_sold"))
            .limit(5)
            .all()
        )

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
            "average_order_value": round(
                total_sales / (sales_data.order_count or 1), 2
            ),
            "payment_breakdown": {
                p.payment_method.value: round(float(p.amount), 2)
                for p in payment_breakdown
            },
            "top_selling_items": [
                {
                    "id": item.id,
                    "name": item.name,
                    "quantity_sold": item.quantity_sold,
                    "revenue": round(float(item.revenue), 2),
                }
                for item in top_items
            ],
        }

    # ------------------------------------------------------------------ #
    # Monthly Report                                                       #
    # ------------------------------------------------------------------ #
    @staticmethod
    def get_monthly_report(
        db: Session, month: int = None, year: int = None, restaurant_id: int = None
    ) -> Dict[str, Any]:
        """Generate monthly sales report (scoped to restaurant)."""
        if month is None:
            month = datetime.now().month
        if year is None:
            year = datetime.now().year

        rid_filter = [Order.restaurant_id == restaurant_id] if restaurant_id else []

        sales_data = (
            db.query(
                func.count(Order.id).label("order_count"),
                func.sum(Order.total_amount).label("total_sales"),
                func.sum(Order.tax_amount).label("total_tax"),
                func.sum(Order.discount_amount).label("total_discounts"),
            )
            .filter(
                extract("month", Order.created_at) == month,
                extract("year", Order.created_at) == year,
                Order.status == OrderStatus.COMPLETED,
                *rid_filter,
            )
            .first()
        )

        exp_filter = [
            extract("month", Expense.expense_date) == month,
            extract("year", Expense.expense_date) == year,
        ]
        if restaurant_id:
            exp_filter.append(Expense.restaurant_id == restaurant_id)
        expenses = db.query(func.sum(Expense.amount).label("total_expenses")).filter(
            *exp_filter
        ).first()

        daily_sales = (
            db.query(
                func.date(Order.created_at).label("day"),
                func.count(Order.id).label("order_count"),
                func.sum(Order.total_amount).label("sales"),
            )
            .filter(
                extract("month", Order.created_at) == month,
                extract("year", Order.created_at) == year,
                Order.status == OrderStatus.COMPLETED,
                *rid_filter,
            )
            .group_by(func.date(Order.created_at))
            .all()
        )

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
                    "sales": round(float(day.sales), 2),
                }
                for day in daily_sales
            ],
        }

    # ------------------------------------------------------------------ #
    # Sales Report                                                         #
    # ------------------------------------------------------------------ #
    @staticmethod
    def get_sales_report(
        db: Session,
        date_from: date,
        date_to: date,
        restaurant_id: int = None,
    ) -> Dict[str, Any]:
        """Generate sales report for date range (scoped to restaurant)."""
        rid_filter = [Order.restaurant_id == restaurant_id] if restaurant_id else []

        overall = (
            db.query(
                func.count(Order.id).label("order_count"),
                func.sum(Order.total_amount).label("total_sales"),
                func.sum(OrderItem.quantity).label("items_sold"),
            )
            .join(OrderItem)
            .filter(
                func.date(Order.created_at) >= date_from,
                func.date(Order.created_at) <= date_to,
                Order.status == OrderStatus.COMPLETED,
                *rid_filter,
            )
            .first()
        )

        category_sales = (
            db.query(
                Category.name,
                func.sum(OrderItem.quantity).label("quantity"),
                func.sum(OrderItem.total_price).label("revenue"),
            )
            .join(MenuItem, OrderItem.menu_item_id == MenuItem.id)
            .join(Category, MenuItem.category_id == Category.id)
            .join(Order)
            .filter(
                func.date(Order.created_at) >= date_from,
                func.date(Order.created_at) <= date_to,
                Order.status == OrderStatus.COMPLETED,
                *rid_filter,
            )
            .group_by(Category.name)
            .all()
        )

        daily_sales = (
            db.query(
                func.date(Order.created_at).label("day"),
                func.count(Order.id).label("orders"),
                func.sum(Order.total_amount).label("sales"),
            )
            .filter(
                func.date(Order.created_at) >= date_from,
                func.date(Order.created_at) <= date_to,
                Order.status == OrderStatus.COMPLETED,
                *rid_filter,
            )
            .group_by(func.date(Order.created_at))
            .order_by("day")
            .all()
        )

        top_items = (
            db.query(
                MenuItem.id,
                MenuItem.name,
                func.sum(OrderItem.quantity).label("quantity_sold"),
                func.sum(OrderItem.total_price).label("revenue"),
            )
            .join(OrderItem)
            .join(Order)
            .filter(
                func.date(Order.created_at) >= date_from,
                func.date(Order.created_at) <= date_to,
                Order.status == OrderStatus.COMPLETED,
                *rid_filter,
            )
            .group_by(MenuItem.id)
            .order_by(desc("quantity_sold"))
            .limit(10)
            .all()
        )

        bottom_items = (
            db.query(
                MenuItem.id,
                MenuItem.name,
                func.sum(OrderItem.quantity).label("quantity_sold"),
                func.sum(OrderItem.total_price).label("revenue"),
            )
            .join(OrderItem)
            .join(Order)
            .filter(
                func.date(Order.created_at) >= date_from,
                func.date(Order.created_at) <= date_to,
                Order.status == OrderStatus.COMPLETED,
                *rid_filter,
            )
            .group_by(MenuItem.id)
            .order_by("quantity_sold")
            .limit(10)
            .all()
        )

        total_sales = float(overall.total_sales or 0)

        return {
            "period_start": date_from.isoformat(),
            "period_end": date_to.isoformat(),
            "total_sales": round(total_sales, 2),
            "total_orders": overall.order_count or 0,
            "total_items_sold": overall.items_sold or 0,
            "average_order_value": round(
                total_sales / (overall.order_count or 1), 2
            ),
            "sales_by_category": [
                {
                    "category": c.name,
                    "quantity": c.quantity,
                    "revenue": round(float(c.revenue), 2),
                }
                for c in category_sales
            ],
            "sales_by_day": [
                {
                    "date": ReportService._to_iso_date(day.day),
                    "orders": day.orders,
                    "sales": round(float(day.sales), 2),
                }
                for day in daily_sales
            ],
            "top_items": [
                {
                    "id": item.id,
                    "name": item.name,
                    "quantity_sold": item.quantity_sold,
                    "revenue": round(float(item.revenue), 2),
                }
                for item in top_items
            ],
            "bottom_items": [
                {
                    "id": item.id,
                    "name": item.name,
                    "quantity_sold": item.quantity_sold,
                    "revenue": round(float(item.revenue), 2),
                }
                for item in bottom_items
            ],
        }

    # ------------------------------------------------------------------ #
    # Inventory Report                                                     #
    # ------------------------------------------------------------------ #
    @staticmethod
    def get_inventory_report(
        db: Session, restaurant_id: int = None
    ) -> Dict[str, Any]:
        """Generate inventory report (scoped to restaurant)."""
        inv_filter = [InventoryItem.is_active == True]
        if restaurant_id:
            inv_filter.append(InventoryItem.restaurant_id == restaurant_id)

        total_items = db.query(InventoryItem).filter(*inv_filter).count()

        total_value = (
            db.query(
                func.sum(
                    InventoryItem.quantity * InventoryItem.cost_per_unit
                ).label("value")
            )
            .filter(*inv_filter)
            .first()
        )

        low_stock = (
            db.query(InventoryItem)
            .filter(
                *inv_filter,
                InventoryItem.quantity <= InventoryItem.min_stock_level,
                InventoryItem.quantity > 0,
            )
            .all()
        )

        out_of_stock = (
            db.query(InventoryItem)
            .filter(*inv_filter, InventoryItem.quantity <= 0)
            .all()
        )

        txn_filter = []
        if restaurant_id:
            txn_filter.append(InventoryItem.restaurant_id == restaurant_id)

        recent_transactions_q = db.query(InventoryTransaction)
        if restaurant_id:
            recent_transactions_q = recent_transactions_q.join(
                InventoryItem,
                InventoryTransaction.inventory_item_id == InventoryItem.id,
            ).filter(InventoryItem.restaurant_id == restaurant_id)
        recent_transactions = (
            recent_transactions_q.order_by(
                desc(InventoryTransaction.created_at)
            )
            .limit(20)
            .all()
        )

        return {
            "total_items": total_items,
            "total_stock_value": round(float(total_value.value or 0), 2),
            "low_stock_count": len(low_stock),
            "out_of_stock_count": len(out_of_stock),
            "low_stock_items": [item.to_dict() for item in low_stock],
            "out_of_stock_items": [item.to_dict() for item in out_of_stock],
            "recent_transactions": [t.to_dict() for t in recent_transactions],
        }

    # ------------------------------------------------------------------ #
    # Employee Report                                                      #
    # ------------------------------------------------------------------ #
    @staticmethod
    def get_employee_report(
        db: Session, month: int = None, year: int = None, restaurant_id: int = None
    ) -> Dict[str, Any]:
        """Generate employee report (scoped to restaurant)."""
        if month is None:
            month = datetime.now().month
        if year is None:
            year = datetime.now().year

        emp_filter = []
        if restaurant_id:
            emp_filter.append(Employee.restaurant_id == restaurant_id)

        total_employees = db.query(Employee).filter(*emp_filter).count()
        active_employees = (
            db.query(Employee)
            .filter(*emp_filter, Employee.status == "active")
            .count()
        )

        att_filter = [
            extract("month", Attendance.date) == month,
            extract("year", Attendance.date) == year,
        ]
        if restaurant_id:
            att_filter.append(
                Attendance.employee_id.in_(
                    db.query(Employee.id).filter(Employee.restaurant_id == restaurant_id)
                )
            )

        attendance_stats = (
            db.query(
                Attendance.status,
                func.count(Attendance.id).label("count"),
            )
            .filter(*att_filter)
            .group_by(Attendance.status)
            .all()
        )

        sal_filter = [Salary.month == month, Salary.year == year]
        if restaurant_id:
            sal_filter.append(
                Salary.employee_id.in_(
                    db.query(Employee.id).filter(Employee.restaurant_id == restaurant_id)
                )
            )

        salary_summary = (
            db.query(
                func.sum(Salary.total_earnings).label("total_earnings"),
                func.sum(Salary.total_deductions).label("total_deductions"),
                func.sum(Salary.net_salary).label("total_net"),
            )
            .filter(*sal_filter)
            .first()
        )

        return {
            "month": month,
            "year": year,
            "total_employees": total_employees,
            "active_employees": active_employees,
            "attendance_summary": {
                stat.status.value
                if hasattr(stat.status, "value")
                else stat.status: stat.count
                for stat in attendance_stats
            },
            "salary_summary": {
                "total_earnings": round(
                    float(salary_summary.total_earnings or 0), 2
                ),
                "total_deductions": round(
                    float(salary_summary.total_deductions or 0), 2
                ),
                "total_net": round(float(salary_summary.total_net or 0), 2),
            },
        }

    # ------------------------------------------------------------------ #
    # Dashboard Summary                                                    #
    # ------------------------------------------------------------------ #
    @staticmethod
    def get_dashboard_summary(
        db: Session, restaurant_id: int = None
    ) -> Dict[str, Any]:
        """Get dashboard summary data (scoped to restaurant)."""
        today = date.today()

        rid_filter = [Order.restaurant_id == restaurant_id] if restaurant_id else []

        today_sales = (
            db.query(
                func.sum(Order.total_amount).label("sales"),
                func.count(Order.id).label("orders"),
            )
            .filter(
                func.date(Order.created_at) == today,
                Order.status == OrderStatus.COMPLETED,
                *rid_filter,
            )
            .first()
        )

        from app.models.table import Table, TableStatus

        table_filter = [Table.status == TableStatus.OCCUPIED]
        if restaurant_id:
            table_filter.append(Table.restaurant_id == restaurant_id)
        active_tables = db.query(Table).filter(*table_filter).count()

        pending_filter = [Order.status.in_(["pending", "in_kitchen", "cooking", "ready"])]
        if restaurant_id:
            pending_filter.append(Order.restaurant_id == restaurant_id)
        pending_orders = db.query(Order).filter(*pending_filter).count()

        inv_filter = [
            InventoryItem.is_active == True,
            InventoryItem.quantity <= InventoryItem.min_stock_level,
        ]
        if restaurant_id:
            inv_filter.append(InventoryItem.restaurant_id == restaurant_id)
        low_stock = db.query(InventoryItem).filter(*inv_filter).count()

        return {
            "today_sales": round(float(today_sales.sales or 0), 2),
            "today_orders": today_sales.orders or 0,
            "active_tables": active_tables,
            "pending_orders": pending_orders,
            "low_stock_count": low_stock,
        }
