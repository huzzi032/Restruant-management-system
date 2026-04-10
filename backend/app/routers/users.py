"""
Users management router
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.core.security import get_current_user, require_admin, require_manager
from app.schemas.user import UserCreate, UserUpdate, UserResponse, BulkUserCreate, BulkUserCreateResponse
from app.services.auth_service import AuthService
from app.models.user import User

router = APIRouter()


@router.get("/", response_model=List[UserResponse])
def get_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    role: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Get list of users (manager and above)"""
    users = AuthService.get_users(db, current_user.restaurant_id, skip=skip, limit=limit, role=role)
    return [user.to_dict() for user in users]


@router.post("/bulk", response_model=BulkUserCreateResponse)
def create_bulk_users(
    bulk_data: BulkUserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Create multiple role portals with a shared password (admin only)."""
    created_users, skipped_usernames = AuthService.create_users_in_bulk(db, bulk_data, current_user.restaurant_id)
    return {
        "created_users": [user.to_dict() for user in created_users],
        "skipped_usernames": skipped_usernames,
    }


@router.post("/", response_model=UserResponse)
def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Create new user (admin only)"""
    user = AuthService.create_user(db, user_data, current_user.restaurant_id)
    return user.to_dict()


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Get user by ID"""
    user = AuthService.get_user_by_id(db, user_id, current_user.restaurant_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user.to_dict()


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Update user (admin only)"""
    user = AuthService.update_user(db, user_id, user_data, current_user.restaurant_id)
    return user.to_dict()


@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Delete (deactivate) user (admin only)"""
    AuthService.delete_user(db, user_id, current_user.restaurant_id)
    return {"message": "User deactivated successfully"}
