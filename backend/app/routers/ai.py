"""
AI Insights router
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, require_manager
from app.services.ai_service import AIService
from app.models.user import User

router = APIRouter()


@router.get("/insights")
def get_business_insights(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Get AI-powered business insights (manager and above)"""
    try:
        ai_service = AIService()
        if not ai_service.is_available():
            return {"insights": "AI service is not available. Please configure GROQ_API_KEY in your environment.", "data": {}}
        return ai_service.get_business_insights(db)
    except Exception as e:
        return {"insights": f"Failed to generate insights: {str(e)}", "data": {}}


@router.get("/demand-prediction")
def get_demand_prediction(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Get demand prediction and restocking suggestions (manager and above)"""
    try:
        ai_service = AIService()
        if not ai_service.is_available():
            return {"prediction": "AI service is not available. Please configure GROQ_API_KEY in your environment.", "low_stock_items": [], "sales_trend": {}}
        return ai_service.get_demand_prediction(db)
    except Exception as e:
        return {"prediction": f"Failed to generate prediction: {str(e)}", "low_stock_items": [], "sales_trend": {}}


@router.get("/menu-optimization")
def get_menu_optimization(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Get menu optimization suggestions (manager and above)"""
    try:
        ai_service = AIService()
        if not ai_service.is_available():
            return {"suggestions": "AI service is not available. Please configure GROQ_API_KEY in your environment.", "top_items": [], "bottom_items": []}
        return ai_service.get_menu_optimization(db)
    except Exception as e:
        return {"suggestions": f"Failed to generate suggestions: {str(e)}", "top_items": [], "bottom_items": []}


@router.post("/chat")
def chat_assistant(
    question: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """AI chat assistant (manager and above)"""
    try:
        ai_service = AIService()
        if not ai_service.is_available():
            return {"question": question, "answer": "AI service is not available. Please configure GROQ_API_KEY in your environment.", "context": ""}
        return ai_service.chat_assistant(db, question)
    except Exception as e:
        return {"question": question, "answer": f"Failed to get AI response: {str(e)}", "context": ""}


@router.get("/daily-briefing")
def get_daily_briefing(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Get daily business briefing (manager and above)"""
    try:
        ai_service = AIService()
        if not ai_service.is_available():
            return {"briefing": "AI service is not available. Please configure GROQ_API_KEY in your environment.", "data": {}}
        return ai_service.get_daily_briefing(db)
    except Exception as e:
        return {"briefing": f"Failed to generate briefing: {str(e)}", "data": {}}


@router.get("/dashboard-insights")
def get_dashboard_insights(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Get AI insights summary for dashboard (manager and above)"""
    try:
        ai_service = AIService()
        insights = ai_service.get_ai_insights_summary(db)
        return {"insights": insights}
    except Exception as e:
        return {"insights": []}
