from datetime import datetime, timedelta
from typing import Dict, Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.database.connection import get_db
from app.models.models import Sensor, Location, TrafficRecord, Alert, User
from app.schemas.schemas import DashboardSummary, LiveJunctionTraffic, AlertOut
from app.services.traffic_service import get_live_junction_status
from app.api.deps import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    total_sensors = db.query(Sensor).count()
    active_sensors = db.query(Sensor).filter(Sensor.status == "ONLINE").count()
    warning_sensors = db.query(Sensor).filter(Sensor.status == "WARNING").count()
    offline_sensors = db.query(Sensor).filter(Sensor.status.in_(["OFFLINE", "MAINTENANCE"])).count()

    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    vehicles_sum = db.query(func.sum(TrafficRecord.vehicle_count)).filter(TrafficRecord.timestamp >= today_start).scalar() or 0

    active_alerts_count = db.query(Alert).filter(Alert.status == "ACTIVE").count()

    # Calculate congested locations
    locations = db.query(Location).filter(Location.status == "ACTIVE").all()
    congested_count = 0
    speeds = []

    for loc in locations:
        live = get_live_junction_status(loc.location_id, db)
        if live.get("congestion_level") in ["HIGH", "CRITICAL"]:
            congested_count += 1
        if "average_speed" in live:
            speeds.append(live["average_speed"])

    avg_city_speed = round(sum(speeds) / len(speeds), 1) if speeds else 42.0

    system_status = "NORMAL"
    if active_alerts_count >= 5 or congested_count >= 4 or (offline_sensors / max(1, total_sensors)) > 0.3:
        system_status = "CRITICAL"
    elif active_alerts_count > 0 or congested_count > 1 or offline_sensors > 1:
        system_status = "WARNING"

    return {
        "total_sensors": total_sensors,
        "active_sensors": active_sensors,
        "offline_sensors": offline_sensors,
        "warning_sensors": warning_sensors,
        "vehicles_today": int(vehicles_sum),
        "congested_locations": congested_count,
        "active_alerts": active_alerts_count,
        "average_city_speed": avg_city_speed,
        "system_status": system_status
    }

@router.get("/live-overview", response_model=List[LiveJunctionTraffic])
def get_dashboard_live_overview(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    locations = db.query(Location).filter(Location.status == "ACTIVE").all()
    overview = []
    for loc in locations:
        data = get_live_junction_status(loc.location_id, db)
        overview.append(data)
    return overview

@router.get("/hourly-trend")
def get_dashboard_hourly_trend(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Past 12 hours aggregation
    past_12h = datetime.utcnow() - timedelta(hours=12)
    records = (
        db.query(
            TrafficRecord.timestamp,
            TrafficRecord.vehicle_count,
            TrafficRecord.average_speed
        )
        .filter(TrafficRecord.timestamp >= past_12h)
        .order_by(TrafficRecord.timestamp.asc())
        .all()
    )

    # Group by hour
    buckets = {}
    for r in records:
        hour_key = r.timestamp.strftime("%H:00")
        if hour_key not in buckets:
            buckets[hour_key] = {"vehicles": 0, "speeds": [], "count": 0}
        buckets[hour_key]["vehicles"] += r.vehicle_count
        buckets[hour_key]["speeds"].append(float(r.average_speed))
        buckets[hour_key]["count"] += 1

    labels = list(buckets.keys())
    vehicles_data = [buckets[k]["vehicles"] for k in labels]
    speed_data = [
        round(sum(buckets[k]["speeds"]) / len(buckets[k]["speeds"]), 1) if buckets[k]["speeds"] else 45.0
        for k in labels
    ]

    return {
        "labels": labels,
        "vehicles": vehicles_data,
        "speeds": speed_data
    }
