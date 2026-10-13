from datetime import datetime, timedelta
from typing import Optional, List
import io
import csv
from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc
from app.database.connection import get_db
from app.models.models import TrafficRecord, Sensor, Location, User
from app.schemas.schemas import TrafficRecordOut, LiveJunctionTraffic
from app.services.traffic_service import get_live_junction_status
from app.api.deps import get_current_user

router = APIRouter(prefix="/traffic", tags=["Traffic Data"])

@router.get("/live", response_model=List[LiveJunctionTraffic])
def get_live_traffic(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    locations = db.query(Location).filter(Location.status == "ACTIVE").all()
    results = [get_live_junction_status(loc.location_id, db) for loc in locations]
    return results

@router.get("/records")
def get_traffic_records(
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=5, le=200),
    location_id: Optional[int] = None,
    sensor_id: Optional[int] = None,
    congestion_level: Optional[str] = None,
    search: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = (
        db.query(TrafficRecord)
        .join(Sensor, TrafficRecord.sensor_id == Sensor.sensor_id)
        .join(Location, TrafficRecord.location_id == Location.location_id)
    )

    if location_id:
        query = query.filter(TrafficRecord.location_id == location_id)
    if sensor_id:
        query = query.filter(TrafficRecord.sensor_id == sensor_id)
    if congestion_level and congestion_level != "ALL":
        query = query.filter(TrafficRecord.congestion_level == congestion_level)

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Location.location_name.ilike(search_pattern)) |
            (Sensor.sensor_code.ilike(search_pattern)) |
            (Location.area.ilike(search_pattern))
        )

    if start_date:
        try:
            s_dt = datetime.fromisoformat(start_date.replace("Z", "+00:00"))
            query = query.filter(TrafficRecord.timestamp >= s_dt)
        except Exception:
            pass

    if end_date:
        try:
            e_dt = datetime.fromisoformat(end_date.replace("Z", "+00:00"))
            query = query.filter(TrafficRecord.timestamp <= e_dt)
        except Exception:
            pass

    total_count = query.count()
    offset = (page - 1) * limit
    records = query.order_by(desc(TrafficRecord.timestamp)).offset(offset).limit(limit).all()

    formatted_records = []
    for r in records:
        formatted_records.append({
            "record_id": r.record_id,
            "sensor_id": r.sensor_id,
            "sensor_code": r.sensor.sensor_code if r.sensor else "N/A",
            "location_id": r.location_id,
            "location_name": r.location.location_name if r.location else "N/A",
            "location_area": r.location.area if r.location else "N/A",
            "timestamp": r.timestamp,
            "vehicle_count": r.vehicle_count,
            "average_speed": float(r.average_speed),
            "traffic_density": float(r.traffic_density),
            "congestion_level": r.congestion_level,
            "weather_condition": r.weather_condition
        })

    return {
        "items": formatted_records,
        "total": total_count,
        "page": page,
        "limit": limit,
        "total_pages": (total_count + limit - 1) // limit if total_count > 0 else 1
    }

@router.get("/export/csv")
def export_traffic_records_csv(
    location_id: Optional[int] = None,
    congestion_level: Optional[str] = None,
    limit: int = 1000,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = (
        db.query(TrafficRecord)
        .join(Sensor, TrafficRecord.sensor_id == Sensor.sensor_id)
        .join(Location, TrafficRecord.location_id == Location.location_id)
        .order_by(desc(TrafficRecord.timestamp))
        .limit(limit)
    )

    if location_id:
        query = query.filter(TrafficRecord.location_id == location_id)
    if congestion_level and congestion_level != "ALL":
        query = query.filter(TrafficRecord.congestion_level == congestion_level)

    records = query.all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Record ID", "Timestamp", "Sensor Code", "Location Name", "Area",
        "Vehicle Count (veh/min)", "Average Speed (km/h)", "Density (%)",
        "Congestion Level", "Weather"
    ])

    for r in records:
        writer.writerow([
            r.record_id,
            r.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            r.sensor.sensor_code if r.sensor else "N/A",
            r.location.location_name if r.location else "N/A",
            r.location.area if r.location else "N/A",
            r.vehicle_count,
            float(r.average_speed),
            float(r.traffic_density),
            r.congestion_level,
            r.weather_condition
        ])

    output.seek(0)
    response = StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv"
    )
    filename = f"traffic_records_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
    response.headers["Content-Disposition"] = f"attachment; filename={filename}"
    return response
