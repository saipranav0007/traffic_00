from datetime import datetime
from sqlalchemy import (
    Column, Integer, BigInteger, String, Text, DateTime, Date,
    Numeric, ForeignKey, Enum as SQLEnum, Index, UniqueConstraint
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class Role(Base):
    __tablename__ = "roles"

    role_id = Column(Integer, primary_key=True, autoincrement=True)
    role_name = Column(String(50), nullable=False, unique=True)
    description = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    users = relationship("User", back_populates="role")


class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, autoincrement=True)
    employee_id = Column(String(50), nullable=False, unique=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.role_id"), nullable=False)
    department = Column(String(100), nullable=False)
    status = Column(String(20), nullable=False, default="ACTIVE")  # ACTIVE, INACTIVE
    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    role = relationship("Role", back_populates="users")
    acknowledged_alerts = relationship("Alert", foreign_keys="[Alert.acknowledged_by]", back_populates="acknowledger")
    resolved_alerts = relationship("Alert", foreign_keys="[Alert.resolved_by]", back_populates="resolver")


class Location(Base):
    __tablename__ = "locations"

    location_id = Column(Integer, primary_key=True, autoincrement=True)
    location_code = Column(String(50), nullable=False, unique=True)
    location_name = Column(String(100), nullable=False)
    area = Column(String(100), nullable=False)
    latitude = Column(Numeric(10, 7), nullable=False)
    longitude = Column(Numeric(10, 7), nullable=False)
    capacity_vpm = Column(Integer, nullable=False, default=80)
    speed_limit_kmh = Column(Integer, nullable=False, default=50)
    status = Column(String(20), nullable=False, default="ACTIVE")  # ACTIVE, MAINTENANCE, INACTIVE
    created_at = Column(DateTime, default=datetime.utcnow)

    sensors = relationship("Sensor", back_populates="location")
    traffic_records = relationship("TrafficRecord", back_populates="location")
    alerts = relationship("Alert", back_populates="location")
    outgoing_corridors = relationship("JunctionCorridor", foreign_keys="[JunctionCorridor.source_location_id]", back_populates="source_location")
    incoming_corridors = relationship("JunctionCorridor", foreign_keys="[JunctionCorridor.target_location_id]", back_populates="target_location")


class JunctionCorridor(Base):
    __tablename__ = "junction_corridors"

    corridor_id = Column(Integer, primary_key=True, autoincrement=True)
    source_location_id = Column(Integer, ForeignKey("locations.location_id", ondelete="CASCADE"), nullable=False)
    target_location_id = Column(Integer, ForeignKey("locations.location_id", ondelete="CASCADE"), nullable=False)
    road_name = Column(String(100), nullable=False)
    distance_km = Column(Numeric(5, 2), nullable=False)
    lanes = Column(Integer, nullable=False, default=2)
    base_travel_time_sec = Column(Integer, nullable=False, default=120)
    created_at = Column(DateTime, default=datetime.utcnow)

    source_location = relationship("Location", foreign_keys=[source_location_id], back_populates="outgoing_corridors")
    target_location = relationship("Location", foreign_keys=[target_location_id], back_populates="incoming_corridors")

    __table_args__ = (UniqueConstraint("source_location_id", "target_location_id", name="uq_corridor"),)


class Sensor(Base):
    __tablename__ = "sensors"

    sensor_id = Column(Integer, primary_key=True, autoincrement=True)
    sensor_code = Column(String(50), nullable=False, unique=True, index=True)
    sensor_type = Column(String(50), nullable=False)  # Vehicle Counter, Speed Radar Sensor, Traffic Density Sensor, Smart ANPR Camera
    location_id = Column(Integer, ForeignKey("locations.location_id"), nullable=False)
    model = Column(String(100), nullable=False, default="TrafficSense-V400")
    status = Column(String(20), nullable=False, default="ONLINE")  # ONLINE, OFFLINE, WARNING, MAINTENANCE
    installed_at = Column(Date, nullable=False)
    last_communication = Column(DateTime, default=datetime.utcnow)
    battery_health = Column(Integer, default=100)
    firmware_version = Column(String(20), default="v2.4.1")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    location = relationship("Location", back_populates="sensors")
    traffic_records = relationship("TrafficRecord", back_populates="sensor", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="sensor")


class TrafficRecord(Base):
    __tablename__ = "traffic_records"

    record_id = Column(BigInteger, primary_key=True, autoincrement=True)
    sensor_id = Column(Integer, ForeignKey("sensors.sensor_id", ondelete="CASCADE"), nullable=False)
    location_id = Column(Integer, ForeignKey("locations.location_id", ondelete="CASCADE"), nullable=False)
    timestamp = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    vehicle_count = Column(Integer, nullable=False)
    average_speed = Column(Numeric(5, 2), nullable=False)
    traffic_density = Column(Numeric(5, 2), nullable=False)
    congestion_level = Column(String(20), nullable=False)  # LOW, MODERATE, HIGH, CRITICAL
    weather_condition = Column(String(50), default="CLEAR")

    sensor = relationship("Sensor", back_populates="traffic_records")
    location = relationship("Location", back_populates="traffic_records")

    __table_args__ = (
        Index("idx_records_location_time", "location_id", "timestamp"),
        Index("idx_records_sensor", "sensor_id"),
    )


class Alert(Base):
    __tablename__ = "alerts"

    alert_id = Column(Integer, primary_key=True, autoincrement=True)
    sensor_id = Column(Integer, ForeignKey("sensors.sensor_id", ondelete="SET NULL"), nullable=True)
    location_id = Column(Integer, ForeignKey("locations.location_id", ondelete="CASCADE"), nullable=False)
    alert_type = Column(String(60), nullable=False)
    severity = Column(String(20), nullable=False, default="WARNING")  # INFO, WARNING, CRITICAL
    message = Column(Text, nullable=False)
    status = Column(String(20), nullable=False, default="ACTIVE")  # ACTIVE, ACKNOWLEDGED, RESOLVED
    acknowledged_by = Column(Integer, ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)
    resolved_by = Column(Integer, ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    sensor = relationship("Sensor", back_populates="alerts")
    location = relationship("Location", back_populates="alerts")
    acknowledger = relationship("User", foreign_keys=[acknowledged_by], back_populates="acknowledged_alerts")
    resolver = relationship("User", foreign_keys=[resolved_by], back_populates="resolved_alerts")

    __table_args__ = (
        Index("idx_alerts_status", "status"),
    )


class SystemSetting(Base):
    __tablename__ = "system_settings"

    setting_key = Column(String(60), primary_key=True)
    setting_value = Column(String(255), nullable=False)
    category = Column(String(50), nullable=False, default="TRAFFIC")
    description = Column(String(255), nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
