from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.models.models import (
    TrafficRecord, Sensor, Location, Alert, SystemSetting
)

def get_congestion_thresholds(db: Session) -> Dict[str, float]:
    settings = db.query(SystemSetting).filter(SystemSetting.category == "THRESHOLDS").all()
    setting_map = {s.setting_key: s.setting_value for s in settings}
    return {
        "low_vpm": float(setting_map.get("CONGESTION_LOW_THRESHOLD", 40)),
        "medium_vpm": float(setting_map.get("CONGESTION_MEDIUM_THRESHOLD", 70)),
        "critical_speed": float(setting_map.get("CONGESTION_CRITICAL_SPEED_KMH", 18))
    }

def calculate_congestion_level(
    vehicle_count: int,
    average_speed: float,
    capacity_vpm: int = 80,
    speed_limit_kmh: int = 50,
    thresholds: Optional[Dict[str, float]] = None
) -> str:
    """
    Mathematical Congestion Index Model:
    Score = 0.65 * (Vehicles / Capacity) + 0.35 * (1 - Speed / SpeedLimit)
    Classifies traffic into LOW, MODERATE, HIGH, CRITICAL
    """
    if thresholds is None:
        low_t = 40
        med_t = 70
        crit_s = 18
    else:
        low_t = thresholds["low_vpm"]
        med_t = thresholds["medium_vpm"]
        crit_s = thresholds["critical_speed"]

    # Calculate normalized indices
    cap_ratio = min(1.5, vehicle_count / max(1, capacity_vpm))
    speed_ratio = max(0.0, min(1.0, average_speed / max(1, speed_limit_kmh)))
    speed_deficit = 1.0 - speed_ratio

    congestion_index = (0.60 * cap_ratio) + (0.40 * speed_deficit)

    if average_speed <= crit_s and vehicle_count >= med_t:
        return "CRITICAL"
    elif congestion_index >= 0.85 or vehicle_count > med_t:
        return "HIGH"
    elif congestion_index >= 0.45 or vehicle_count > low_t:
        return "MODERATE"
    else:
        return "LOW"

def get_latest_sensor_reading(sensor_id: int, db: Session) -> Optional[Dict[str, Any]]:
    record = (
        db.query(TrafficRecord)
        .filter(TrafficRecord.sensor_id == sensor_id)
        .order_by(desc(TrafficRecord.timestamp))
        .first()
    )
    if not record:
        return None
    return {
        "vehicle_count": record.vehicle_count,
        "average_speed": float(record.average_speed),
        "traffic_density": float(record.traffic_density),
        "congestion_level": record.congestion_level,
        "timestamp": record.timestamp
    }

def get_live_junction_status(location_id: int, db: Session) -> Dict[str, Any]:
    location = db.query(Location).filter(Location.location_id == location_id).first()
    if not location:
        return {}

    # Get active sensors at this location
    sensors = db.query(Sensor).filter(Sensor.location_id == location_id).all()
    active_sensors = [s for s in sensors if s.status == "ONLINE"]
    
    # Get latest records for these sensors
    sensor_ids = [s.sensor_id for s in sensors]
    
    latest_records = []
    for sid in sensor_ids:
        rec = (
            db.query(TrafficRecord)
            .filter(TrafficRecord.sensor_id == sid)
            .order_by(desc(TrafficRecord.timestamp))
            .first()
        )
        if rec:
            latest_records.append(rec)

    if latest_records:
        avg_veh = int(sum(r.vehicle_count for r in latest_records) / len(latest_records))
        avg_spd = round(sum(float(r.average_speed) for r in latest_records) / len(latest_records), 1)
        avg_den = round(sum(float(r.traffic_density) for r in latest_records) / len(latest_records), 1)
        last_up = max(r.timestamp for r in latest_records)
    else:
        avg_veh = 0
        avg_spd = float(location.speed_limit_kmh)
        avg_den = 0.0
        last_up = datetime.utcnow()

    thresholds = get_congestion_thresholds(db)
    congestion_lvl = calculate_congestion_level(
        vehicle_count=avg_veh,
        average_speed=avg_spd,
        capacity_vpm=location.capacity_vpm,
        speed_limit_kmh=location.speed_limit_kmh,
        thresholds=thresholds
    )

    sensor_overall_status = "ONLINE"
    if not sensors or all(s.status == "OFFLINE" for s in sensors):
        sensor_overall_status = "OFFLINE"
    elif any(s.status == "WARNING" for s in sensors):
        sensor_overall_status = "WARNING"
    elif any(s.status == "MAINTENANCE" for s in sensors):
        sensor_overall_status = "MAINTENANCE"

    return {
        "location_id": location.location_id,
        "location_code": location.location_code,
        "location_name": location.location_name,
        "area": location.area,
        "latitude": float(location.latitude),
        "longitude": float(location.longitude),
        "vehicle_count": avg_veh,
        "average_speed": avg_spd,
        "traffic_density": avg_den,
        "congestion_level": congestion_lvl,
        "sensor_status": sensor_overall_status,
        "active_sensors_count": len(active_sensors),
        "total_sensors_count": len(sensors),
        "last_updated": last_up,
        "speed_limit": location.speed_limit_kmh,
        "capacity_vpm": location.capacity_vpm
    }
