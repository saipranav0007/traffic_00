from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.models import User
from app.schemas.schemas import LoginRequest, TokenResponse, UserOut, ForgotPasswordRequest
from app.core.security import verify_password, create_access_token
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    # Standardize input
    emp_id = payload.employee_id.strip().upper()
    user = db.query(User).filter(User.employee_id == emp_id).first()

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Employee ID or Password"
        )

    if user.status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is currently inactive. Contact the system administrator."
        )

    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    db.refresh(user)

    role_name = user.role.role_name if user.role else "TRAFFIC_OPERATOR"
    token = create_access_token(data={
        "sub": user.employee_id,
        "user_id": user.user_id,
        "role": role_name,
        "name": user.name
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    # Check if employee exists without leaking detail directly in timing
    emp_id = payload.employee_id.strip().upper()
    user = db.query(User).filter(User.employee_id == emp_id, User.email == payload.email).first()
    
    # Secure message
    return {
        "message": "If the Officer ID and email match an authorized personnel account, a password reset authorization request has been dispatched to the Central Traffic Control System Administrator."
    }
