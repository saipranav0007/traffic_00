from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.models import User, Role
from app.schemas.schemas import UserOut, UserCreate, UserUpdate, RoleOut
from app.core.security import get_password_hash
from app.api.deps import require_roles

router = APIRouter(prefix="/employees", tags=["Employee Management"])

@router.get("", response_model=List[UserOut])
def list_employees(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN"]))
):
    users = db.query(User).order_by(User.user_id.asc()).all()
    return users

@router.get("/roles", response_model=List[RoleOut])
def get_roles(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN"]))
):
    return db.query(Role).all()

@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_employee(
    payload: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN"]))
):
    emp_id = payload.employee_id.strip().upper()
    existing_emp = db.query(User).filter(User.employee_id == emp_id).first()
    if existing_emp:
        raise HTTPException(status_code=400, detail="Employee ID already assigned to another account")

    existing_email = db.query(User).filter(User.email == payload.email.strip().lower()).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered in employee database")

    role = db.query(Role).filter(Role.role_id == payload.role_id).first()
    if not role:
        raise HTTPException(status_code=400, detail="Invalid Role ID")

    new_user = User(
        employee_id=emp_id,
        name=payload.name.strip(),
        email=payload.email.strip().lower(),
        password_hash=get_password_hash(payload.password),
        role_id=payload.role_id,
        department=payload.department.strip(),
        status=payload.status,
        created_at=datetime.utcnow()
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.put("/{user_id}", response_model=UserOut)
def update_employee(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN"]))
):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Employee not found")

    if payload.name is not None:
        user.name = payload.name.strip()
    if payload.email is not None:
        user.email = payload.email.strip().lower()
    if payload.role_id is not None:
        role = db.query(Role).filter(Role.role_id == payload.role_id).first()
        if not role:
            raise HTTPException(status_code=400, detail="Invalid Role ID")
        user.role_id = payload.role_id
    if payload.department is not None:
        user.department = payload.department.strip()
    if payload.status is not None:
        user.status = payload.status
    if payload.password:
        user.password_hash = get_password_hash(payload.password)

    user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    return user

@router.put("/{user_id}/status")
def toggle_employee_status(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN"]))
):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Employee not found")

    if user.user_id == current_user.user_id:
        raise HTTPException(status_code=400, detail="Cannot deactivate your own active admin account")

    user.status = "INACTIVE" if user.status == "ACTIVE" else "ACTIVE"
    user.updated_at = datetime.utcnow()
    db.commit()
    return {"message": f"Account status updated to {user.status}", "status": user.status}

@router.post("/{user_id}/reset-password")
def reset_employee_password(
    user_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN"]))
):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Employee not found")

    new_password = payload.get("new_password")
    if not new_password or len(new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    user.password_hash = get_password_hash(new_password)
    user.updated_at = datetime.utcnow()
    db.commit()
    return {"message": f"Password reset successfully for Officer ID {user.employee_id}"}
