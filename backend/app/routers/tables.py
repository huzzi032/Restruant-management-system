"""
Table management router
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user, require_staff, require_manager
from app.schemas.table import TableCreate, TableUpdate, TableResponse
from app.models.table import Table, TableStatus
from app.models.user import User

router = APIRouter()


@router.get("", response_model=List[TableResponse])
@router.get("/", response_model=List[TableResponse])
def get_tables(
    status: TableStatus = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """Get all tables"""
    query = db.query(Table)
    if status:
        query = query.filter(Table.status == status)
    tables = query.order_by(Table.table_number).all()
    return [table.to_dict() for table in tables]


@router.get("/available", response_model=List[TableResponse])
def get_available_tables(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """Get available tables"""
    tables = db.query(Table).filter(Table.status == TableStatus.AVAILABLE).order_by(Table.table_number).all()
    return [table.to_dict() for table in tables]


@router.get("/{table_id}", response_model=TableResponse)
def get_table(
    table_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """Get table by ID"""
    table = db.query(Table).filter(Table.id == table_id).first()
    if not table:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Table not found"
        )
    return table.to_dict()


@router.post("", response_model=TableResponse)
@router.post("/", response_model=TableResponse)
def create_table(
    table_data: TableCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Create new table (manager and above)"""
    # Check if table number exists
    existing = db.query(Table).filter(Table.table_number == table_data.table_number).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Table number already exists"
        )
    
    table = Table(**table_data.model_dump())
    db.add(table)
    db.commit()
    db.refresh(table)
    return table.to_dict()


@router.put("/{table_id}", response_model=TableResponse)
def update_table(
    table_id: int,
    table_data: TableUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Update table (manager and above)"""
    table = db.query(Table).filter(Table.id == table_id).first()
    if not table:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Table not found"
        )
    
    update_data = table_data.model_dump(exclude_unset=True)
    
    # Check table number uniqueness
    if "table_number" in update_data:
        existing = db.query(Table).filter(
            Table.table_number == update_data["table_number"],
            Table.id != table_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Table number already exists"
            )
    
    for field, value in update_data.items():
        setattr(table, field, value)
    
    db.commit()
    db.refresh(table)
    return table.to_dict()


@router.delete("/{table_id}")
def delete_table(
    table_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Delete table (manager and above)"""
    table = db.query(Table).filter(Table.id == table_id).first()
    if not table:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Table not found"
        )
    
    if table.status == TableStatus.OCCUPIED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete occupied table"
        )
    
    db.delete(table)
    db.commit()
    return {"message": "Table deleted successfully"}


@router.patch("/{table_id}/status")
def update_table_status(
    table_id: int,
    status: TableStatus,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """Update table status"""
    table = db.query(Table).filter(Table.id == table_id).first()
    if not table:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Table not found"
        )
    
    table.status = status
    db.commit()
    db.refresh(table)
    return table.to_dict()
