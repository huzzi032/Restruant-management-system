"""
AI service using Groq API for intelligent insights
"""
from sqlalchemy.orm import Session
from typing import Dict, List, Any, Optional
from datetime import datetime, date, timedelta
import json
import os

from app.services.report_service import ReportService
from app.models.order import Order, OrderStatus
from app.models.menu import MenuItem
from app.models.inventory import InventoryItem
from app.core.config import settings


class AIService:
    """Service for AI-powered insights using Groq API"""
    
    def __init__(self):
        self.groq_api_key = settings.GROQ_API_KEY or os.getenv("GROQ_API_KEY")
        self.model = settings.GROQ_MODEL
        self.client = None
        
        if self.groq_api_key:
            try:
                from groq import Groq
                self.client = Groq(api_key=self.groq_api_key)
            except ImportError:
                print("Groq package not installed. AI features will be disabled.")
    
    def is_available(self) -> bool:
        """Check if AI service is available"""
        return self.client is not None
    
    def _call_groq(self, prompt: str, system_message: str = None) -> str:
        """Call Groq API with timeout"""
        if not self.client:
            return "AI service is not configured. Please set a valid GROQ_API_KEY in your environment."
        
        try:
            messages = []
            if system_message:
                messages.append({"role": "system", "content": system_message})
            messages.append({"role": "user", "content": prompt})
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.7,
                max_tokens=1000,
                timeout=60.0  # 60 second timeout
            )
            
            return response.choices[0].message.content
        except Exception as e:
            error_str = str(e)
            if "invalid_api_key" in error_str or "Invalid API Key" in error_str or "invalid_api_key" in error_str.lower():
                return "Your Groq API key is invalid or expired. Please update GROQ_API_KEY in your .env file."
            if "rate_limit" in error_str.lower():
                return "AI rate limit reached. Please wait a moment and try again."
            if "timeout" in error_str.lower() or "timed out" in error_str.lower():
                return "AI request timed out. The model took too long to respond. Please try again."
            print(f"Groq API error: {error_str}")
            return "AI service temporarily unavailable. Please try again later."
    
    def get_business_insights(self, db: Session) -> Dict[str, Any]:
        """Get AI-powered business insights"""
        # Get today's report
        today_report = ReportService.get_daily_report(db)
        
        # Get yesterday for comparison
        yesterday = date.today() - timedelta(days=1)
        yesterday_report = ReportService.get_daily_report(db, yesterday)
        
        # Get inventory status
        inventory_report = ReportService.get_inventory_report(db)
        
        # Get top selling items (last 7 days)
        from_date = date.today() - timedelta(days=7)
        sales_report = ReportService.get_sales_report(db, from_date, date.today())
        
        prompt = f"""
Analyze this restaurant business data and provide key insights:

TODAY'S PERFORMANCE:
- Sales: ${today_report['total_sales']}
- Orders: {today_report['total_orders']}
- Net Profit: ${today_report['net_profit']}
- Average Order Value: ${today_report['average_order_value']}

YESTERDAY'S PERFORMANCE:
- Sales: ${yesterday_report['total_sales']}
- Orders: {yesterday_report['total_orders']}
- Net Profit: ${yesterday_report['net_profit']}

INVENTORY ALERTS:
- Low Stock Items: {inventory_report['low_stock_count']}
- Out of Stock Items: {inventory_report['out_of_stock_count']}

TOP SELLING ITEMS (Last 7 days):
{json.dumps(sales_report['top_items'][:5], indent=2)}

Provide:
1. A brief summary of today's performance vs yesterday
2. Key areas of concern
3. Actionable recommendations
"""
        
        system_message = "You are a restaurant business analyst. Provide concise, actionable insights."
        
        insights = self._call_groq(prompt, system_message)
        
        return {
            "insights": insights,
            "data": {
                "today": today_report,
                "yesterday": yesterday_report,
                "inventory": inventory_report
            }
        }
    
    def get_demand_prediction(self, db: Session) -> Dict[str, Any]:
        """Predict demand and suggest restocking"""
        # Get inventory data
        inventory_report = ReportService.get_inventory_report(db)
        
        # Get sales trend (last 14 days)
        from_date = date.today() - timedelta(days=14)
        sales_report = ReportService.get_sales_report(db, from_date, date.today())
        
        # Get low stock items with details
        low_stock_items = inventory_report['low_stock_items']
        
        prompt = f"""
Based on the following data, predict demand and suggest restocking:

LOW STOCK ITEMS:
{json.dumps([{
    'name': item['name'],
    'current_quantity': item['quantity'],
    'unit': item['unit'],
    'min_stock': item['min_stock_level'],
    'reorder_point': item['reorder_point']
} for item in low_stock_items[:10]], indent=2)}

SALES TREND (Last 14 days):
- Total Sales: ${sales_report['total_sales']}
- Total Orders: {sales_report['total_orders']}
- Average Daily Sales: ${sales_report['total_sales'] / 14:.2f}

Provide:
1. Which items need immediate restocking
2. Suggested quantities to order
3. Demand prediction for next 7 days
"""
        
        system_message = "You are an inventory management expert. Provide specific restocking recommendations."
        
        prediction = self._call_groq(prompt, system_message)
        
        return {
            "prediction": prediction,
            "low_stock_items": low_stock_items,
            "sales_trend": sales_report
        }
    
    def get_menu_optimization(self, db: Session) -> Dict[str, Any]:
        """Get menu optimization suggestions"""
        # Get sales report
        from_date = date.today() - timedelta(days=30)
        sales_report = ReportService.get_sales_report(db, from_date, date.today())
        
        # Get menu items with profit margins
        menu_items = db.query(MenuItem).filter(MenuItem.is_available == True).all()
        
        menu_data = []
        for item in menu_items:
            menu_data.append({
                "name": item.name,
                "price": item.price,
                "cost": item.cost,
                "profit_margin": item.profit_margin,
                "category": item.category.name if item.category else None
            })
        
        prompt = f"""
Analyze this menu data and provide optimization suggestions:

TOP SELLING ITEMS (Last 30 days):
{json.dumps(sales_report['top_items'][:10], indent=2)}

BOTTOM PERFORMING ITEMS:
{json.dumps(sales_report['bottom_items'][:10], indent=2)}

MENU ITEMS WITH PROFIT MARGINS:
{json.dumps(sorted(menu_data, key=lambda x: x['profit_margin'], reverse=True)[:15], indent=2)}

Provide:
1. Items that should be promoted (high profit, good sales)
2. Items that may need price adjustment
3. Items that could be removed from menu
4. Suggestions for new menu items based on popular categories
"""
        
        system_message = "You are a menu optimization consultant. Provide specific, actionable recommendations."
        
        suggestions = self._call_groq(prompt, system_message)
        
        return {
            "suggestions": suggestions,
            "top_items": sales_report['top_items'][:10],
            "bottom_items": sales_report['bottom_items'][:10]
        }
    
    def chat_assistant(self, db: Session, question: str) -> Dict[str, Any]:
        """AI chat assistant for restaurant queries"""
        # Get current data
        today_report = ReportService.get_daily_report(db)
        dashboard = ReportService.get_dashboard_summary(db)
        
        # Get recent orders
        recent_orders = db.query(Order).filter(
            Order.status != OrderStatus.CANCELLED
        ).order_by(Order.created_at.desc()).limit(5).all()
        
        context = f"""
Current Restaurant Status:
- Today's Sales: ${today_report['total_sales']}
- Today's Orders: {today_report['total_orders']}
- Today's Profit: ${today_report['net_profit']}
- Active Tables: {dashboard['active_tables']}
- Pending Orders: {dashboard['pending_orders']}
- Low Stock Alerts: {dashboard['low_stock_count']}

Recent Orders:
{chr(10).join([f"- {o.order_number}: ${o.total_amount} ({o.status.value})" for o in recent_orders])}
"""
        
        prompt = f"""
Context: {context}

User Question: {question}

Provide a helpful, concise answer based on the data above.
"""
        
        system_message = """You are a helpful restaurant management assistant. 
Answer questions about sales, orders, inventory, and business performance.
Be concise and friendly. If you don't have specific data, say so."""
        
        answer = self._call_groq(prompt, system_message)
        
        return {
            "question": question,
            "answer": answer,
            "context": context
        }
    
    def get_daily_briefing(self, db: Session) -> Dict[str, Any]:
        """Get daily business briefing"""
        today_report = ReportService.get_daily_report(db)
        
        prompt = f"""
Create a friendly daily briefing for a restaurant owner:

TODAY'S NUMBERS:
- Sales: ${today_report['total_sales']}
- Orders: {today_report['total_orders']}
- Net Profit: ${today_report['net_profit']}
- Average Order Value: ${today_report['average_order_value']}

TOP SELLING ITEMS:
{json.dumps(today_report['top_selling_items'][:3], indent=2)}

Write a brief, encouraging summary of today's business performance.
"""
        
        system_message = "You are a supportive business coach. Write an encouraging daily briefing."
        
        briefing = self._call_groq(prompt, system_message)
        
        return {
            "briefing": briefing,
            "data": today_report
        }
    
    def get_ai_insights_summary(self, db: Session) -> List[Dict[str, Any]]:
        """Get a summary of AI insights for dashboard"""
        insights = []
        
        # Today's performance insight
        today_report = ReportService.get_daily_report(db)
        yesterday = date.today() - timedelta(days=1)
        yesterday_report = ReportService.get_daily_report(db, yesterday)
        
        sales_change = today_report['total_sales'] - yesterday_report['total_sales']
        
        if sales_change > 0:
            insights.append({
                "type": "positive",
                "title": "Sales Up!",
                "message": f"Today's sales are ${sales_change:.2f} higher than yesterday. Keep up the good work!"
            })
        elif sales_change < 0:
            insights.append({
                "type": "warning",
                "title": "Sales Down",
                "message": f"Today's sales are ${abs(sales_change):.2f} lower than yesterday."
            })
        
        # Low stock alert
        inventory_report = ReportService.get_inventory_report(db)
        if inventory_report['low_stock_count'] > 0:
            insights.append({
                "type": "alert",
                "title": "Low Stock Alert",
                "message": f"{inventory_report['low_stock_count']} items are running low on stock."
            })
        
        # Top item insight
        if today_report['top_selling_items']:
            top_item = today_report['top_selling_items'][0]
            insights.append({
                "type": "info",
                "title": "Top Seller Today",
                "message": f"'{top_item['name']}' is your best seller with {top_item['quantity_sold']} orders!"
            })
        
        # Profit insight
        if today_report['net_profit'] > 0:
            profit_margin = (today_report['net_profit'] / today_report['total_sales'] * 100) if today_report['total_sales'] > 0 else 0
            insights.append({
                "type": "positive",
                "title": "Healthy Profit",
                "message": f"Today's profit margin is {profit_margin:.1f}%. Great job controlling costs!"
            })
        
        return insights
