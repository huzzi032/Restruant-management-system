"""
Configuration settings for the Restaurant Management System
"""
import json
import os
from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import Optional
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit


def _is_vercel() -> bool:
    return os.getenv("VERCEL") == "1" or bool(os.getenv("VERCEL_ENV"))


def _default_path(local_path: str, vercel_path: str) -> str:
    return vercel_path if _is_vercel() else local_path


def _append_query_param(url: str, key: str, value: str) -> str:
    if not value:
        return url

    parts = urlsplit(url)
    query_params = dict(parse_qsl(parts.query, keep_blank_values=True))
    if key in query_params:
        return url

    query_params[key] = value
    new_query = urlencode(query_params)
    return urlunsplit((parts.scheme, parts.netloc, parts.path, new_query, parts.fragment))


def _replace_port_in_hostport(hostport: str, port: int) -> str:
    if not hostport:
        return hostport

    if hostport.startswith("["):
        end = hostport.find("]")
        if end != -1:
            return f"{hostport[:end + 1]}:{port}"

    if ":" in hostport:
        host = hostport.rsplit(":", 1)[0]
        return f"{host}:{port}"

    return f"{hostport}:{port}"


def _replace_port_in_netloc(netloc: str, port: int) -> str:
    if not netloc:
        return netloc

    if "@" in netloc:
        auth, hostport = netloc.rsplit("@", 1)
        return f"{auth}@{_replace_port_in_hostport(hostport, port)}"

    return _replace_port_in_hostport(netloc, port)


def _maybe_force_supabase_pooler_mode(url: str) -> str:
    parts = urlsplit(url)
    host = parts.hostname or ""

    if not host.endswith(".pooler.supabase.com"):
        return url

    mode = (os.getenv("DATABASE_POOLER_MODE") or os.getenv("SUPABASE_POOLER_MODE") or "").strip().lower()
    if not mode:
        if not _is_vercel():
            return url
        mode = "transaction"

    if mode not in {"session", "transaction"}:
        return url

    desired_port = 5432 if mode == "session" else 6543
    if parts.port == desired_port:
        return url

    if parts.port not in (None, 5432, 6543):
        return url

    new_netloc = _replace_port_in_netloc(parts.netloc, desired_port)
    return urlunsplit((parts.scheme, new_netloc, parts.path, parts.query, parts.fragment))


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
        os.getenv("DATABASE_POOL_URL")
        or os.getenv("DATABASE_POOLER_URL")
        or os.getenv("SUPABASE_POOLER_URL")
        or os.getenv("DATABASE_URL")
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
        
        # Convert postgres:// to postgresql+psycopg2://
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+psycopg2://", 1)
        elif url.startswith("postgresql://") and "+" not in url.split("://", 1)[0]:
            url = url.replace("postgresql://", "postgresql+psycopg2://", 1)

        url = _maybe_force_supabase_pooler_mode(url)

        # Add SSL parameters for PostgreSQL connections (especially for cloud databases like Supabase)
        if "postgresql+" in url:
            # Check if SSL params are already present
            if "sslmode" not in url and "?" not in url:
                # Add SSL requirement for secure connections to cloud databases
                url = url + "?sslmode=require"
            elif "sslmode" not in url and "?" in url:
                # URL already has query params, append sslmode
                url = url + "&sslmode=require"

            # Optional IPv4 override for serverless environments that lack IPv6 egress.
            hostaddr = os.getenv("DATABASE_HOSTADDR") or os.getenv("PGHOSTADDR")
            if hostaddr:
                url = _append_query_param(url, "hostaddr", hostaddr)

        if _is_vercel() and url.startswith("sqlite"):
            # Vercel's deployment filesystem is read-only except /tmp.
            # Force file-based SQLite URLs to a writable serverless path.
            base_url, separator, query = url.partition("?")

            if ":memory:" in base_url:
                return url

            if ":///" in base_url:
                dialect_prefix, sqlite_path = base_url.split(":///", 1)
                if sqlite_path.startswith("/tmp/"):
                    return url
                forced_base = f"{dialect_prefix}:////tmp/restaurant.db"
            else:
                forced_base = "sqlite:////tmp/restaurant.db"

            return f"{forced_base}?{query}" if separator else forced_base

        return url
    
    # CORS
    CORS_ORIGINS: str = (
        "http://localhost:5173,"
        "http://127.0.0.1:5173,"
        "http://localhost:3000,"
        "https://servify.devhaki.com,"
        "https://www.servify.devhaki.com"
    )
    CORS_ORIGIN_REGEX: str = r"^(https?://(localhost|127\.0\.0\.1)(:\d+)?|https://([a-z0-9-]+\.)?devhaki\.com)$"
    PUBLIC_MENU_URL: str = "http://localhost:5173/menu/public"

    @property
    def cors_origins_list(self) -> list[str]:
        """Allow CORS origins from .env as CSV or JSON array string."""
        raw = self.CORS_ORIGINS.strip()
        origins: list[str]

        if raw.startswith("["):
            try:
                parsed = json.loads(raw)
                if isinstance(parsed, list):
                    origins = [str(origin).strip() for origin in parsed if str(origin).strip()]
                else:
                    origins = []
            except json.JSONDecodeError:
                origins = []
        else:
            origins = [origin.strip() for origin in raw.split(",") if origin.strip()]

        normalized: list[str] = []
        for origin in origins:
            cleaned_origin = origin.rstrip("/")
            if cleaned_origin and cleaned_origin not in normalized:
                normalized.append(cleaned_origin)

        return normalized
    
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

    @field_validator("UPLOAD_DIR", "INVOICE_DIR", mode="before")
    @classmethod
    def normalize_storage_dirs(cls, value: str, info) -> str:
        if not isinstance(value, str):
            return value

        path = value.strip()
        if _is_vercel() and (path.startswith("./") or path.startswith("../") or not path.startswith("/tmp/")):
            if info.field_name == "UPLOAD_DIR":
                return "/tmp/uploads"
            return "/tmp/invoices"

        return path

    @field_validator("RUNTIME_SETTINGS_FILE", mode="before")
    @classmethod
    def normalize_runtime_settings_file(cls, value: str) -> str:
        if not isinstance(value, str):
            return value

        path = value.strip()
        if _is_vercel() and (path.startswith("./") or path.startswith("../") or not path.startswith("/tmp/")):
            return "/tmp/runtime_settings.json"

        return path
    
    model_config = {"env_file": ".env", "case_sensitive": True}


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
