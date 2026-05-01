"""
Health check router - for diagnostics
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
import os

from app.core.database import get_db

router = APIRouter(prefix="/health", tags=["health"])


@router.get("/")
def health_check():
    """Basic health check"""
    return {"status": "ok", "service": "restaurant-management-system"}


@router.get("/db")
def db_health_check(db: Session = Depends(get_db)):
    """Database connection health check"""
    try:
        # Try to execute a simple query
        result = db.execute(text("SELECT 1"))
        result.fetchone()
        
        db_url = os.getenv("DATABASE_URL", "Not set")
        db_type = "PostgreSQL" if "postgresql" in db_url.lower() else "SQLite"
        
        return {
            "status": "ok",
            "database": db_type,
            "message": "Database connection successful"
        }
    except Exception as e:
        db_url = os.getenv("DATABASE_URL", "Not set")
        return {
            "status": "error",
            "error": str(e),
            "message": "Database connection failed",
            "database_url_set": bool(os.getenv("DATABASE_URL"))
        }


@router.get("/env")
def env_check():
    """Check if critical environment variables are set"""
    return {
        "DATABASE_URL": "Set ✓" if os.getenv("DATABASE_URL") else "NOT SET ✗",
        "SECRET_KEY": "Set ✓" if os.getenv("SECRET_KEY") else "NOT SET ✗",
        "GROQ_API_KEY": "Set ✓" if os.getenv("GROQ_API_KEY") else "Not required",
        "DEBUG": os.getenv("DEBUG", "False"),
        "VERCEL": "Yes" if os.getenv("VERCEL") else "No (local)",
    }
