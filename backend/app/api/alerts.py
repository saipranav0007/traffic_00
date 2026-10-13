from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database.connection import get_db
from app.models.models import Alert, Location, Sensor, User
from app.schemas.schemas import AlertOut, AlertCreate, AlertUpdate
from app.api.deps import get_current_user

router = APIRouter(prefix="/alerts", tags=["Alerts"])

@router.get("", response_model=List[AlertOut])
def get_alerts(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    location_id: Optional[int] = None,
    limit: int = Query(50, ge=5, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Alert)
    if status and status != "ALL":
        query = query.filter(Alert.status == status)
    if severity and severity != "ALL":
        query = query.filter(Alert.severity == severity)
    if location_id:
        query = query.filter(Alert.location_id == location_id)

    alerts = query.order_by(desc(Alert.created_at)).limit(limit).all()
    results = []
    for a in alerts:
        a_dict = AlertOut.from_orm(a)
        a_dict.location_name = a.location.location_name if a.location else None
        a_dict.sensor_code = a.sensor.sensor_code if a.sensor else None
        a_dict.acknowledger_name = a.acknowledger.name if a.acknowledger else None
        a_dict.resolver_name = a.resolver.name if a.resolver else None
        results.append(a_dict)

    return results

@router.post("/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    alert = db.query(Alert).filter(Alert.alert_id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.status = "ACKNOWLEDGED"
    alert.acknowledged_by = current_user.user_id
    alert.acknowledged_at = datetime.utcnow()
    db.commit()
    db.refresh(alert)
    return {"message": "Alert acknowledged successfully", "status": alert.status}

@router.post("/{alert_id}/resolve")
def resolve_alert(alert_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    alert = db.query(Alert).filter(Alert.alert_id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.status = "RESOLVED"
    alert.resolved_by = current_user.user_id
    alert.resolved_at = datetime.utcnow()
    db.commit()
    db.refresh(alert)
    return {"message": "Alert resolved successfully", "status": alert.status}

@router.post("/manual", response_model=AlertOut, status_code=status.HTTP_201_CREATED)
def create_manual_alert(payload: AlertCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    loc = db.query(Location).filter(Location.location_id == payload.location_id).first()
    if not loc:
        raise HTTPException(status_code=400, detail="Location not found")

    alert = Alert(
        sensor_id=payload.sensor_id,
        location_id=payload.location_id,
        alert_type=payload.alert_type,
        severity=payload.severity,
        message=f"[MANUAL OFFICER DISPATCH - {current_user.name}] {payload.message}",
        status="ACTIVE",
        created_at=datetime.utcnow()
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)

    res = AlertOut.from_orm(alert)
    res.location_name = loc.location_name
    return res
