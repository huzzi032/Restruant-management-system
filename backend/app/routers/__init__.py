"""
API routers
"""
from fastapi import APIRouter

from app.routers import auth, users, menu, orders, tables, inventory, employees, expenses, payments, reports, ai, kitchen, system, health

# Main API router
api_router = APIRouter()

# Include all routers
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(menu.router, prefix="/menu", tags=["Menu Management"])
api_router.include_router(orders.router, prefix="/orders", tags=["Order Management"])
api_router.include_router(tables.router, prefix="/tables", tags=["Table Management"])
api_router.include_router(inventory.router, prefix="/inventory", tags=["Inventory"])
api_router.include_router(employees.router, prefix="/employees", tags=["Employees"])
api_router.include_router(expenses.router, prefix="/expenses", tags=["Expenses"])
api_router.include_router(payments.router, prefix="/payments", tags=["Payments"])
api_router.include_router(reports.router, prefix="/reports", tags=["Reports"])
api_router.include_router(ai.router, prefix="/ai", tags=["AI Insights"])
api_router.include_router(kitchen.router, prefix="/kitchen", tags=["Kitchen"])
api_router.include_router(system.router, prefix="/system", tags=["System"])
