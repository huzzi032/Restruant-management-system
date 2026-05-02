"""
Authentication router
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from typing import List
import logging

from app.core.database import get_db
from app.core.security import get_current_user, require_admin
from app.schemas.user import UserCreate, UserResponse, UserLogin, Token, RestaurantSignup, RestaurantSignupResponse
from app.services.auth_service import AuthService
from app.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter()
security = HTTPBearer()


@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Login and get access token"""
    try:
        result = AuthService.login(db, credentials.username, credentials.password, credentials.restaurant_code)
        return {
            "access_token": result["access_token"],
            "token_type": result["token_type"],
            "user": result["user"].to_dict()
        }
    except HTTPException as exc:
        # Preserve auth errors (e.g. 401 for invalid credentials).
        raise exc
    except Exception as e:
        logger.error(f"Login failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection error. Please try again."
        )


@router.post("/signup", response_model=RestaurantSignupResponse)
def signup(payload: RestaurantSignup, db: Session = Depends(get_db)):
    """Create a restaurant tenant and its admin account."""
    try:
        restaurant, admin_user = AuthService.signup_restaurant(db, payload)
        return {
            "restaurant_id": restaurant.id,
            "restaurant_name": restaurant.name,
            "restaurant_code": restaurant.code,
            "admin_user": admin_user.to_dict(),
        }
    except Exception as e:
        logger.error(f"Signup failed: {str(e)}")
        error_msg = str(e).lower()
        if any(keyword in error_msg for keyword in ['connection', 'network', 'timeout']):
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database service temporarily unavailable. Please try again in a moment."
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Signup failed. Please try again."
        )


@router.post("/register", response_model=UserResponse)
def register(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Register a new user (admin only)"""
    user = AuthService.create_user(db, user_data, current_user.restaurant_id)
    return user.to_dict()


@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user info"""
    return current_user.to_dict()


@router.post("/logout")
def logout():
    """Logout - client should discard token"""
    return {"message": "Successfully logged out"}
