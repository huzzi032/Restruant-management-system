"""
Employee schemas
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, date
from enum import Enum


class EmployeeStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    ON_LEAVE = "on_leave"
    TERMINATED = "terminated"


class AttendanceStatus(str, Enum):
    PRESENT = "present"
    ABSENT = "absent"
    LATE = "late"
    HALF_DAY = "half_day"
    LEAVE = "leave"


# Employee Schemas
class EmployeeBase(BaseModel):
    employee_code: str = Field(..., min_length=1, max_length=50)
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    role: str = Field(..., min_length=1)
    department: Optional[str] = None
    base_salary: float = Field(default=0.0, ge=0)
    hourly_rate: float = Field(default=0.0, ge=0)
    hire_date: date = Field(default_factory=date.today)
    status: EmployeeStatus = EmployeeStatus.ACTIVE
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    id_number: Optional[str] = None
    notes: Optional[str] = None


class EmployeeCreate(EmployeeBase):
    pass


class EmployeeUpdate(BaseModel):
    employee_code: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    base_salary: Optional[float] = Field(default=None, ge=0)
    hourly_rate: Optional[float] = Field(default=None, ge=0)
    hire_date: Optional[date] = None
    termination_date: Optional[date] = None
    status: Optional[EmployeeStatus] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    id_number: Optional[str] = None
    notes: Optional[str] = None


class EmployeeResponse(EmployeeBase):
    id: int
    full_name: str
    attendance_rate: float
    created_at: Optional[datetime] = None
    
    model_config = {"from_attributes": True}


# Attendance Schemas
class AttendanceBase(BaseModel):
    employee_id: int
    date: date
    status: AttendanceStatus = AttendanceStatus.PRESENT
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None
    hours_worked: float = Field(default=0.0, ge=0)
    overtime_hours: float = Field(default=0.0, ge=0)
    notes: Optional[str] = None


class AttendanceCreate(AttendanceBase):
    pass


class AttendanceUpdate(BaseModel):
    status: Optional[AttendanceStatus] = None
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None
    hours_worked: Optional[float] = Field(default=None, ge=0)
    overtime_hours: Optional[float] = Field(default=None, ge=0)
    notes: Optional[str] = None


class AttendanceResponse(AttendanceBase):
    id: int
    employee_name: Optional[str] = None
    created_at: Optional[datetime] = None
    
    model_config = {"from_attributes": True}


# Salary Schemas
class SalaryBase(BaseModel):
    employee_id: int
    month: int = Field(..., ge=1, le=12)
    year: int = Field(..., ge=2000)
    base_salary: float = Field(default=0.0, ge=0)
    overtime_pay: float = Field(default=0.0, ge=0)
    bonus: float = Field(default=0.0, ge=0)
    allowances: float = Field(default=0.0, ge=0)
    tax: float = Field(default=0.0, ge=0)
    insurance: float = Field(default=0.0, ge=0)
    other_deductions: float = Field(default=0.0, ge=0)
    notes: Optional[str] = None


class SalaryCreate(SalaryBase):
    pass


class SalaryUpdate(BaseModel):
    base_salary: Optional[float] = Field(default=None, ge=0)
    overtime_pay: Optional[float] = Field(default=None, ge=0)
    bonus: Optional[float] = Field(default=None, ge=0)
    allowances: Optional[float] = Field(default=None, ge=0)
    tax: Optional[float] = Field(default=None, ge=0)
    insurance: Optional[float] = Field(default=None, ge=0)
    other_deductions: Optional[float] = Field(default=None, ge=0)
    is_paid: Optional[bool] = None
    notes: Optional[str] = None


class SalaryResponse(SalaryBase):
    id: int
    employee_name: Optional[str] = None
    total_earnings: float
    total_deductions: float
    net_salary: float
    is_paid: bool
    paid_date: Optional[datetime] = None
    created_at: Optional[datetime] = None
    
    model_config = {"from_attributes": True}
