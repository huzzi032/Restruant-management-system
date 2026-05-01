"""
User schemas
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from typing import List


class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: Optional[EmailStr] = None
    full_name: str = Field(..., min_length=1, max_length=100)
    role: str = "waiter"
    is_active: bool = True


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None


class BulkUserCreate(BaseModel):
    role: str
    shared_password: str = Field(..., min_length=6)
    quantity: int = Field(..., ge=1, le=100)
    username_prefix: str = Field(..., min_length=2, max_length=30)
    name_prefix: str = Field(..., min_length=2, max_length=50)
    start_index: int = Field(default=1, ge=1)
    names: Optional[List[str]] = None


class UserResponse(UserBase):
    id: int
    restaurant_id: int
    restaurant_name: Optional[str] = None
    restaurant_code: Optional[str] = None
    created_at: Optional[datetime] = None
    last_login: Optional[datetime] = None
    
    model_config = {"from_attributes": True}


class BulkUserCreateResponse(BaseModel):
    created_users: List[UserResponse]
    skipped_usernames: List[str] = []


class UserLogin(BaseModel):
    restaurant_code: Optional[str] = None
    username: str
    password: str


class RestaurantSignup(BaseModel):
    restaurant_name: str = Field(..., min_length=2, max_length=120)
    admin_full_name: str = Field(..., min_length=2, max_length=100)
    admin_username: str = Field(..., min_length=3, max_length=50)
    admin_email: Optional[EmailStr] = None
    password: str = Field(..., min_length=6)


class RestaurantSignupResponse(BaseModel):
    restaurant_id: int
    restaurant_name: str
    restaurant_code: str
    admin_user: UserResponse


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenPayload(BaseModel):
    sub: Optional[int] = None
    exp: Optional[datetime] = None
