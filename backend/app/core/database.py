"""
Database configuration and session management
"""
from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
from contextlib import contextmanager
import os

from app.core.config import settings


# Create engine based on database URL
if settings.DATABASE_URL.startswith("sqlite"):
    # SQLite configuration for development
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        echo=settings.DEBUG
    )
else:
    # PostgreSQL configuration for production
    engine = create_engine(
        settings.DATABASE_URL,
        pool_size=20,
        max_overflow=0,
        echo=settings.DEBUG
    )

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


def get_db() -> Session:
    """Get database session - for dependency injection"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@contextmanager
def get_db_context():
    """Context manager for database sessions"""
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def init_db():
    """Initialize database - create all tables"""
    # Import all models to ensure they're registered
    from app.models import (
        user, menu, order, inventory, 
        employee, expense, payment, table
    )
    
    Base.metadata.create_all(bind=engine)
    _ensure_order_pickup_columns()
    _seed_default_users()
    if settings.ENABLE_DEMO_SEED:
        _seed_default_categories()
        _seed_default_tables()
    print("Database initialized successfully!")


def _ensure_order_pickup_columns():
    """Lightweight migration for new order pickup tracking fields."""
    if not settings.DATABASE_URL.startswith("sqlite"):
        return

    with engine.begin() as connection:
        result = connection.exec_driver_sql("PRAGMA table_info(orders)")
        existing_columns = {row[1] for row in result.fetchall()}

        if "picked_up_by" not in existing_columns:
            connection.exec_driver_sql("ALTER TABLE orders ADD COLUMN picked_up_by INTEGER")

        if "picked_up_at" not in existing_columns:
            connection.exec_driver_sql("ALTER TABLE orders ADD COLUMN picked_up_at DATETIME")


def _seed_default_users():
    """Create only an admin account if there are no users yet."""
    from app.core.security import get_password_hash
    from app.models.user import User, UserRole

    db = SessionLocal()
    try:
        if db.query(User).count() == 0:
            db.add(
                User(
                    username="admin",
                    full_name="System Admin",
                    hashed_password=get_password_hash("admin123"),
                    role=UserRole.ADMIN,
                    is_active=True,
                    is_superuser=True,
                )
            )

        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def _seed_default_categories():
    """Create default menu categories if they do not exist yet."""
    from app.models.menu import Category

    default_categories = [
        ("Fast Food", "Burgers, fries, wraps, and quick bites"),
        ("Main Course", "Signature meals and chef specials"),
        ("BBQ", "Grilled and smoked dishes"),
        ("Drinks", "Hot and cold beverages"),
        ("Desserts", "Sweet dishes and bakery items"),
    ]

    db = SessionLocal()
    try:
        for index, (name, description) in enumerate(default_categories, start=1):
            exists = db.query(Category).filter(Category.name == name).first()
            if exists:
                continue

            db.add(
                Category(
                    name=name,
                    description=description,
                    sort_order=index,
                    is_active=True,
                )
            )

        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def _seed_default_tables():
    """Create default restaurant tables if they do not exist yet."""
    from app.models.table import Table, TableStatus

    default_tables = [
        ("T1", 2, "Indoor"),
        ("T2", 2, "Indoor"),
        ("T3", 4, "Indoor"),
        ("T4", 4, "Indoor"),
        ("T5", 6, "Outdoor"),
        ("T6", 8, "Family Zone"),
    ]

    db = SessionLocal()
    try:
        for table_number, capacity, location in default_tables:
            exists = db.query(Table).filter(Table.table_number == table_number).first()
            if exists:
                continue

            db.add(
                Table(
                    table_number=table_number,
                    capacity=capacity,
                    location=location,
                    status=TableStatus.AVAILABLE,
                )
            )

        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def drop_db():
    """Drop all tables - use with caution!"""
    Base.metadata.drop_all(bind=engine)
    print("Database dropped!")


# SQLite foreign key support
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_conn, connection_record):
    """Enable foreign key support for SQLite"""
    if settings.DATABASE_URL.startswith("sqlite"):
        cursor = dbapi_conn.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()
