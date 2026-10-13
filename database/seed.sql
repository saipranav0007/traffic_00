-- ==========================================================
-- SMART CITY TRAFFIC SENSOR SYSTEM
-- Seed Data (Roles, Demo Users, Junctions, Corridors, Sensors, Alerts, Config)
-- ==========================================================

USE smart_traffic_db;

-- 1. INSERT ROLES
INSERT INTO roles (role_id, role_name, description) VALUES
(1, 'ADMIN', 'System Administrator with full access to all modules, users, sensors, and configuration.'),
(2, 'TRAFFIC_OFFICER', 'Senior Traffic Officer with authorization to monitor live traffic, alerts, records, and analytics.'),
(3, 'TRAFFIC_OPERATOR', 'Traffic Control Room Operator with operational monitoring and alert response permissions.')
ON DUPLICATE KEY UPDATE description=VALUES(description);

-- 2. INSERT AUTHORIZED EMPLOYEES (NO PUBLIC REGISTRATION)
-- Password for all demo accounts: Admin@2026, Officer@2026, Operator@2026
-- Hashed using bcrypt ($2b$12$)
INSERT INTO users (user_id, employee_id, name, email, password_hash, role_id, department, status) VALUES
(1, 'ADM-001', 'Chief Inspector Rajesh Verma', 'rajesh.verma@traffic.gov.in', '$2b$12$e68Y96zY8b86X3sXv9g4x.YF0q2lK8g8pZtGZcRk8zH6q2y3rJ2rG', 1, 'Central Traffic Command & Control', 'ACTIVE'),
(2, 'TP-1042', 'Officer Meera Nambiar', 'meera.nambiar@traffic.gov.in', '$2b$12$e68Y96zY8b86X3sXv9g4x.YF0q2lK8g8pZtGZcRk8zH6q2y3rJ2rG', 2, 'Urban Traffic Enforcement Division', 'ACTIVE'),
(3, 'TSO-0187', 'Operator Arun Kumar', 'arun.kumar@traffic.gov.in', '$2b$12$e68Y96zY8b86X3sXv9g4x.YF0q2lK8g8pZtGZcRk8zH6q2y3rJ2rG', 3, 'Smart Mobility Monitoring Center', 'ACTIVE'),
(4, 'TP-2055', 'Officer Vikram Rathore', 'vikram.rathore@traffic.gov.in', '$2b$12$e68Y96zY8b86X3sXv9g4x.YF0q2lK8g8pZtGZcRk8zH6q2y3rJ2rG', 2, 'North Corridor Patrol Unit', 'ACTIVE'),
(5, 'TSO-0219', 'Operator Priya Sundaram', 'priya.sundaram@traffic.gov.in', '$2b$12$e68Y96zY8b86X3sXv9g4x.YF0q2lK8g8pZtGZcRk8zH6q2y3rJ2rG', 3, 'Smart Mobility Monitoring Center', 'INACTIVE')
ON DUPLICATE KEY UPDATE name=VALUES(name), department=VALUES(department);

-- 3. INSERT LOCATIONS / JUNCTIONS (VERTICES IN GRAPH)
INSERT INTO locations (location_id, location_code, location_name, area, latitude, longitude, capacity_vpm, speed_limit_kmh, status) VALUES
(1, 'JNC-CENTRAL-01', 'Central City Square Junction', 'Downtown District', 12.9716, 77.5946, 90, 50, 'ACTIVE'),
(2, 'JNC-NORTH-02', 'North Boulevard Expressway Cross', 'North Sector', 12.9850, 77.6050, 85, 60, 'ACTIVE'),
(3, 'JNC-TECH-03', 'Silicon Tech Park Flyover', 'Tech Corridor', 12.9352, 77.6946, 100, 60, 'ACTIVE'),
(4, 'JNC-SOUTH-04', 'South Ring Road Interchange', 'South Suburb', 12.9100, 77.5850, 80, 50, 'ACTIVE'),
(5, 'JNC-HARBOUR-05', 'Harbour Port Arterial Road', 'Port Zone', 12.9550, 77.5400, 75, 45, 'ACTIVE'),
(6, 'JNC-METRO-06', 'Metro Terminal Transit Cross', 'West Avenue', 12.9920, 77.5530, 80, 40, 'ACTIVE'),
(7, 'JNC-AIRPORT-07', 'Airport Gateway Corridor', 'Airport Link', 13.0450, 77.6320, 110, 70, 'ACTIVE'),
(8, 'JNC-OLDTOWN-08', 'Heritage Old Market Gate', 'Old City District', 12.9620, 77.5750, 65, 30, 'ACTIVE')
ON DUPLICATE KEY UPDATE location_name=VALUES(location_name);

-- 4. INSERT JUNCTION CORRIDORS (EDGES FOR GRAPH NETWORK ADSA / DMGT)
INSERT INTO junction_corridors (corridor_id, source_location_id, target_location_id, road_name, distance_km, lanes, base_travel_time_sec) VALUES
(1, 1, 2, 'North Central Arterial', 2.1, 3, 150),
(2, 2, 1, 'North Central Arterial', 2.1, 3, 150),
(3, 1, 3, 'Silicon Expressway Link', 8.4, 4, 480),
(4, 3, 1, 'Silicon Expressway Link', 8.4, 4, 480),
(5, 1, 4, 'South Spine Corridor', 6.2, 3, 360),
(6, 4, 1, 'South Spine Corridor', 6.2, 3, 360),
(7, 1, 8, 'Heritage Bypass Road', 1.8, 2, 180),
(8, 8, 1, 'Heritage Bypass Road', 1.8, 2, 180),
(9, 2, 7, 'Airport Highspeed Corridor', 9.5, 4, 520),
(10, 7, 2, 'Airport Highspeed Corridor', 9.5, 4, 520),
(11, 4, 5, 'Port-Ring Connection', 5.3, 3, 300),
(12, 5, 4, 'Port-Ring Connection', 5.3, 3, 300),
(13, 8, 6, 'West City Cross Link', 3.7, 2, 240),
(14, 6, 8, 'West City Cross Link', 3.7, 2, 240),
(15, 6, 2, 'Metro-North Express Way', 4.8, 3, 290),
(16, 2, 6, 'Metro-North Express Way', 4.8, 3, 290)
ON DUPLICATE KEY UPDATE road_name=VALUES(road_name);

-- 5. INSERT SENSORS (14 SENSORS ACROSS JUNCTIONS)
INSERT INTO sensors (sensor_id, sensor_code, sensor_type, location_id, model, status, installed_at, battery_health, firmware_version) VALUES
(1, 'SNS-CNT-101', 'Vehicle Counter', 1, 'TrafficSense-VC40', 'ONLINE', '2025-01-15', 98, 'v2.4.1'),
(2, 'SNS-SPD-102', 'Speed Radar Sensor', 1, 'RadarPro-S90', 'ONLINE', '2025-01-15', 95, 'v2.4.1'),
(3, 'SNS-DEN-103', 'Traffic Density Sensor', 1, 'OptiFlow-D300', 'ONLINE', '2025-02-10', 97, 'v2.4.1'),
(4, 'SNS-CAM-104', 'Smart ANPR Camera', 2, 'VisionEye-ANPR8K', 'ONLINE', '2025-02-20', 99, 'v3.1.0'),
(5, 'SNS-SPD-105', 'Speed Radar Sensor', 2, 'RadarPro-S90', 'ONLINE', '2025-02-20', 92, 'v2.4.1'),
(6, 'SNS-DEN-106', 'Traffic Density Sensor', 3, 'OptiFlow-D300', 'ONLINE', '2025-03-01', 94, 'v2.4.1'),
(7, 'SNS-CNT-107', 'Vehicle Counter', 3, 'TrafficSense-VC40', 'ONLINE', '2025-03-01', 96, 'v2.4.1'),
(8, 'SNS-SPD-108', 'Speed Radar Sensor', 4, 'RadarPro-S90', 'ONLINE', '2025-03-15', 88, 'v2.4.0'),
(9, 'SNS-DEN-109', 'Traffic Density Sensor', 4, 'OptiFlow-D300', 'ONLINE', '2025-03-15', 91, 'v2.4.1'),
(10, 'SNS-CAM-110', 'Smart ANPR Camera', 5, 'VisionEye-ANPR8K', 'WARNING', '2025-04-05', 73, 'v3.0.2'),
(11, 'SNS-CNT-111', 'Vehicle Counter', 6, 'TrafficSense-VC40', 'ONLINE', '2025-04-10', 96, 'v2.4.1'),
(12, 'SNS-DEN-112', 'Traffic Density Sensor', 7, 'OptiFlow-D300', 'ONLINE', '2025-04-18', 100, 'v3.1.0'),
(13, 'SNS-SPD-113', 'Speed Radar Sensor', 7, 'RadarPro-S90', 'ONLINE', '2025-04-18', 97, 'v3.1.0'),
(14, 'SNS-CNT-114', 'Vehicle Counter', 8, 'TrafficSense-VC40', 'OFFLINE', '2024-11-12', 45, 'v2.1.0')
ON DUPLICATE KEY UPDATE sensor_type=VALUES(sensor_type);

-- 6. INSERT ALERTS
INSERT INTO alerts (alert_id, sensor_id, location_id, alert_type, severity, message, status, created_at) VALUES
(1, 6, 3, 'HIGH CONGESTION', 'CRITICAL', 'Severe traffic bottleneck detected at Silicon Tech Park Flyover. Vehicle density exceeds 88% with average speed down to 14 km/h.', 'ACTIVE', NOW() - INTERVAL 12 MINUTE),
(2, 14, 8, 'SENSOR OFFLINE', 'WARNING', 'Sensor SNS-CNT-114 at Heritage Old Market Gate has stopped responding for > 30 minutes. Telemetry lost.', 'ACTIVE', NOW() - INTERVAL 35 MINUTE),
(3, 10, 5, 'UNUSUAL TRAFFIC SPIKE', 'WARNING', 'Abnormal 140% surge in heavy freight vehicles detected at Harbour Port Arterial Road.', 'ACKNOWLEDGED', NOW() - INTERVAL 1 HOUR),
(4, 2, 1, 'VERY LOW SPEED', 'INFO', 'Transient slow-moving queue due to pedestrian phase at Central City Square Junction.', 'RESOLVED', NOW() - INTERVAL 3 HOUR);

-- 7. INSERT SYSTEM SETTINGS
INSERT INTO system_settings (setting_key, setting_value, category, description) VALUES
('CONGESTION_LOW_THRESHOLD', '40', 'THRESHOLDS', 'Max vehicles/min threshold for LOW congestion classification'),
('CONGESTION_MEDIUM_THRESHOLD', '70', 'THRESHOLDS', 'Max vehicles/min threshold for MEDIUM/MODERATE congestion'),
('CONGESTION_CRITICAL_SPEED_KMH', '18', 'THRESHOLDS', 'Speed in km/h below which triggers CRITICAL congestion alert'),
('ALERT_AUTO_GENERATE', 'true', 'AUTOMATION', 'Automatically create alert when critical congestion or sensor offline is detected'),
('SIMULATION_INTERVAL_SEC', '5', 'SIMULATOR', 'Interval between background sensor data broadcasts (seconds)'),
('SIMULATION_PEAK_HOUR_OVERRIDE', 'auto', 'SIMULATOR', 'Auto follows real-time clock, or manual forced morning/evening peak mode'),
('OFFLINE_TIMEOUT_MINUTES', '10', 'SENSORS', 'Threshold minutes without ping before flagging sensor as OFFLINE')
ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value);
