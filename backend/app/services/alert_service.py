from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models.models import Alert, Sensor, Location, TrafficRecord, SystemSetting

def check_and_create_alerts(
    sensor_id: int,
    location_id: int,
    vehicle_count: int,
    average_speed: float,
    congestion_level: str,
    db: Session
) -> Optional[Alert]:
    """
    Evaluates new sensor reading against alert rules:
    - CRITICAL congestion -> CRITICAL alert
    - Speed < 18 km/h and count > 65 -> CRITICAL bottleneck alert
    - Traffic density > 90% -> WARNING alert
    Deduplicates active alerts within 15 minutes for the same sensor/location.
    """
    # Check if auto alert is enabled
    auto_setting = db.query(SystemSetting).filter(SystemSetting.setting_key == "ALERT_AUTO_GENERATE").first()
    if auto_setting and auto_setting.setting_value.lower() != "true":
        return None

    # Check for recent active alert
    recent_cutoff = datetime.utcnow() - timedelta(minutes=15)
    existing = (
        db.query(Alert)
        .filter(
            Alert.location_id == location_id,
            Alert.status == "ACTIVE",
            Alert.created_at >= recent_cutoff
        )
        .first()
    )

    if existing:
        return None  # Do not spam duplicate active alerts

    location = db.query(Location).filter(Location.location_id == location_id).first()
    loc_name = location.location_name if location else f"Location #{location_id}"

    new_alert = None
    if congestion_level == "CRITICAL" or (average_speed <= 15.0 and vehicle_count >= 70):
        new_alert = Alert(
            sensor_id=sensor_id,
            location_id=location_id,
            alert_type="HIGH CONGESTION",
            severity="CRITICAL",
            message=f"Critical gridlock detected at {loc_name}. Average speed plummeted to {average_speed} km/h with volume {vehicle_count} veh/min.",
            status="ACTIVE",
            created_at=datetime.utcnow()
        )
    elif congestion_level == "HIGH":
        new_alert = Alert(
            sensor_id=sensor_id,
            location_id=location_id,
            alert_type="UNUSUAL TRAFFIC SPIKE",
            severity="WARNING",
            message=f"Heavy traffic volume surge at {loc_name}. Vehicle count: {vehicle_count}/min, Speed: {average_speed} km/h.",
            status="ACTIVE",
            created_at=datetime.utcnow()
        )

    if new_alert:
        db.add(new_alert)
        db.commit()
        db.refresh(new_alert)

    return new_alert
