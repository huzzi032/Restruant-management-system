"""
Table schemas
"""
from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


class TableStatus(str, Enum):
    AVAILABLE = "available"
    OCCUPIED = "occupied"
    RESERVED = "reserved"
    CLEANING = "cleaning"


class TableBase(BaseModel):
    table_number: str = Field(..., min_length=1, max_length=20)
    capacity: int = Field(default=4, ge=1)
    location: Optional[str] = None
    notes: Optional[str] = None


class TableCreate(TableBase):
    pass


class TableUpdate(BaseModel):
    table_number: Optional[str] = None
    capacity: Optional[int] = Field(default=None, ge=1)
    location: Optional[str] = None
    status: Optional[TableStatus] = None
    notes: Optional[str] = None


class TableResponse(TableBase):
    id: int
    status: TableStatus
    current_order_id: Optional[int] = None
    
    class Config:
        from_attributes = True
