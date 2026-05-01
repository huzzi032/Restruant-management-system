"""
Authentication service
"""
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from fastapi import HTTPException, status
import re
import secrets
import time
from typing import TypeVar, Callable, Any

from app.models.user import User, UserRole
from app.models.restaurant import Restaurant
from app.core.security import verify_password, get_password_hash, create_access_token
from app.schemas.user import UserCreate, UserUpdate, BulkUserCreate, RestaurantSignup


def _retry_on_db_error(max_retries: int = 3, initial_delay: float = 0.5):
    """
    Decorator to retry database operations on connection errors.
    Uses exponential backoff: 0.5s, 1s, 2s, etc.
    """
    def decorator(func: Callable) -> Callable:
        def wrapper(*args, **kwargs) -> Any:
            delay = initial_delay
            last_error = None
            
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    last_error = e
                    # Check if it's a connection error
                    error_msg = str(e).lower()
                    if any(keyword in error_msg for keyword in ['connection', 'network', 'timeout', 'cannot assign']):
                        if attempt < max_retries - 1:
                            print(f"Database connection error (attempt {attempt + 1}/{max_retries}): {e}")
                            time.sleep(delay)
                            delay *= 2  # Exponential backoff
                            continue
                    # Re-raise non-connection errors immediately
                    raise
            
            # If we exhausted retries, raise the last error
            if last_error:
                raise last_error
        
        return wrapper
    return decorator


class AuthService:
    """Service for authentication and user management"""

    @staticmethod
    def _normalize_username(username: str) -> str:
        """Normalize usernames so login is consistent across admin-created accounts."""
        return (username or "").strip().lower()

    @staticmethod
    def _normalize_restaurant_code(code: str) -> str:
        return (code or "").strip().lower()

    @staticmethod
    def _generate_restaurant_code(name: str) -> str:
        base = re.sub(r"[^a-z0-9]+", "-", (name or "").strip().lower()).strip("-")
        base = base[:20] if base else "restaurant"
        suffix = secrets.token_hex(2)
        return f"{base}-{suffix}"

    @staticmethod
    def _find_restaurant(db: Session, restaurant_code: str | None):
        if not restaurant_code:
            return None
        normalized_code = AuthService._normalize_restaurant_code(restaurant_code)
        return db.query(Restaurant).filter(func.lower(Restaurant.code) == normalized_code).first()
    
    @staticmethod
    def authenticate_user(db: Session, username: str, password: str, restaurant_code: str | None = None):
        """Authenticate user with username and password"""
        normalized_username = AuthService._normalize_username(username)
        query = db.query(User).filter(func.lower(User.username) == normalized_username)

        if restaurant_code:
            restaurant = AuthService._find_restaurant(db, restaurant_code)
            if not restaurant:
                return None
            query = query.filter(User.restaurant_id == restaurant.id)

        user = query.first()
        
        if not user:
            return None
        
        if not verify_password(password, user.hashed_password):
            return None
        
        # Update last login
        user.last_login = datetime.utcnow()
        db.commit()
        
        return user
    
    @staticmethod
    def create_user(db: Session, user_data: UserCreate, restaurant_id: int):
        """Create a new user"""
        try:
            normalized_role = UserRole(user_data.role)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid role. Allowed roles: {', '.join([r.value for r in UserRole])}"
            )

        normalized_username = AuthService._normalize_username(user_data.username)
        if len(normalized_username) < 3:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username must be at least 3 characters"
            )

        # Check if username exists
        if db.query(User).filter(
            func.lower(User.username) == normalized_username,
            User.restaurant_id == restaurant_id,
        ).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already registered"
            )
        
        # Check if email exists
        if user_data.email and db.query(User).filter(
            User.email == user_data.email,
            User.restaurant_id == restaurant_id,
        ).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Create user
        db_user = User(
            restaurant_id=restaurant_id,
            username=normalized_username,
            email=user_data.email,
            full_name=user_data.full_name,
            hashed_password=get_password_hash(user_data.password),
            role=normalized_role,
            is_active=user_data.is_active
        )
        
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        return db_user

    @staticmethod
    def create_users_in_bulk(db: Session, bulk_data: BulkUserCreate, restaurant_id: int):
        """Create multiple role-based user portals with same password."""
        try:
            normalized_role = UserRole(bulk_data.role)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid role. Allowed roles: {', '.join([r.value for r in UserRole])}"
            )

        username_prefix = AuthService._normalize_username(bulk_data.username_prefix)

        created_users = []
        skipped_usernames = []
        password_hash = get_password_hash(bulk_data.shared_password)

        def _sanitize_username(name: str) -> str:
            sanitized = "".join(ch.lower() for ch in name if ch.isalnum())
            return sanitized or bulk_data.username_prefix.lower()

        custom_names = [name.strip() for name in (bulk_data.names or []) if name and name.strip()]
        if custom_names:
            for idx, full_name in enumerate(custom_names, start=bulk_data.start_index):
                username = f"{username_prefix}{_sanitize_username(full_name)}"
                if db.query(User).filter(
                    func.lower(User.username) == username,
                    User.restaurant_id == restaurant_id,
                ).first():
                    username = f"{username}{idx}"

                if db.query(User).filter(
                    func.lower(User.username) == username,
                    User.restaurant_id == restaurant_id,
                ).first():
                    skipped_usernames.append(username)
                    continue

                user = User(
                    restaurant_id=restaurant_id,
                    username=username,
                    full_name=full_name,
                    hashed_password=password_hash,
                    role=normalized_role,
                    is_active=True,
                )
                db.add(user)
                created_users.append(user)

            db.commit()

            for user in created_users:
                db.refresh(user)

            return created_users, skipped_usernames

        for offset in range(bulk_data.quantity):
            current_index = bulk_data.start_index + offset
            username = f"{username_prefix}{current_index}"
            full_name = f"{bulk_data.name_prefix} {current_index}"

            if db.query(User).filter(
                func.lower(User.username) == username,
                User.restaurant_id == restaurant_id,
            ).first():
                skipped_usernames.append(username)
                continue

            user = User(
                restaurant_id=restaurant_id,
                username=username,
                full_name=full_name,
                hashed_password=password_hash,
                role=normalized_role,
                is_active=True,
            )
            db.add(user)
            created_users.append(user)

        db.commit()

        for user in created_users:
            db.refresh(user)

        return created_users, skipped_usernames
    
    @staticmethod
    def get_user_by_id(db: Session, user_id: int, restaurant_id: int):
        """Get user by ID"""
        return db.query(User).filter(User.id == user_id, User.restaurant_id == restaurant_id).first()
    
    @staticmethod
    def get_user_by_username(db: Session, username: str, restaurant_id: int):
        """Get user by username"""
        return db.query(User).filter(User.username == username, User.restaurant_id == restaurant_id).first()
    
    @staticmethod
    def get_users(db: Session, restaurant_id: int, skip: int = 0, limit: int = 100, role: str = None):
        """Get list of users with optional filtering"""
        query = db.query(User).filter(User.restaurant_id == restaurant_id)
        
        if role:
            query = query.filter(User.role == role)
        
        return query.offset(skip).limit(limit).all()
    
    @staticmethod
    def update_user(db: Session, user_id: int, user_data: UserUpdate, restaurant_id: int):
        """Update user"""
        user = db.query(User).filter(User.id == user_id, User.restaurant_id == restaurant_id).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        update_data = user_data.model_dump(exclude_unset=True)
        
        # Handle password update
        if "password" in update_data and update_data["password"]:
            update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
        
        # Handle role update
        if "role" in update_data and update_data["role"]:
            update_data["role"] = UserRole(update_data["role"])
        
        for field, value in update_data.items():
            setattr(user, field, value)
        
        db.commit()
        db.refresh(user)
        
        return user
    
    @staticmethod
    def delete_user(db: Session, user_id: int, restaurant_id: int):
        """Delete (deactivate) user"""
        user = db.query(User).filter(User.id == user_id, User.restaurant_id == restaurant_id).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Soft delete - just deactivate
        user.is_active = False
        db.commit()
        
        return user
    
    @staticmethod
    def login(db: Session, username: str, password: str, restaurant_code: str | None = None):
        """Login and return token"""
        user = AuthService.authenticate_user(db, username, password, restaurant_code)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        access_token = create_access_token(data={"sub": str(user.id), "rid": str(user.restaurant_id)})
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user
        }

    @staticmethod
    @_retry_on_db_error(max_retries=3, initial_delay=0.5)
    def signup_restaurant(db: Session, payload: RestaurantSignup):
        """Create a restaurant tenant and an admin account for it."""
        normalized_username = AuthService._normalize_username(payload.admin_username)
        restaurant_code = AuthService._generate_restaurant_code(payload.restaurant_name)

        while db.query(Restaurant).filter(func.lower(Restaurant.code) == restaurant_code).first():
            restaurant_code = AuthService._generate_restaurant_code(payload.restaurant_name)

        restaurant = Restaurant(
            name=payload.restaurant_name.strip(),
            code=restaurant_code,
        )
        db.add(restaurant)
        db.flush()

        if db.query(User).filter(
            func.lower(User.username) == normalized_username,
            User.restaurant_id == restaurant.id,
        ).first():
            normalized_username = f"{normalized_username}{secrets.randbelow(900) + 100}"

        if db.query(User).filter(func.lower(User.username) == normalized_username).first():
            normalized_username = f"{normalized_username}{secrets.randbelow(900) + 100}"

        admin_user = User(
            restaurant_id=restaurant.id,
            username=normalized_username,
            email=payload.admin_email,
            full_name=payload.admin_full_name.strip(),
            hashed_password=get_password_hash(payload.password),
            role=UserRole.ADMIN,
            is_active=True,
            is_superuser=True,
        )
        db.add(admin_user)
        db.commit()
        db.refresh(restaurant)
        db.refresh(admin_user)

        return restaurant, admin_user
