from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database.connection import get_db
from app.models.models import Sensor, Location, User, TrafficRecord, Alert
from app.schemas.schemas import SensorOut, SensorCreate, SensorUpdate
from app.services.traffic_service import get_latest_sensor_reading
from app.api.deps import get_current_user, require_roles

router = APIRouter(prefix="/sensors", tags=["Sensors"])

@router.get("", response_model=List[SensorOut])
def list_sensors(
    location_id: Optional[int] = None,
    status: Optional[str] = None,
    sensor_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Sensor)
    if location_id:
        query = query.filter(Sensor.location_id == location_id)
    if status and status != "ALL":
        query = query.filter(Sensor.status == status)
    if sensor_type and sensor_type != "ALL":
        query = query.filter(Sensor.sensor_type == sensor_type)

    sensors = query.order_by(Sensor.sensor_id.asc()).all()
    results = []
    for s in sensors:
        reading = get_latest_sensor_reading(s.sensor_id, db)
        s_dict = SensorOut.from_orm(s)
        s_dict.current_reading = reading
        results.append(s_dict)

    return results

@router.get("/{sensor_id}", response_model=SensorOut)
def get_sensor(sensor_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    sensor = db.query(Sensor).filter(Sensor.sensor_id == sensor_id).first()
    if not sensor:
        raise HTTPException(status_code=404, detail="Sensor not found")

    reading = get_latest_sensor_reading(sensor_id, db)
    res = SensorOut.from_orm(sensor)
    res.current_reading = reading
    return res

@router.post("", response_model=SensorOut, status_code=status.HTTP_201_CREATED)
def create_sensor(
    payload: SensorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN"]))
):
    # Check if sensor_code exists
    existing = db.query(Sensor).filter(Sensor.sensor_code == payload.sensor_code.strip().upper()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Sensor with this code already exists")

    loc = db.query(Location).filter(Location.location_id == payload.location_id).first()
    if not loc:
        raise HTTPException(status_code=400, detail="Specified Location ID does not exist")

    sensor = Sensor(
        sensor_code=payload.sensor_code.strip().upper(),
        sensor_type=payload.sensor_type,
        location_id=payload.location_id,
        model=payload.model,
        status=payload.status,
        installed_at=payload.installed_at,
        battery_health=payload.battery_health,
        firmware_version=payload.firmware_version,
        last_communication=datetime.utcnow()
    )
    db.add(sensor)
    db.commit()
    db.refresh(sensor)
    return sensor

@router.put("/{sensor_id}", response_model=SensorOut)
def update_sensor(
    sensor_id: int,
    payload: SensorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN"]))
):
    sensor = db.query(Sensor).filter(Sensor.sensor_id == sensor_id).first()
    if not sensor:
        raise HTTPException(status_code=404, detail="Sensor not found")

    if payload.sensor_type is not None:
        sensor.sensor_type = payload.sensor_type
    if payload.location_id is not None:
        loc = db.query(Location).filter(Location.location_id == payload.location_id).first()
        if not loc:
            raise HTTPException(status_code=400, detail="Location does not exist")
        sensor.location_id = payload.location_id
    if payload.model is not None:
        sensor.model = payload.model
    if payload.status is not None:
        sensor.status = payload.status
        # If toggling offline, generate alert
        if payload.status == "OFFLINE":
            alert = Alert(
                sensor_id=sensor.sensor_id,
                location_id=sensor.location_id,
                alert_type="SENSOR OFFLINE",
                severity="WARNING",
                message=f"Sensor {sensor.sensor_code} marked as OFFLINE by Admin {current_user.name}.",
                status="ACTIVE",
                created_at=datetime.utcnow()
            )
            db.add(alert)
    if payload.battery_health is not None:
        sensor.battery_health = payload.battery_health
    if payload.firmware_version is not None:
        sensor.firmware_version = payload.firmware_version

    sensor.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(sensor)
    return sensor

@router.post("/{sensor_id}/ping")
def ping_sensor(sensor_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    sensor = db.query(Sensor).filter(Sensor.sensor_id == sensor_id).first()
    if not sensor:
        raise HTTPException(status_code=404, detail="Sensor not found")

    sensor.last_communication = datetime.utcnow()
    if sensor.status == "OFFLINE":
        sensor.status = "ONLINE"
    db.commit()
    return {"message": f"Sensor {sensor.sensor_code} telemetry acknowledged", "status": sensor.status}
