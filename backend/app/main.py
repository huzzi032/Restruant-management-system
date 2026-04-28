"""
Restaurant Management System - FastAPI Backend
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os
import logging
from logging.config import dictConfig

from app.core.config import settings
from app.core.business_settings import business_settings_store
from app.core.database import init_db
from app.routers import api_router


# Configure logging
log_config = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {
            "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        },
    },
    "handlers": {
        "default": {
            "formatter": "default",
            "class": "logging.StreamHandler",
            "stream": "ext://sys.stdout",
        },
    },
    "loggers": {
        "app": {"handlers": ["default"], "level": "INFO"},
        "sqlalchemy": {"handlers": ["default"], "level": "WARNING"},
    },
}

dictConfig(log_config)
logger = logging.getLogger("app")


def _ensure_writable_dir(path: str, fallback: str) -> str:
    """Create directory or gracefully fallback to a writable /tmp path."""
    try:
        os.makedirs(path, exist_ok=True)
        return path
    except OSError:
        os.makedirs(fallback, exist_ok=True)
        return fallback


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler"""
    # Startup
    logger.info("Starting up Restaurant Management System...")
    logger.info(f"Database URL: {settings.DATABASE_URL[:50]}..." if settings.DATABASE_URL else "No DATABASE_URL set")
    app.state.startup_ok = True
    app.state.startup_error = None

    try:
        # Create storage directories with serverless-safe fallback.
        settings.UPLOAD_DIR = _ensure_writable_dir(settings.UPLOAD_DIR, "/tmp/uploads")
        settings.INVOICE_DIR = _ensure_writable_dir(settings.INVOICE_DIR, "/tmp/invoices")
        logger.info(f"Upload directory: {settings.UPLOAD_DIR}")
        logger.info(f"Invoice directory: {settings.INVOICE_DIR}")

        # Initialize database
        logger.info("Initializing database...")
        init_db()
        logger.info("Database initialized successfully")
        
        logger.info("Loading business settings...")
        business_settings_store.load()
        logger.info("Business settings loaded")
    except Exception as exc:
        app.state.startup_ok = False
        app.state.startup_error = str(exc)
        logger.error(f"Startup error: {exc}", exc_info=True)
    
    yield
    
    # Shutdown
    logger.info("Shutting down Restaurant Management System...")


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description="""
    Restaurant Management System API
    
    ## Features
    - **Authentication**: JWT-based auth with role-based access control
    - **Menu Management**: Categories, items, ingredients
    - **Order Management**: Table orders, takeaway, delivery
    - **Kitchen Display**: Real-time order tracking
    - **Billing & Payments**: Multiple payment methods
    - **Inventory**: Stock tracking, purchase orders
    - **Employees**: Attendance, salary management
    - **Reports**: Sales, expenses, analytics
    - **AI Insights**: Groq-powered business intelligence
    
    ## Roles
    - **admin**: Full system access
    - **manager**: Most operations except user management
    - **waiter**: Order taking, table management
    - **chef**: Kitchen operations
    - **cashier**: Payment processing
    """,
    version=settings.APP_VERSION,
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_origin_regex=settings.CORS_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files (uploaded menu images and other assets)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR, check_dir=False), name="uploads")


# Exception handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler"""
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "message": str(exc) if settings.DEBUG else "Something went wrong"
        }
    )


# Include API router
app.include_router(api_router, prefix="/api/v1")


# Health check endpoint
@app.get("/health")
def health_check():
    """Health check endpoint"""
    startup_ok = getattr(app.state, "startup_ok", True)
    startup_error = getattr(app.state, "startup_error", None)

    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "startup_ok": startup_ok,
        "startup_error": startup_error,
    }


# Root endpoint
@app.get("/")
def root():
    """Root endpoint"""
    return {
        "message": f"Welcome to {settings.APP_NAME}",
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "api": "/api/v1"
    }


# Run the application
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
