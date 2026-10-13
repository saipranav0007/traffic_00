from datetime import datetime, date
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field

# ================= AUTH SCHEMAS =================
class LoginRequest(BaseModel):
    employee_id: str = Field(..., description="Official Officer / Employee ID e.g. ADM-001, TP-1042")
    password: str = Field(..., min_length=4, description="Officer password")

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"

class ForgotPasswordRequest(BaseModel):
    employee_id: str
    email: EmailStr

# ================= USER SCHEMAS =================
class RoleOut(BaseModel):
    role_id: int
    role_name: str
    description: str

    class Config:
        from_attributes = True

class UserBase(BaseModel):
    employee_id: str
    name: str
    email: EmailStr
    role_id: int
    department: str
    status: str = "ACTIVE"

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    role_id: Optional[int] = None
    department: Optional[str] = None
    status: Optional[str] = None
    password: Optional[str] = None

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str

class UserOut(BaseModel):
    user_id: int
    employee_id: str
    name: str
    email: str
    role_id: int
    department: str
    status: str
    last_login: Optional[datetime] = None
    created_at: datetime
    role: Optional[RoleOut] = None

    class Config:
        from_attributes = True

# ================= LOCATION SCHEMAS =================
class LocationBase(BaseModel):
    location_code: str
    location_name: str
    area: str
    latitude: float
    longitude: float
    capacity_vpm: int = 80
    speed_limit_kmh: int = 50
    status: str = "ACTIVE"

class LocationCreate(LocationBase):
    pass

class LocationOut(LocationBase):
    location_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class CorridorOut(BaseModel):
    corridor_id: int
    source_location_id: int
    target_location_id: int
    road_name: str
    distance_km: float
    lanes: int
    base_travel_time_sec: int
    source_name: Optional[str] = None
    target_name: Optional[str] = None

    class Config:
        from_attributes = True

# ================= SENSOR SCHEMAS =================
class SensorBase(BaseModel):
    sensor_code: str
    sensor_type: str
    location_id: int
    model: str = "TrafficSense-V400"
    status: str = "ONLINE"
    installed_at: date
    battery_health: int = 100
    firmware_version: str = "v2.4.1"

class SensorCreate(SensorBase):
    pass

class SensorUpdate(BaseModel):
    sensor_type: Optional[str] = None
    location_id: Optional[int] = None
    model: Optional[str] = None
    status: Optional[str] = None
    battery_health: Optional[int] = None
    firmware_version: Optional[str] = None

class SensorOut(SensorBase):
    sensor_id: int
    last_communication: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    location: Optional[LocationOut] = None
    current_reading: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

# ================= TRAFFIC RECORD SCHEMAS =================
class TrafficRecordBase(BaseModel):
    sensor_id: int
    location_id: int
    vehicle_count: int
    average_speed: float
    traffic_density: float
    congestion_level: str
    weather_condition: str = "CLEAR"

class TrafficRecordCreate(TrafficRecordBase):
    timestamp: Optional[datetime] = None

class TrafficRecordOut(TrafficRecordBase):
    record_id: int
    timestamp: datetime
    sensor_code: Optional[str] = None
    location_name: Optional[str] = None
    location_area: Optional[str] = None

    class Config:
        from_attributes = True

# ================= ALERT SCHEMAS =================
class AlertBase(BaseModel):
    sensor_id: Optional[int] = None
    location_id: int
    alert_type: str
    severity: str
    message: str
    status: str = "ACTIVE"

class AlertCreate(AlertBase):
    pass

class AlertUpdate(BaseModel):
    status: str

class AlertOut(AlertBase):
    alert_id: int
    created_at: datetime
    acknowledged_by: Optional[int] = None
    acknowledged_at: Optional[datetime] = None
    resolved_by: Optional[int] = None
    resolved_at: Optional[datetime] = None
    location_name: Optional[str] = None
    sensor_code: Optional[str] = None
    acknowledger_name: Optional[str] = None
    resolver_name: Optional[str] = None

    class Config:
        from_attributes = True

# ================= DASHBOARD & ANALYTICS SCHEMAS =================
class DashboardSummary(BaseModel):
    total_sensors: int
    active_sensors: int
    offline_sensors: int
    warning_sensors: int
    vehicles_today: int
    congested_locations: int
    active_alerts: int
    average_city_speed: float
    system_status: str

class LiveJunctionTraffic(BaseModel):
    location_id: int
    location_code: str
    location_name: str
    area: str
    latitude: float
    longitude: float
    vehicle_count: int
    average_speed: float
    traffic_density: float
    congestion_level: str
    sensor_status: str
    active_sensors_count: int
    last_updated: datetime
    speed_limit: int
    capacity_vpm: int

# ================= SYSTEM SETTINGS SCHEMAS =================
class SystemSettingOut(BaseModel):
    setting_key: str
    setting_value: str
    category: str
    description: str
    updated_at: datetime

    class Config:
        from_attributes = True

class SystemSettingUpdate(BaseModel):
    setting_value: str

# ================= ADSA / DMGT GRAPH ROUTING SCHEMAS =================
class RouteRequest(BaseModel):
    source_location_id: int
    target_location_id: int
    criterion: str = "LEAST_CONGESTED" # SHORTEST_DISTANCE, FASTEST_TIME, LEAST_CONGESTED

class RouteStep(BaseModel):
    step_number: int
    from_location: str
    to_location: str
    road_name: str
    distance_km: float
    estimated_time_min: float
    congestion_level: str
    speed_kmh: float

class RouteResponse(BaseModel):
    path: List[int]
    path_names: List[str]
    total_distance_km: float
    total_estimated_time_min: float
    average_speed_kmh: float
    path_congestion_summary: str
    steps: List[RouteStep]
