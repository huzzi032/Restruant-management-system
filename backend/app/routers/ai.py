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
    ai_service = AIService()
    
    if not ai_service.is_available():
        return {
            "insights": "AI service is not available. Please configure GROQ_API_KEY in your environment.",
            "data": {}
        }
    
    result = ai_service.get_business_insights(db)
    return result


@router.get("/demand-prediction")
def get_demand_prediction(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Get demand prediction and restocking suggestions (manager and above)"""
    ai_service = AIService()
    
    if not ai_service.is_available():
        return {
            "prediction": "AI service is not available. Please configure GROQ_API_KEY in your environment.",
            "low_stock_items": [],
            "sales_trend": {}
        }
    
    result = ai_service.get_demand_prediction(db)
    return result


@router.get("/menu-optimization")
def get_menu_optimization(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Get menu optimization suggestions (manager and above)"""
    ai_service = AIService()
    
    if not ai_service.is_available():
        return {
            "suggestions": "AI service is not available. Please configure GROQ_API_KEY in your environment.",
            "top_items": [],
            "bottom_items": []
        }
    
    result = ai_service.get_menu_optimization(db)
    return result


@router.post("/chat")
def chat_assistant(
    question: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """AI chat assistant (manager and above)"""
    ai_service = AIService()
    
    if not ai_service.is_available():
        return {
            "question": question,
            "answer": "AI service is not available. Please configure GROQ_API_KEY in your environment.",
            "context": ""
        }
    
    result = ai_service.chat_assistant(db, question)
    return result


@router.get("/daily-briefing")
def get_daily_briefing(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Get daily business briefing (manager and above)"""
    ai_service = AIService()
    
    if not ai_service.is_available():
        return {
            "briefing": "AI service is not available. Please configure GROQ_API_KEY in your environment.",
            "data": {}
        }
    
    result = ai_service.get_daily_briefing(db)
    return result


@router.get("/dashboard-insights")
def get_dashboard_insights(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Get AI insights summary for dashboard (manager and above)"""
    ai_service = AIService()
    insights = ai_service.get_ai_insights_summary(db)
    return {"insights": insights}
