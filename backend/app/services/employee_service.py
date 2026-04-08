"""
Employee management service
"""
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, extract
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from typing import List, Optional
from datetime import datetime, date, timedelta

from app.models.employee import Employee, Attendance, Salary, EmployeeStatus, AttendanceStatus
from app.schemas.employee import EmployeeCreate, EmployeeUpdate, AttendanceCreate, AttendanceUpdate, SalaryCreate, SalaryUpdate


class EmployeeService:
    """Service for employee management"""
    
    # ========== Employee Methods ==========
    
    @staticmethod
    def create_employee(db: Session, employee_data: EmployeeCreate):
        """Create a new employee"""
        payload = employee_data.model_dump()
        payload["employee_code"] = payload["employee_code"].strip()
        payload["first_name"] = payload["first_name"].strip()
        payload["last_name"] = payload["last_name"].strip()
        payload["email"] = (payload.get("email") or "").strip() or None
        payload["phone"] = (payload.get("phone") or "").strip() or None

        # Check if employee code exists
        if db.query(Employee).filter(Employee.employee_code == payload["employee_code"]).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Employee code already exists"
            )

        if payload["email"] and db.query(Employee).filter(Employee.email == payload["email"]).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Employee email already exists"
            )
        
        db_employee = Employee(**payload)
        try:
            db.add(db_employee)
            db.commit()
            db.refresh(db_employee)
            return db_employee
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unable to create employee due to duplicate data"
            )
    
    @staticmethod
    def get_employees(
        db: Session,
        status: Optional[EmployeeStatus] = None,
        role: Optional[str] = None,
        search: Optional[str] = None
    ):
        """Get employees with filtering"""
        query = db.query(Employee)
        
        if status:
            query = query.filter(Employee.status == status)
        
        if role:
            query = query.filter(Employee.role == role)
        
        if search:
            query = query.filter(
                (Employee.first_name.ilike(f"%{search}%")) |
                (Employee.last_name.ilike(f"%{search}%")) |
                (Employee.employee_code.ilike(f"%{search}%"))
            )
        
        return query.order_by(Employee.first_name).all()
    
    @staticmethod
    def get_employee_by_id(db: Session, employee_id: int):
        """Get employee by ID"""
        return db.query(Employee).options(
            joinedload(Employee.attendance_records),
            joinedload(Employee.salaries)
        ).filter(Employee.id == employee_id).first()
    
    @staticmethod
    def update_employee(db: Session, employee_id: int, employee_data: EmployeeUpdate):
        """Update employee"""
        employee = db.query(Employee).filter(Employee.id == employee_id).first()
        
        if not employee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Employee not found"
            )
        
        update_data = employee_data.model_dump(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(employee, field, value)
        
        db.commit()
        db.refresh(employee)
        return employee
    
    @staticmethod
    def delete_employee(db: Session, employee_id: int):
        """Delete (deactivate) employee"""
        employee = db.query(Employee).filter(Employee.id == employee_id).first()
        
        if not employee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Employee not found"
            )
        
        employee.status = EmployeeStatus.INACTIVE
        employee.termination_date = date.today()
        db.commit()
        return employee
    
    # ========== Attendance Methods ==========
    
    @staticmethod
    def record_attendance(db: Session, attendance_data: AttendanceCreate, created_by: int = None):
        """Record employee attendance"""
        # Check if attendance already recorded for this date
        existing = db.query(Attendance).filter(
            Attendance.employee_id == attendance_data.employee_id,
            Attendance.date == attendance_data.date
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Attendance already recorded for this date"
            )
        
        db_attendance = Attendance(
            **attendance_data.model_dump(),
            created_by=created_by
        )
        db.add(db_attendance)
        db.commit()
        db.refresh(db_attendance)
        return db_attendance
    
    @staticmethod
    def update_attendance(db: Session, attendance_id: int, attendance_data: AttendanceUpdate):
        """Update attendance record"""
        attendance = db.query(Attendance).filter(Attendance.id == attendance_id).first()
        
        if not attendance:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Attendance record not found"
            )
        
        update_data = attendance_data.model_dump(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(attendance, field, value)
        
        db.commit()
        db.refresh(attendance)
        return attendance
    
    @staticmethod
    def get_attendance(
        db: Session,
        employee_id: Optional[int] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None
    ):
        """Get attendance records"""
        query = db.query(Attendance).options(
            joinedload(Attendance.employee)
        )
        
        if employee_id:
            query = query.filter(Attendance.employee_id == employee_id)
        
        if date_from:
            query = query.filter(Attendance.date >= date_from)
        
        if date_to:
            query = query.filter(Attendance.date <= date_to)
        
        return query.order_by(Attendance.date.desc()).all()
    
    @staticmethod
    def get_monthly_attendance_summary(db: Session, employee_id: int, month: int, year: int):
        """Get monthly attendance summary for an employee"""
        records = db.query(Attendance).filter(
            Attendance.employee_id == employee_id,
            extract('month', Attendance.date) == month,
            extract('year', Attendance.date) == year
        ).all()
        
        summary = {
            "total_days": len(records),
            "present": sum(1 for r in records if r.status == AttendanceStatus.PRESENT),
            "absent": sum(1 for r in records if r.status == AttendanceStatus.ABSENT),
            "late": sum(1 for r in records if r.status == AttendanceStatus.LATE),
            "half_day": sum(1 for r in records if r.status == AttendanceStatus.HALF_DAY),
            "leave": sum(1 for r in records if r.status == AttendanceStatus.LEAVE),
            "total_hours": sum(r.hours_worked for r in records),
            "total_overtime": sum(r.overtime_hours for r in records)
        }
        
        return summary
    
    # ========== Salary Methods ==========
    
    @staticmethod
    def create_salary(db: Session, salary_data: SalaryCreate):
        """Create salary record"""
        # Check if salary already exists for this month
        existing = db.query(Salary).filter(
            Salary.employee_id == salary_data.employee_id,
            Salary.month == salary_data.month,
            Salary.year == salary_data.year
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Salary already recorded for this month"
            )
        
        db_salary = Salary(**salary_data.model_dump())
        db_salary.calculate_totals()
        
        db.add(db_salary)
        db.commit()
        db.refresh(db_salary)
        return db_salary
    
    @staticmethod
    def update_salary(db: Session, salary_id: int, salary_data: SalaryUpdate):
        """Update salary record"""
        salary = db.query(Salary).filter(Salary.id == salary_id).first()
        
        if not salary:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Salary record not found"
            )
        
        update_data = salary_data.model_dump(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(salary, field, value)
        
        # Recalculate totals
        salary.calculate_totals()
        
        db.commit()
        db.refresh(salary)
        return salary
    
    @staticmethod
    def process_salary_payment(db: Session, salary_id: int, paid_by: int):
        """Mark salary as paid"""
        salary = db.query(Salary).filter(Salary.id == salary_id).first()
        
        if not salary:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Salary record not found"
            )
        
        if salary.is_paid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Salary already paid"
            )
        
        salary.is_paid = True
        salary.paid_date = datetime.utcnow()
        salary.paid_by = paid_by
        
        db.commit()
        db.refresh(salary)
        return salary
    
    @staticmethod
    def get_salaries(
        db: Session,
        employee_id: Optional[int] = None,
        month: Optional[int] = None,
        year: Optional[int] = None,
        is_paid: Optional[bool] = None
    ):
        """Get salary records"""
        query = db.query(Salary).options(
            joinedload(Salary.employee)
        )
        
        if employee_id:
            query = query.filter(Salary.employee_id == employee_id)
        
        if month:
            query = query.filter(Salary.month == month)
        
        if year:
            query = query.filter(Salary.year == year)
        
        if is_paid is not None:
            query = query.filter(Salary.is_paid == is_paid)
        
        return query.order_by(Salary.year.desc(), Salary.month.desc()).all()
    
    @staticmethod
    def auto_generate_salary(db: Session, employee_id: int, month: int, year: int):
        """Auto-generate salary based on attendance"""
        employee = db.query(Employee).filter(Employee.id == employee_id).first()
        
        if not employee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Employee not found"
            )
        
        # Get attendance summary
        attendance_summary = EmployeeService.get_monthly_attendance_summary(
            db, employee_id, month, year
        )
        
        # Calculate salary components
        base_salary = employee.base_salary
        
        # Calculate overtime pay
        overtime_pay = attendance_summary["total_overtime"] * employee.hourly_rate * 1.5
        
        # Create salary record
        salary_data = SalaryCreate(
            employee_id=employee_id,
            month=month,
            year=year,
            base_salary=base_salary,
            overtime_pay=overtime_pay,
            bonus=0,
            allowances=0,
            tax=0,
            insurance=0,
            other_deductions=0
        )
        
        return EmployeeService.create_salary(db, salary_data)
