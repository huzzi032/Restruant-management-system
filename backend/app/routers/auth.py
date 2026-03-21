"""
Authentication router
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user, require_admin
from app.schemas.user import UserCreate, UserUpdate, UserResponse, UserLogin, Token
from app.services.auth_service import AuthService
from app.models.user import User

router = APIRouter()
security = HTTPBearer()


@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Login and get access token"""
    result = AuthService.login(db, credentials.username, credentials.password)
    return {
        "access_token": result["access_token"],
        "token_type": result["token_type"],
        "user": result["user"].to_dict()
    }


@router.post("/register", response_model=UserResponse)
def register(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Register a new user (admin only)"""
    user = AuthService.create_user(db, user_data)
    return user.to_dict()


@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user info"""
    return current_user.to_dict()


@router.post("/logout")
def logout():
    """Logout - client should discard token"""
    return {"message": "Successfully logged out"}
