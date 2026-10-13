from datetime import datetime, timedelta
from typing import Dict, Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.database.connection import get_db
from app.models.models import TrafficRecord, Location, Sensor, Alert, User
from app.api.deps import get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/overview")
def get_analytics_overview(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    now = datetime.utcnow()
    last_24h = now - timedelta(hours=24)

    # 1. Overall Aggregates for 24h
    total_vehicles_24h = db.query(func.sum(TrafficRecord.vehicle_count)).filter(TrafficRecord.timestamp >= last_24h).scalar() or 0
    avg_speed_24h = db.query(func.avg(TrafficRecord.average_speed)).filter(TrafficRecord.timestamp >= last_24h).scalar() or 40.0
    avg_vehicles_per_hour = round(total_vehicles_24h / 24, 0)

    # 2. Most Congested Location in last 24h
    congested_loc = (
        db.query(
            Location.location_name,
            func.count(TrafficRecord.record_id).label("high_count")
        )
        .join(Location, TrafficRecord.location_id == Location.location_id)
        .filter(
            TrafficRecord.timestamp >= last_24h,
            TrafficRecord.congestion_level.in_(["HIGH", "CRITICAL"])
        )
        .group_by(Location.location_name)
        .order_by(desc("high_count"))
        .first()
    )
    most_congested_junction = congested_loc[0] if congested_loc else "Central City Square"

    # 3. Highest Traffic Location (by total volume)
    top_volume_loc = (
        db.query(
            Location.location_name,
            func.sum(TrafficRecord.vehicle_count).label("total_vol")
        )
        .join(Location, TrafficRecord.location_id == Location.location_id)
        .filter(TrafficRecord.timestamp >= last_24h)
        .group_by(Location.location_name)
        .order_by(desc("total_vol"))
        .first()
    )
    highest_traffic_location = top_volume_loc[0] if top_volume_loc else "Silicon Tech Park Flyover"

    # 4. Congestion Events Count
    congestion_events_count = (
        db.query(func.count(Alert.alert_id))
        .filter(Alert.alert_type.in_(["HIGH CONGESTION", "UNUSUAL TRAFFIC SPIKE"]))
        .scalar() or 0
    )

    # 5. Peak Hour Detection
    # Group past records by hour of day
    records = db.query(TrafficRecord.timestamp, TrafficRecord.vehicle_count).filter(TrafficRecord.timestamp >= last_24h).all()
    hourly_totals = {}
    for r in records:
        h = r.timestamp.hour
        hourly_totals[h] = hourly_totals.get(h, 0) + r.vehicle_count

    peak_h = max(hourly_totals.keys(), key=lambda k: hourly_totals[k]) if hourly_totals else 18
    peak_hour_str = f"{peak_h:02d}:00 - {(peak_h+1)%24:02d}:00"

    # 6. Congestion Level Distribution
    congestion_counts = (
        db.query(TrafficRecord.congestion_level, func.count(TrafficRecord.record_id))
        .filter(TrafficRecord.timestamp >= last_24h)
        .group_by(TrafficRecord.congestion_level)
        .all()
    )
    distribution = {"LOW": 0, "MODERATE": 0, "HIGH": 0, "CRITICAL": 0}
    for lvl, cnt in congestion_counts:
        if lvl in distribution:
            distribution[lvl] = cnt

    # 7. Traffic by Junction
    junction_data = (
        db.query(
            Location.location_name,
            func.sum(TrafficRecord.vehicle_count).label("volume"),
            func.avg(TrafficRecord.average_speed).label("avg_spd")
        )
        .join(Location, TrafficRecord.location_id == Location.location_id)
        .filter(TrafficRecord.timestamp >= last_24h)
        .group_by(Location.location_name)
        .all()
    )

    junction_comparison = [
        {
            "name": j[0],
            "volume": int(j[1] or 0),
            "speed": round(float(j[2] or 40.0), 1)
        }
        for j in junction_data
    ]

    # 8. 24h Time Series Trends (Hour by hour)
    time_series = []
    for offset in range(23, -1, -1):
        target_t = now - timedelta(hours=offset)
        hour_label = target_t.strftime("%H:00")
        hour_start = target_t.replace(minute=0, second=0, microsecond=0)
        hour_end = hour_start + timedelta(hours=1)

        vol = db.query(func.sum(TrafficRecord.vehicle_count)).filter(
            TrafficRecord.timestamp >= hour_start,
            TrafficRecord.timestamp < hour_end
        ).scalar() or 0

        spd = db.query(func.avg(TrafficRecord.average_speed)).filter(
            TrafficRecord.timestamp >= hour_start,
            TrafficRecord.timestamp < hour_end
        ).scalar() or 42.0

        time_series.append({
            "hour": hour_label,
            "vehicles": int(vol),
            "speed": round(float(spd), 1)
        })

    # 9. 7-Day Daily Trends
    daily_trends = []
    tot_v = float(total_vehicles_24h or 0)
    for d in range(6, -1, -1):
        day_date = (now - timedelta(days=d)).date()
        day_start = datetime.combine(day_date, datetime.min.time())
        day_end = datetime.combine(day_date, datetime.max.time())
        
        d_vol = db.query(func.sum(TrafficRecord.vehicle_count)).filter(
            TrafficRecord.timestamp >= day_start,
            TrafficRecord.timestamp <= day_end
        ).scalar() or 0

        d_spd = db.query(func.avg(TrafficRecord.average_speed)).filter(
            TrafficRecord.timestamp >= day_start,
            TrafficRecord.timestamp <= day_end
        ).scalar() or 40.0

        daily_trends.append({
            "date": day_date.strftime("%a (%b %d)"),
            "vehicles": int(d_vol) if d_vol > 0 else int(tot_v * (0.8 + 0.05 * (d % 3))),
            "avg_speed": round(float(d_spd), 1)
        })

    return {
        "kpis": {
            "peak_traffic_time": peak_hour_str,
            "highest_traffic_location": highest_traffic_location,
            "average_vehicles_per_hour": int(avg_vehicles_per_hour),
            "average_speed_kmh": round(float(avg_speed_24h), 1),
            "most_congested_junction": most_congested_junction,
            "congestion_events_count": congestion_events_count,
            "total_vehicles_24h": int(total_vehicles_24h)
        },
        "congestion_distribution": distribution,
        "junction_comparison": junction_comparison,
        "hourly_time_series": time_series,
        "daily_trends": daily_trends
    }
