import asyncio
import logging
import random
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from app.database.connection import SessionLocal
from app.models.models import Sensor, Location, TrafficRecord, SystemSetting, Alert
from app.services.traffic_service import calculate_congestion_level, get_congestion_thresholds
from app.services.alert_service import check_and_create_alerts

logger = logging.getLogger("uvicorn")

# Global simulation state
is_simulator_running = False
anomaly_override_location_id: Optional[int] = None
anomaly_expires_at: Optional[datetime] = None

def trigger_simulation_incident(location_id: int, duration_minutes: int = 5):
    global anomaly_override_location_id, anomaly_expires_at
    anomaly_override_location_id = location_id
    anomaly_expires_at = datetime.utcnow() + timedelta(minutes=duration_minutes)
    logger.info(f"Traffic incident injected at Location ID {location_id} for {duration_minutes} minutes")

async def run_traffic_simulator_loop():
    global is_simulator_running, anomaly_override_location_id, anomaly_expires_at
    is_simulator_running = True
    logger.info("Starting background Smart City Traffic Simulator loop...")

    while is_simulator_running:
        try:
            db: Session = SessionLocal()
            try:
                # Check simulation interval setting
                interval_setting = db.query(SystemSetting).filter(SystemSetting.setting_key == "SIMULATION_INTERVAL_SEC").first()
                interval_sec = int(interval_setting.setting_value) if interval_setting else 6
                
                thresholds = get_congestion_thresholds(db)
                sensors = db.query(Sensor).all()
                now = datetime.utcnow()
                hour_of_day = now.hour

                # Determine diurnal traffic factor
                # Morning peak (8-10) and Evening peak (17-20)
                if (8 <= hour_of_day <= 10) or (17 <= hour_of_day <= 20):
                    time_factor = random.uniform(1.35, 1.75)
                elif 0 <= hour_of_day <= 5:
                    time_factor = random.uniform(0.15, 0.35)
                else:
                    time_factor = random.uniform(0.75, 1.15)

                records_to_add = []

                for sensor in sensors:
                    if sensor.status == "OFFLINE":
                        continue

                    # Random intermittent warning/offline test simulation (low probability)
                    if random.random() < 0.005 and sensor.status == "ONLINE":
                        sensor.status = "WARNING"
                        sensor.battery_health = max(10, sensor.battery_health - 5)

                    location = sensor.location
                    if not location:
                        continue

                    base_cap = location.capacity_vpm
                    speed_limit = location.speed_limit_kmh

                    # Check if incident is active for this location
                    has_incident = (
                        anomaly_override_location_id == location.location_id and
                        anomaly_expires_at and datetime.utcnow() < anomaly_expires_at
                    )

                    if has_incident:
                        # Heavy gridlock simulation
                        veh_count = int(base_cap * random.uniform(1.2, 1.5))
                        avg_speed = round(random.uniform(9.0, 16.0), 1)
                        density = round(random.uniform(88.0, 99.5), 1)
                    else:
                        veh_count = int(max(4, min(120, base_cap * time_factor * random.uniform(0.7, 1.15))))
                        speed_factor = max(0.2, 1.0 - (veh_count / (base_cap * 1.35)))
                        avg_speed = round(max(10.0, speed_limit * speed_factor * random.uniform(0.88, 1.08)), 1)
                        density = round(min(100.0, (veh_count / base_cap) * 100.0 * random.uniform(0.9, 1.05)), 1)

                    congestion_level = calculate_congestion_level(
                        vehicle_count=veh_count,
                        average_speed=avg_speed,
                        capacity_vpm=base_cap,
                        speed_limit_kmh=speed_limit,
                        thresholds=thresholds
                    )

                    # Update sensor ping
                    sensor.last_communication = now

                    # Create record
                    rec = TrafficRecord(
                        sensor_id=sensor.sensor_id,
                        location_id=location.location_id,
                        timestamp=now,
                        vehicle_count=veh_count,
                        average_speed=avg_speed,
                        traffic_density=density,
                        congestion_level=congestion_level,
                        weather_condition="CLEAR"
                    )
                    records_to_add.append(rec)

                    # Check alerts
                    check_and_create_alerts(
                        sensor_id=sensor.sensor_id,
                        location_id=location.location_id,
                        vehicle_count=veh_count,
                        average_speed=avg_speed,
                        congestion_level=congestion_level,
                        db=db
                    )

                if records_to_add:
                    db.add_all(records_to_add)
                    db.commit()

            except Exception as e:
                db.rollback()
                logger.error(f"Error in simulator loop step: {e}")
            finally:
                db.close()

        except Exception as outer_e:
            logger.error(f"Simulator error: {outer_e}")

        await asyncio.sleep(6)
