"""
Database configuration and session management
"""
from sqlalchemy import create_engine, event, pool
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool, NullPool
from contextlib import contextmanager
import os
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


def _is_vercel() -> bool:
    return os.getenv("VERCEL") == "1" or bool(os.getenv("VERCEL_ENV"))


def _build_engine(db_url: str):
    if db_url.startswith("sqlite"):
        return create_engine(
            db_url,
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
            echo=settings.DEBUG,
        )

    # PostgreSQL engine configuration
    # For Vercel serverless, we use NullPool to avoid connection pool issues
    # Each function invocation gets a fresh connection
    is_vercel = _is_vercel()
    
    if is_vercel:
        # Vercel serverless: use NullPool (no connection pooling)
        # Each request gets a new connection
        engine = create_engine(
            db_url,
            poolclass=NullPool,
            connect_args={
                "connect_timeout": 10,
                "options": "-c statement_timeout=30000"  # 30 second statement timeout
            },
            echo=settings.DEBUG,
        )
    else:
        # Local development: use standard pool
        engine = create_engine(
            db_url,
            pool_size=10,
            max_overflow=5,
            pool_recycle=3600,  # Recycle connections after 1 hour
            pool_pre_ping=True,  # Verify connections before using them
            connect_args={
                "connect_timeout": 10,
            },
            echo=settings.DEBUG,
        )
    
    return engine


try:
    # Create engine based on configured database URL.
    engine = _build_engine(settings.DATABASE_URL)
    logger.info(f"Database engine created successfully for: {settings.DATABASE_URL[:50]}...")
except Exception as exc:
    fallback_url = "sqlite:////tmp/restaurant.db"
    logger.error(f"Database engine init failed for '{settings.DATABASE_URL}': {exc}")
    logger.info(f"Falling back to '{fallback_url}'")
    engine = _build_engine(fallback_url)

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
        restaurant, user, menu, order, inventory,
        employee, expense, payment, table
    )
    
    Base.metadata.create_all(bind=engine)
    _ensure_restaurant_columns()
    _ensure_order_pickup_columns()
    default_restaurant_id = _ensure_default_restaurant()
    _backfill_restaurant_links(default_restaurant_id)
    _seed_default_users()
    if settings.ENABLE_DEMO_SEED:
        _seed_default_categories(default_restaurant_id)
        _seed_default_tables(default_restaurant_id)
    logger.info("Database initialized successfully!")


def _ensure_restaurant_columns():
    """Lightweight migration to add tenant columns for SQLite installs."""
    if not settings.DATABASE_URL.startswith("sqlite"):
        return

    table_columns = {
        "users": ["restaurant_id"],
        "categories": ["restaurant_id"],
        "menu_items": ["restaurant_id"],
        "tables": ["restaurant_id"],
        "orders": ["restaurant_id"],
    }

    with engine.begin() as connection:
        for table_name, columns in table_columns.items():
            result = connection.exec_driver_sql(f"PRAGMA table_info({table_name})")
            existing_columns = {row[1] for row in result.fetchall()}
            for column_name in columns:
                if column_name not in existing_columns:
                    connection.exec_driver_sql(
                        f"ALTER TABLE {table_name} ADD COLUMN {column_name} INTEGER DEFAULT 1"
                    )


def _ensure_default_restaurant() -> int:
    from app.models.restaurant import Restaurant

    db = SessionLocal()
    try:
        default_restaurant = db.query(Restaurant).filter(Restaurant.code == "default").first()
        if not default_restaurant:
            default_restaurant = Restaurant(name="Restaurant Pro", code="default")
            db.add(default_restaurant)
            db.commit()
            db.refresh(default_restaurant)
        return default_restaurant.id
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def _backfill_restaurant_links(default_restaurant_id: int):
    from app.models.user import User
    from app.models.menu import Category, MenuItem
    from app.models.table import Table
    from app.models.order import Order

    db = SessionLocal()
    try:
        db.query(User).filter(User.restaurant_id.is_(None)).update({"restaurant_id": default_restaurant_id}, synchronize_session=False)
        db.query(Category).filter(Category.restaurant_id.is_(None)).update({"restaurant_id": default_restaurant_id}, synchronize_session=False)
        db.query(MenuItem).filter(MenuItem.restaurant_id.is_(None)).update({"restaurant_id": default_restaurant_id}, synchronize_session=False)
        db.query(Table).filter(Table.restaurant_id.is_(None)).update({"restaurant_id": default_restaurant_id}, synchronize_session=False)
        db.query(Order).filter(Order.restaurant_id.is_(None)).update({"restaurant_id": default_restaurant_id}, synchronize_session=False)
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


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
    from app.models.restaurant import Restaurant
    from app.models.user import User, UserRole

    db = SessionLocal()
    try:
        default_restaurant = db.query(Restaurant).filter(Restaurant.code == "default").first()
        default_restaurant_id = default_restaurant.id if default_restaurant else 1

        if db.query(User).count() == 0:
            db.add(
                User(
                    restaurant_id=default_restaurant_id,
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


def _seed_default_categories(restaurant_id: int):
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
            exists = db.query(Category).filter(Category.name == name, Category.restaurant_id == restaurant_id).first()
            if exists:
                continue

            db.add(
                Category(
                    restaurant_id=restaurant_id,
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


def _seed_default_tables(restaurant_id: int):
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
            exists = db.query(Table).filter(Table.table_number == table_number, Table.restaurant_id == restaurant_id).first()
            if exists:
                continue

            db.add(
                Table(
                    restaurant_id=restaurant_id,
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
