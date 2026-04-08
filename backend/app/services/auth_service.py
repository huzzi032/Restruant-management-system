"""
Authentication service
"""
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from fastapi import HTTPException, status

from app.models.user import User, UserRole
from app.core.security import verify_password, get_password_hash, create_access_token
from app.schemas.user import UserCreate, UserUpdate, BulkUserCreate


class AuthService:
    """Service for authentication and user management"""

    @staticmethod
    def _normalize_username(username: str) -> str:
        """Normalize usernames so login is consistent across admin-created accounts."""
        return (username or "").strip().lower()
    
    @staticmethod
    def authenticate_user(db: Session, username: str, password: str):
        """Authenticate user with username and password"""
        normalized_username = AuthService._normalize_username(username)
        user = db.query(User).filter(func.lower(User.username) == normalized_username).first()
        
        if not user:
            return None
        
        if not verify_password(password, user.hashed_password):
            return None
        
        # Update last login
        user.last_login = datetime.utcnow()
        db.commit()
        
        return user
    
    @staticmethod
    def create_user(db: Session, user_data: UserCreate):
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
        if db.query(User).filter(func.lower(User.username) == normalized_username).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already registered"
            )
        
        # Check if email exists
        if user_data.email and db.query(User).filter(User.email == user_data.email).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Create user
        db_user = User(
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
    def create_users_in_bulk(db: Session, bulk_data: BulkUserCreate):
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
                if db.query(User).filter(func.lower(User.username) == username).first():
                    username = f"{username}{idx}"

                if db.query(User).filter(func.lower(User.username) == username).first():
                    skipped_usernames.append(username)
                    continue

                user = User(
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

            if db.query(User).filter(func.lower(User.username) == username).first():
                skipped_usernames.append(username)
                continue

            user = User(
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
    def get_user_by_id(db: Session, user_id: int):
        """Get user by ID"""
        return db.query(User).filter(User.id == user_id).first()
    
    @staticmethod
    def get_user_by_username(db: Session, username: str):
        """Get user by username"""
        return db.query(User).filter(User.username == username).first()
    
    @staticmethod
    def get_users(db: Session, skip: int = 0, limit: int = 100, role: str = None):
        """Get list of users with optional filtering"""
        query = db.query(User)
        
        if role:
            query = query.filter(User.role == role)
        
        return query.offset(skip).limit(limit).all()
    
    @staticmethod
    def update_user(db: Session, user_id: int, user_data: UserUpdate):
        """Update user"""
        user = db.query(User).filter(User.id == user_id).first()
        
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
    def delete_user(db: Session, user_id: int):
        """Delete (deactivate) user"""
        user = db.query(User).filter(User.id == user_id).first()
        
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
    def login(db: Session, username: str, password: str):
        """Login and return token"""
        user = AuthService.authenticate_user(db, username, password)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        access_token = create_access_token(data={"sub": str(user.id)})
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user
        }
