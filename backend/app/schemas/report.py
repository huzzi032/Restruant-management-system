"""
Report schemas
"""
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, date


class DailyReport(BaseModel):
    date: date
    total_sales: float
    total_orders: int
    total_expenses: float
    net_profit: float
    average_order_value: float
    top_selling_items: List[Dict[str, Any]]
    payment_breakdown: Dict[str, float]


class MonthlyReport(BaseModel):
    month: int
    year: int
    total_sales: float
    total_orders: int
    total_expenses: float
    net_profit: float
    daily_average: float
    growth_rate: Optional[float] = None


class SalesReport(BaseModel):
    period_start: date
    period_end: date
    total_sales: float
    total_orders: int
    total_items_sold: int
    average_order_value: float
    sales_by_category: List[Dict[str, Any]]
    sales_by_day: List[Dict[str, Any]]
    top_items: List[Dict[str, Any]]
    bottom_items: List[Dict[str, Any]]


class InventoryReport(BaseModel):
    total_items: int
    total_stock_value: float
    low_stock_items: List[Dict[str, Any]]
    out_of_stock_items: List[Dict[str, Any]]
    recent_transactions: List[Dict[str, Any]]


class EmployeeReport(BaseModel):
    total_employees: int
    active_employees: int
    attendance_summary: Dict[str, Any]
    salary_summary: Dict[str, float]
    top_performers: List[Dict[str, Any]]


class AIInsight(BaseModel):
    insight_type: str
    title: str
    description: str
    data: Optional[Dict[str, Any]] = None
    recommendation: Optional[str] = None


class DashboardSummary(BaseModel):
    today_sales: float
    today_orders: int
    today_profit: float
    active_tables: int
    pending_orders: int
    low_stock_count: int
    recent_ai_insights: List[AIInsight]
