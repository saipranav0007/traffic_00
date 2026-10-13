import logging
from datetime import datetime, timedelta
import random
from sqlalchemy.orm import Session
from app.models.models import (
    Base, Role, User, Location, JunctionCorridor, Sensor, TrafficRecord, Alert, SystemSetting
)
from app.core.security import get_password_hash
from app.database.connection import engine, SessionLocal

logger = logging.getLogger("uvicorn")

def init_database():
    logger.info("Initializing Smart City Traffic Database tables...")
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    try:
        # 1. ROLES
        existing_roles = db.query(Role).count()
        if existing_roles == 0:
            roles_data = [
                Role(role_id=1, role_name="ADMIN", description="System Administrator with full access to all modules, users, sensors, and configuration."),
                Role(role_id=2, role_name="TRAFFIC_OFFICER", description="Senior Traffic Officer with authorization to monitor live traffic, alerts, records, and analytics."),
                Role(role_id=3, role_name="TRAFFIC_OPERATOR", description="Traffic Control Room Operator with operational monitoring and alert response permissions.")
            ]
            db.add_all(roles_data)
            db.commit()
            logger.info("Seeded 3 RBAC Roles")

        # 2. AUTHORIZED PERSONNEL / USERS (NO PUBLIC REGISTRATION)
        # Passwords:
        # Admin: Admin@2026
        # Officer: Officer@2026
        # Operator: Operator@2026
        admin_user = db.query(User).filter(User.employee_id == "ADM-001").first()
        if not admin_user:
            users_data = [
                User(
                    employee_id="ADM-001",
                    name="Chief Inspector Rajesh Verma",
                    email="rajesh.verma@traffic.gov.in",
                    password_hash=get_password_hash("Admin@2026"),
                    role_id=1,
                    department="Central Traffic Command & Control",
                    status="ACTIVE",
                    created_at=datetime.utcnow() - timedelta(days=120)
                ),
                User(
                    employee_id="TP-1042",
                    name="Officer Meera Nambiar",
                    email="meera.nambiar@traffic.gov.in",
                    password_hash=get_password_hash("Officer@2026"),
                    role_id=2,
                    department="Urban Traffic Enforcement Division",
                    status="ACTIVE",
                    created_at=datetime.utcnow() - timedelta(days=90)
                ),
                User(
                    employee_id="TSO-0187",
                    name="Operator Arun Kumar",
                    email="arun.kumar@traffic.gov.in",
                    password_hash=get_password_hash("Operator@2026"),
                    role_id=3,
                    department="Smart Mobility Monitoring Center",
                    status="ACTIVE",
                    created_at=datetime.utcnow() - timedelta(days=60)
                ),
                User(
                    employee_id="TP-2055",
                    name="Officer Vikram Rathore",
                    email="vikram.rathore@traffic.gov.in",
                    password_hash=get_password_hash("Officer@2026"),
                    role_id=2,
                    department="North Corridor Patrol Unit",
                    status="ACTIVE",
                    created_at=datetime.utcnow() - timedelta(days=45)
                ),
                User(
                    employee_id="TSO-0219",
                    name="Operator Priya Sundaram",
                    email="priya.sundaram@traffic.gov.in",
                    password_hash=get_password_hash("Operator@2026"),
                    role_id=3,
                    department="Smart Mobility Monitoring Center",
                    status="INACTIVE",
                    created_at=datetime.utcnow() - timedelta(days=30)
                )
            ]
            db.add_all(users_data)
            db.commit()
            logger.info("Seeded 5 Authorized Staff Accounts")

        # 3. LOCATIONS / JUNCTIONS (VERTICES IN GRAPH)
        existing_locs = db.query(Location).count()
        if existing_locs == 0:
            locations_data = [
                Location(location_id=1, location_code="JNC-CENTRAL-01", location_name="Central City Square Junction", area="Downtown District", latitude=12.9716, longitude=77.5946, capacity_vpm=90, speed_limit_kmh=50, status="ACTIVE"),
                Location(location_id=2, location_code="JNC-NORTH-02", location_name="North Boulevard Expressway Cross", area="North Sector", latitude=12.9850, longitude=77.6050, capacity_vpm=85, speed_limit_kmh=60, status="ACTIVE"),
                Location(location_id=3, location_code="JNC-TECH-03", location_name="Silicon Tech Park Flyover", area="Tech Corridor", latitude=12.9352, longitude=77.6946, capacity_vpm=100, speed_limit_kmh=60, status="ACTIVE"),
                Location(location_id=4, location_code="JNC-SOUTH-04", location_name="South Ring Road Interchange", area="South Suburb", latitude=12.9100, longitude=77.5850, capacity_vpm=80, speed_limit_kmh=50, status="ACTIVE"),
                Location(location_id=5, location_code="JNC-HARBOUR-05", location_name="Harbour Port Arterial Road", area="Port Zone", latitude=12.9550, longitude=77.5400, capacity_vpm=75, speed_limit_kmh=45, status="ACTIVE"),
                Location(location_id=6, location_code="JNC-METRO-06", location_name="Metro Terminal Transit Cross", area="West Avenue", latitude=12.9920, longitude=77.5530, capacity_vpm=80, speed_limit_kmh=40, status="ACTIVE"),
                Location(location_id=7, location_code="JNC-AIRPORT-07", location_name="Airport Gateway Corridor", area="Airport Link", latitude=13.0450, longitude=77.6320, capacity_vpm=110, speed_limit_kmh=70, status="ACTIVE"),
                Location(location_id=8, location_code="JNC-OLDTOWN-08", location_name="Heritage Old Market Gate", area="Old City District", latitude=12.9620, longitude=77.5750, capacity_vpm=65, speed_limit_kmh=30, status="ACTIVE")
            ]
            db.add_all(locations_data)
            db.commit()
            logger.info("Seeded 8 City Junctions")

        # 4. JUNCTION CORRIDORS (EDGES FOR GRAPH NETWORK ADSA / DMGT)
        existing_corridors = db.query(JunctionCorridor).count()
        if existing_corridors == 0:
            corridors_data = [
                JunctionCorridor(source_location_id=1, target_location_id=2, road_name="North Central Arterial", distance_km=2.1, lanes=3, base_travel_time_sec=150),
                JunctionCorridor(source_location_id=2, target_location_id=1, road_name="North Central Arterial", distance_km=2.1, lanes=3, base_travel_time_sec=150),
                JunctionCorridor(source_location_id=1, target_location_id=3, road_name="Silicon Expressway Link", distance_km=8.4, lanes=4, base_travel_time_sec=480),
                JunctionCorridor(source_location_id=3, target_location_id=1, road_name="Silicon Expressway Link", distance_km=8.4, lanes=4, base_travel_time_sec=480),
                JunctionCorridor(source_location_id=1, target_location_id=4, road_name="South Spine Corridor", distance_km=6.2, lanes=3, base_travel_time_sec=360),
                JunctionCorridor(source_location_id=4, target_location_id=1, road_name="South Spine Corridor", distance_km=6.2, lanes=3, base_travel_time_sec=360),
                JunctionCorridor(source_location_id=1, target_location_id=8, road_name="Heritage Bypass Road", distance_km=1.8, lanes=2, base_travel_time_sec=180),
                JunctionCorridor(source_location_id=8, target_location_id=1, road_name="Heritage Bypass Road", distance_km=1.8, lanes=2, base_travel_time_sec=180),
                JunctionCorridor(source_location_id=2, target_location_id=7, road_name="Airport Highspeed Corridor", distance_km=9.5, lanes=4, base_travel_time_sec=520),
                JunctionCorridor(source_location_id=7, target_location_id=2, road_name="Airport Highspeed Corridor", distance_km=9.5, lanes=4, base_travel_time_sec=520),
                JunctionCorridor(source_location_id=4, target_location_id=5, road_name="Port-Ring Connection", distance_km=5.3, lanes=3, base_travel_time_sec=300),
                JunctionCorridor(source_location_id=5, target_location_id=4, road_name="Port-Ring Connection", distance_km=5.3, lanes=3, base_travel_time_sec=300),
                JunctionCorridor(source_location_id=8, target_location_id=6, road_name="West City Cross Link", distance_km=3.7, lanes=2, base_travel_time_sec=240),
                JunctionCorridor(source_location_id=6, target_location_id=8, road_name="West City Cross Link", distance_km=3.7, lanes=2, base_travel_time_sec=240),
                JunctionCorridor(source_location_id=6, target_location_id=2, road_name="Metro-North Express Way", distance_km=4.8, lanes=3, base_travel_time_sec=290),
                JunctionCorridor(source_location_id=2, target_location_id=6, road_name="Metro-North Express Way", distance_km=4.8, lanes=3, base_travel_time_sec=290)
            ]
            db.add_all(corridors_data)
            db.commit()
            logger.info("Seeded 16 Inter-Junction Corridors (Graph Network)")

        # 5. SENSORS (14 SENSORS)
        existing_sensors = db.query(Sensor).count()
        if existing_sensors == 0:
            sensors_data = [
                Sensor(sensor_id=1, sensor_code="SNS-CNT-101", sensor_type="Vehicle Counter", location_id=1, model="TrafficSense-VC40", status="ONLINE", installed_at=datetime(2025, 1, 15).date(), battery_health=98, firmware_version="v2.4.1"),
                Sensor(sensor_id=2, sensor_code="SNS-SPD-102", sensor_type="Speed Radar Sensor", location_id=1, model="RadarPro-S90", status="ONLINE", installed_at=datetime(2025, 1, 15).date(), battery_health=95, firmware_version="v2.4.1"),
                Sensor(sensor_id=3, sensor_code="SNS-DEN-103", sensor_type="Traffic Density Sensor", location_id=1, model="OptiFlow-D300", status="ONLINE", installed_at=datetime(2025, 2, 10).date(), battery_health=97, firmware_version="v2.4.1"),
                Sensor(sensor_id=4, sensor_code="SNS-CAM-104", sensor_type="Smart ANPR Camera", location_id=2, model="VisionEye-ANPR8K", status="ONLINE", installed_at=datetime(2025, 2, 20).date(), battery_health=99, firmware_version="v3.1.0"),
                Sensor(sensor_id=5, sensor_code="SNS-SPD-105", sensor_type="Speed Radar Sensor", location_id=2, model="RadarPro-S90", status="ONLINE", installed_at=datetime(2025, 2, 20).date(), battery_health=92, firmware_version="v2.4.1"),
                Sensor(sensor_id=6, sensor_code="SNS-DEN-106", sensor_type="Traffic Density Sensor", location_id=3, model="OptiFlow-D300", status="ONLINE", installed_at=datetime(2025, 3, 1).date(), battery_health=94, firmware_version="v2.4.1"),
                Sensor(sensor_id=7, sensor_code="SNS-CNT-107", sensor_type="Vehicle Counter", location_id=3, model="TrafficSense-VC40", status="ONLINE", installed_at=datetime(2025, 3, 1).date(), battery_health=96, firmware_version="v2.4.1"),
                Sensor(sensor_id=8, sensor_code="SNS-SPD-108", sensor_type="Speed Radar Sensor", location_id=4, model="RadarPro-S90", status="ONLINE", installed_at=datetime(2025, 3, 15).date(), battery_health=88, firmware_version="v2.4.0"),
                Sensor(sensor_id=9, sensor_code="SNS-DEN-109", sensor_type="Traffic Density Sensor", location_id=4, model="OptiFlow-D300", status="ONLINE", installed_at=datetime(2025, 3, 15).date(), battery_health=91, firmware_version="v2.4.1"),
                Sensor(sensor_id=10, sensor_code="SNS-CAM-110", sensor_type="Smart ANPR Camera", location_id=5, model="VisionEye-ANPR8K", status="WARNING", installed_at=datetime(2025, 4, 5).date(), battery_health=73, firmware_version="v3.0.2"),
                Sensor(sensor_id=11, sensor_code="SNS-CNT-111", sensor_type="Vehicle Counter", location_id=6, model="TrafficSense-VC40", status="ONLINE", installed_at=datetime(2025, 4, 10).date(), battery_health=96, firmware_version="v2.4.1"),
                Sensor(sensor_id=12, sensor_code="SNS-DEN-112", sensor_type="Traffic Density Sensor", location_id=7, model="OptiFlow-D300", status="ONLINE", installed_at=datetime(2025, 4, 18).date(), battery_health=100, firmware_version="v3.1.0"),
                Sensor(sensor_id=13, sensor_code="SNS-SPD-113", sensor_type="Speed Radar Sensor", location_id=7, model="RadarPro-S90", status="ONLINE", installed_at=datetime(2025, 4, 18).date(), battery_health=97, firmware_version="v3.1.0"),
                Sensor(sensor_id=14, sensor_code="SNS-CNT-114", sensor_type="Vehicle Counter", location_id=8, model="TrafficSense-VC40", status="OFFLINE", installed_at=datetime(2024, 11, 12).date(), battery_health=45, firmware_version="v2.1.0")
            ]
            db.add_all(sensors_data)
            db.commit()
            logger.info("Seeded 14 Hardware Sensors")

        # 6. SYSTEM SETTINGS
        existing_settings = db.query(SystemSetting).count()
        if existing_settings == 0:
            settings_data = [
                SystemSetting(setting_key="CONGESTION_LOW_THRESHOLD", setting_value="40", category="THRESHOLDS", description="Max vehicles/min threshold for LOW congestion classification"),
                SystemSetting(setting_key="CONGESTION_MEDIUM_THRESHOLD", setting_value="70", category="THRESHOLDS", description="Max vehicles/min threshold for MEDIUM/MODERATE congestion"),
                SystemSetting(setting_key="CONGESTION_CRITICAL_SPEED_KMH", setting_value="18", category="THRESHOLDS", description="Speed in km/h below which triggers CRITICAL congestion alert"),
                SystemSetting(setting_key="ALERT_AUTO_GENERATE", setting_value="true", category="AUTOMATION", description="Automatically create alert when critical congestion or sensor offline is detected"),
                SystemSetting(setting_key="SIMULATION_INTERVAL_SEC", setting_value="5", category="SIMULATOR", description="Interval between background sensor data broadcasts (seconds)"),
                SystemSetting(setting_key="SIMULATION_PEAK_HOUR_OVERRIDE", setting_value="auto", category="SIMULATOR", description="Auto follows real-time clock, or manual forced morning/evening peak mode"),
                SystemSetting(setting_key="OFFLINE_TIMEOUT_MINUTES", setting_value="10", category="SENSORS", description="Threshold minutes without ping before flagging sensor as OFFLINE")
            ]
            db.add_all(settings_data)
            db.commit()
            logger.info("Seeded System Configuration")

        # 7. ALERTS
        existing_alerts = db.query(Alert).count()
        if existing_alerts == 0:
            alerts_data = [
                Alert(
                    sensor_id=6,
                    location_id=3,
                    alert_type="HIGH CONGESTION",
                    severity="CRITICAL",
                    message="Severe traffic bottleneck detected at Silicon Tech Park Flyover. Vehicle density exceeds 88% with average speed down to 14 km/h.",
                    status="ACTIVE",
                    created_at=datetime.utcnow() - timedelta(minutes=14)
                ),
                Alert(
                    sensor_id=14,
                    location_id=8,
                    alert_type="SENSOR OFFLINE",
                    severity="WARNING",
                    message="Sensor SNS-CNT-114 at Heritage Old Market Gate has stopped responding for > 30 minutes. Telemetry signal lost.",
                    status="ACTIVE",
                    created_at=datetime.utcnow() - timedelta(minutes=42)
                ),
                Alert(
                    sensor_id=10,
                    location_id=5,
                    alert_type="UNUSUAL TRAFFIC SPIKE",
                    severity="WARNING",
                    message="Abnormal 140% surge in heavy freight vehicles detected at Harbour Port Arterial Road.",
                    status="ACKNOWLEDGED",
                    acknowledged_by=2,
                    acknowledged_at=datetime.utcnow() - timedelta(minutes=25),
                    created_at=datetime.utcnow() - timedelta(hours=1, minutes=10)
                ),
                Alert(
                    sensor_id=2,
                    location_id=1,
                    alert_type="VERY LOW SPEED",
                    severity="INFO",
                    message="Transient slow-moving queue due to pedestrian phase at Central City Square Junction.",
                    status="RESOLVED",
                    acknowledged_by=3,
                    acknowledged_at=datetime.utcnow() - timedelta(hours=2, minutes=30),
                    resolved_by=1,
                    resolved_at=datetime.utcnow() - timedelta(hours=1, minutes=45),
                    created_at=datetime.utcnow() - timedelta(hours=3)
                )
            ]
            db.add_all(alerts_data)
            db.commit()
            logger.info("Seeded Initial Operational Alerts")

        # 8. HISTORICAL TRAFFIC RECORDS (LAST 24 HOURS TIME-SERIES DATA)
        existing_records = db.query(TrafficRecord).count()
        if existing_records < 100:
            sensors = db.query(Sensor).all()
            now = datetime.utcnow()
            records_to_seed = []
            
            # Generate hourly aggregated slices for past 24 hours
            for hour_offset in range(24, 0, -1):
                record_time = now - timedelta(hours=hour_offset)
                hour_of_day = record_time.hour
                
                # Rush hour factor (8-10 AM and 17-20 PM)
                if (8 <= hour_of_day <= 10) or (17 <= hour_of_day <= 20):
                    peak_mult = random.uniform(1.4, 1.8)
                elif (0 <= hour_of_day <= 5):
                    peak_mult = random.uniform(0.15, 0.35)
                else:
                    peak_mult = random.uniform(0.7, 1.1)

                for sensor in sensors:
                    if sensor.status == "OFFLINE":
                        continue
                        
                    base_cap = sensor.location.capacity_vpm if sensor.location else 80
                    base_spd = sensor.location.speed_limit_kmh if sensor.location else 50
                    
                    veh_count = int(max(5, min(120, base_cap * peak_mult * random.uniform(0.6, 1.1))))
                    
                    # Speed inversely proportional to congestion
                    speed_factor = max(0.2, 1.0 - (veh_count / (base_cap * 1.3)))
                    avg_speed = round(max(8.0, base_spd * speed_factor * random.uniform(0.85, 1.05)), 1)
                    
                    density = round(min(100.0, (veh_count / base_cap) * 100.0 * random.uniform(0.9, 1.05)), 1)
                    
                    if density < 45 and avg_speed > 35:
                        cong_level = "LOW"
                    elif density < 75 and avg_speed > 22:
                        cong_level = "MODERATE"
                    elif density < 90 or avg_speed <= 22:
                        cong_level = "HIGH"
                    else:
                        cong_level = "CRITICAL"
                        
                    records_to_seed.append(
                        TrafficRecord(
                            sensor_id=sensor.sensor_id,
                            location_id=sensor.location_id,
                            timestamp=record_time + timedelta(minutes=random.randint(0, 50)),
                            vehicle_count=veh_count,
                            average_speed=avg_speed,
                            traffic_density=density,
                            congestion_level=cong_level,
                            weather_condition="CLEAR"
                        )
                    )

            db.add_all(records_to_seed)
            db.commit()
            logger.info(f"Seeded {len(records_to_seed)} Historical Traffic Time-Series Records")

    except Exception as e:
        db.rollback()
        logger.error(f"Database initialization error: {e}")
        raise
    finally:
        db.close()
