"""
Employee management router
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from app.core.database import get_db
from app.core.security import get_current_user, require_manager, require_admin
from app.schemas.employee import (
    EmployeeCreate, EmployeeUpdate, EmployeeResponse,
    AttendanceCreate, AttendanceUpdate, AttendanceResponse,
    SalaryCreate, SalaryUpdate, SalaryResponse
)
from app.services.employee_service import EmployeeService
from app.models.user import User

router = APIRouter()


# ========== Employee Endpoints ==========

@router.get("/", response_model=List[EmployeeResponse])
def get_employees(
    status: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Get employees (manager and above)"""
    employees = EmployeeService.get_employees(db, status, role, search)
    return [emp.to_dict() for emp in employees]


@router.get("/{employee_id}", response_model=EmployeeResponse)
def get_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Get employee by ID"""
    employee = EmployeeService.get_employee_by_id(db, employee_id)
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )
    return employee.to_dict()


@router.post("/", response_model=EmployeeResponse)
def create_employee(
    employee_data: EmployeeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Create new employee (manager and above)"""
    employee = EmployeeService.create_employee(db, employee_data)
    return employee.to_dict()


@router.put("/{employee_id}", response_model=EmployeeResponse)
def update_employee(
    employee_id: int,
    employee_data: EmployeeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Update employee (manager and above)"""
    employee = EmployeeService.update_employee(db, employee_id, employee_data)
    return employee.to_dict()


@router.delete("/{employee_id}")
def delete_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Delete (deactivate) employee (manager and above)"""
    EmployeeService.delete_employee(db, employee_id)
    return {"message": "Employee deactivated successfully"}


# ========== Attendance Endpoints ==========

@router.get("/attendance/records", response_model=List[AttendanceResponse])
def get_attendance(
    employee_id: Optional[int] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Get attendance records (manager and above)"""
    records = EmployeeService.get_attendance(db, employee_id, date_from, date_to)
    return [record.to_dict() for record in records]


@router.post("/attendance", response_model=AttendanceResponse)
def record_attendance(
    attendance_data: AttendanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Record attendance (manager and above)"""
    record = EmployeeService.record_attendance(db, attendance_data, current_user.id)
    return record.to_dict()


@router.put("/attendance/{attendance_id}", response_model=AttendanceResponse)
def update_attendance(
    attendance_id: int,
    attendance_data: AttendanceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Update attendance record (manager and above)"""
    record = EmployeeService.update_attendance(db, attendance_id, attendance_data)
    return record.to_dict()


@router.get("/{employee_id}/attendance-summary")
def get_attendance_summary(
    employee_id: int,
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2000),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Get monthly attendance summary"""
    summary = EmployeeService.get_monthly_attendance_summary(db, employee_id, month, year)
    return summary


# ========== Salary Endpoints ==========

@router.get("/salaries", response_model=List[SalaryResponse])
def get_salaries(
    employee_id: Optional[int] = Query(None),
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None, ge=2000),
    is_paid: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Get salary records (manager and above)"""
    salaries = EmployeeService.get_salaries(db, employee_id, month, year, is_paid)
    return [salary.to_dict() for salary in salaries]


@router.post("/salaries", response_model=SalaryResponse)
def create_salary(
    salary_data: SalaryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Create salary record (manager and above)"""
    salary = EmployeeService.create_salary(db, salary_data)
    return salary.to_dict()


@router.put("/salaries/{salary_id}", response_model=SalaryResponse)
def update_salary(
    salary_id: int,
    salary_data: SalaryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Update salary record (manager and above)"""
    salary = EmployeeService.update_salary(db, salary_id, salary_data)
    return salary.to_dict()


@router.post("/salaries/{salary_id}/pay")
def process_salary_payment(
    salary_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Process salary payment (admin only)"""
    salary = EmployeeService.process_salary_payment(db, salary_id, current_user.id)
    return salary.to_dict()


@router.post("/{employee_id}/auto-generate-salary")
def auto_generate_salary(
    employee_id: int,
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2000),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Auto-generate salary based on attendance (manager and above)"""
    salary = EmployeeService.auto_generate_salary(db, employee_id, month, year)
    return salary.to_dict()
