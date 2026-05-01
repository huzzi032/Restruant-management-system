"""
Employee management models
"""
from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, DateTime, Date, Enum, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, date
import enum

from app.core.database import Base


class EmployeeStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    ON_LEAVE = "on_leave"
    TERMINATED = "terminated"


class AttendanceStatus(str, enum.Enum):
    PRESENT = "present"
    ABSENT = "absent"
    LATE = "late"
    HALF_DAY = "half_day"
    LEAVE = "leave"


class Employee(Base):
    """Employee record"""
    __tablename__ = "employees"
    
    id = Column(Integer, primary_key=True, index=True)
    employee_code = Column(String(50), unique=True, nullable=False)
    
    # Personal info
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=True)
    phone = Column(String(20), nullable=True)
    address = Column(Text, nullable=True)
    
    # Employment info
    role = Column(String(50), nullable=False)  # chef, waiter, manager, etc.
    department = Column(String(50), nullable=True)
    
    # Salary
    base_salary = Column(Float, default=0.0)
    hourly_rate = Column(Float, default=0.0)
    
    # Dates
    hire_date = Column(Date, default=date.today)
    termination_date = Column(Date, nullable=True)
    
    # Status
    status = Column(Enum(EmployeeStatus), default=EmployeeStatus.ACTIVE)
    
    # Emergency contact
    emergency_contact_name = Column(String(100), nullable=True)
    emergency_contact_phone = Column(String(20), nullable=True)
    
    # Documents
    id_number = Column(String(100), nullable=True)
    
    # Notes
    notes = Column(Text, nullable=True)
    
    # Tracking
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    attendance_records = relationship("Attendance", back_populates="employee", order_by="Attendance.date.desc()")
    salaries = relationship("Salary", back_populates="employee", order_by="Salary.month.desc()")
    
    def __repr__(self):
        return f"<Employee {self.employee_code} - {self.full_name}>"
    
    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"
    
    @property
    def attendance_rate(self) -> float:
        """Calculate attendance rate for current month"""
        current_month = datetime.now().month
        current_year = datetime.now().year
        
        month_records = [
            r for r in self.attendance_records
            if r.date.month == current_month and r.date.year == current_year
        ]
        
        if not month_records:
            return 100.0
        
        present_count = sum(1 for r in month_records if r.status in [AttendanceStatus.PRESENT, AttendanceStatus.LATE])
        return (present_count / len(month_records)) * 100
    
    def to_dict(self):
        return {
            "id": self.id,
            "employee_code": self.employee_code,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "full_name": self.full_name,
            "email": self.email,
            "phone": self.phone,
            "address": self.address,
            "role": self.role,
            "department": self.department,
            "base_salary": round(self.base_salary, 2),
            "hourly_rate": round(self.hourly_rate, 2),
            "hire_date": self.hire_date.isoformat() if self.hire_date else None,
            "termination_date": self.termination_date.isoformat() if self.termination_date else None,
            "status": self.status.value,
            "emergency_contact_name": self.emergency_contact_name,
            "emergency_contact_phone": self.emergency_contact_phone,
            "id_number": self.id_number,
            "notes": self.notes,
            "attendance_rate": round(self.attendance_rate, 2),
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class Attendance(Base):
    """Employee attendance record"""
    __tablename__ = "attendance"
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    date = Column(Date, nullable=False)
    
    status = Column(Enum(AttendanceStatus), default=AttendanceStatus.PRESENT)
    
    # Time tracking
    check_in = Column(DateTime, nullable=True)
    check_out = Column(DateTime, nullable=True)
    
    # Hours worked
    hours_worked = Column(Float, default=0.0)
    
    # Overtime
    overtime_hours = Column(Float, default=0.0)
    
    # Notes
    notes = Column(Text, nullable=True)
    
    # Tracking
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    employee = relationship("Employee", back_populates="attendance_records")
    user = relationship("User")
    
    def __repr__(self):
        return f"<Attendance {self.employee.full_name if self.employee else 'Unknown'} - {self.date} - {self.status}>"
    
    def to_dict(self):
        return {
            "id": self.id,
            "employee_id": self.employee_id,
            "employee_name": self.employee.full_name if self.employee else None,
            "date": self.date.isoformat() if self.date else None,
            "status": self.status.value,
            "check_in": self.check_in.isoformat() if self.check_in else None,
            "check_out": self.check_out.isoformat() if self.check_out else None,
            "hours_worked": self.hours_worked,
            "overtime_hours": self.overtime_hours,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class Salary(Base):
    """Employee salary record"""
    __tablename__ = "salaries"
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    
    # Month and year
    month = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)
    
    # Earnings
    base_salary = Column(Float, default=0.0)
    overtime_pay = Column(Float, default=0.0)
    bonus = Column(Float, default=0.0)
    allowances = Column(Float, default=0.0)
    total_earnings = Column(Float, default=0.0)
    
    # Deductions
    tax = Column(Float, default=0.0)
    insurance = Column(Float, default=0.0)
    other_deductions = Column(Float, default=0.0)
    total_deductions = Column(Float, default=0.0)
    
    # Net pay
    net_salary = Column(Float, default=0.0)
    
    # Status
    is_paid = Column(Boolean, default=False)
    paid_date = Column(DateTime, nullable=True)
    paid_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Notes
    notes = Column(Text, nullable=True)
    
    # Tracking
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    employee = relationship("Employee", back_populates="salaries")
    payer = relationship("User", foreign_keys=[paid_by])
    
    def __repr__(self):
        return f"<Salary {self.employee.full_name if self.employee else 'Unknown'} - {self.month}/{self.year}>"
    
    def calculate_totals(self):
        """Calculate salary totals"""
        self.total_earnings = self.base_salary + self.overtime_pay + self.bonus + self.allowances
        self.total_deductions = self.tax + self.insurance + self.other_deductions
        self.net_salary = self.total_earnings - self.total_deductions
        return self.net_salary
    
    def to_dict(self):
        return {
            "id": self.id,
            "employee_id": self.employee_id,
            "employee_name": self.employee.full_name if self.employee else None,
            "month": self.month,
            "year": self.year,
            "base_salary": round(self.base_salary, 2),
            "overtime_pay": round(self.overtime_pay, 2),
            "bonus": round(self.bonus, 2),
            "allowances": round(self.allowances, 2),
            "total_earnings": round(self.total_earnings, 2),
            "tax": round(self.tax, 2),
            "insurance": round(self.insurance, 2),
            "other_deductions": round(self.other_deductions, 2),
            "total_deductions": round(self.total_deductions, 2),
            "net_salary": round(self.net_salary, 2),
            "is_paid": self.is_paid,
            "paid_date": self.paid_date.isoformat() if self.paid_date else None,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
