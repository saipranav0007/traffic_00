from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.models import SystemSetting, User
from app.schemas.schemas import SystemSettingOut, SystemSettingUpdate, PasswordChangeRequest
from app.core.security import verify_password, get_password_hash
from app.simulation.traffic_simulator import trigger_simulation_incident
from app.api.deps import get_current_user, require_roles

router = APIRouter(prefix="/settings", tags=["Settings"])

@router.get("", response_model=List[SystemSettingOut])
def get_system_settings(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(SystemSetting).all()

@router.put("/{key}", response_model=SystemSettingOut)
def update_system_setting(
    key: str,
    payload: SystemSettingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN"]))
):
    setting = db.query(SystemSetting).filter(SystemSetting.setting_key == key).first()
    if not setting:
        raise HTTPException(status_code=404, detail="Setting key not found")

    setting.setting_value = payload.setting_value
    db.commit()
    db.refresh(setting)
    return setting

@router.post("/change-password")
def change_password(
    payload: PasswordChangeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password entered is incorrect")

    if len(payload.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")

    current_user.password_hash = get_password_hash(payload.new_password)
    db.commit()
    return {"message": "Password updated successfully"}

@router.post("/inject-incident")
def inject_incident(
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    location_id = int(payload.get("location_id", 3))
    duration = int(payload.get("duration_minutes", 5))
    trigger_simulation_incident(location_id=location_id, duration_minutes=duration)
    return {"message": f"Simulated high congestion incident injected at Location ID {location_id} for {duration} minutes"}
