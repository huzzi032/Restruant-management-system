"""
Configuration settings for the Restaurant Management System
"""
import json
import os
from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import Optional


def _is_vercel() -> bool:
    return os.getenv("VERCEL") == "1" or bool(os.getenv("VERCEL_ENV"))


def _default_path(local_path: str, vercel_path: str) -> str:
    return vercel_path if _is_vercel() else local_path


class Settings(BaseSettings):
    """Application settings"""
    
    # App Info
    APP_NAME: str = "Restaurant Management System"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # Security
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Database
    DATABASE_URL: str = (
        os.getenv("DATABASE_URL")
        or os.getenv("POSTGRES_URL")
        or _default_path("sqlite:///./restaurant.db", "sqlite:////tmp/restaurant.db")
    )
    # For PostgreSQL: postgresql://user:password@localhost/restaurant

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def normalize_database_url(cls, value: str) -> str:
        """Normalize DB URL formats commonly provided by hosting platforms."""
        if not isinstance(value, str):
            return value

        url = value.strip()
        if url.startswith("postgres://"):
            return url.replace("postgres://", "postgresql+psycopg2://", 1)

        if url.startswith("postgresql://") and "+" not in url.split("://", 1)[0]:
            return url.replace("postgresql://", "postgresql+psycopg2://", 1)

        return url
    
    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"
    PUBLIC_MENU_URL: str = "http://localhost:5173/menu/public"

    @property
    def cors_origins_list(self) -> list[str]:
        """Allow CORS origins from .env as CSV or JSON array string."""
        raw = self.CORS_ORIGINS.strip()
        if raw.startswith("["):
            try:
                parsed = json.loads(raw)
                if isinstance(parsed, list):
                    return [str(origin).strip() for origin in parsed if str(origin).strip()]
            except json.JSONDecodeError:
                pass
        return [origin.strip() for origin in raw.split(",") if origin.strip()]
    
    # Groq AI API
    GROQ_API_KEY: Optional[str] = None
    GROQ_MODEL: str = "mixtral-8x7b-32768"
    
    # Business Settings
    TAX_RATE: float = 0.10  # 10% tax
    CURRENCY: str = "USD"
    ENABLE_DEMO_SEED: bool = False
    
    # File Storage
    UPLOAD_DIR: str = _default_path("./uploads", "/tmp/uploads")
    INVOICE_DIR: str = _default_path("./invoices", "/tmp/invoices")
    RUNTIME_SETTINGS_FILE: str = _default_path("./runtime_settings.json", "/tmp/runtime_settings.json")
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()


# Role definitions
class Roles:
    ADMIN = "admin"
    MANAGER = "manager"
    WAITER = "waiter"
    CHEF = "chef"
    CASHIER = "cashier"
    
    ALL = [ADMIN, MANAGER, WAITER, CHEF, CASHIER]


# Order Status
class OrderStatus:
    PENDING = "pending"
    IN_KITCHEN = "in_kitchen"
    COOKING = "cooking"
    READY = "ready"
    SERVED = "served"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


# Payment Methods
class PaymentMethod:
    CASH = "cash"
    CARD = "card"
    ONLINE = "online"


# Table Status
class TableStatus:
    AVAILABLE = "available"
    OCCUPIED = "occupied"
    RESERVED = "reserved"
    CLEANING = "cleaning"
