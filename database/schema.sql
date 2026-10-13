-- ==========================================================
-- SMART CITY TRAFFIC SENSOR SYSTEM
-- Database Schema Definition (MySQL 8.0+ Compatible)
-- Department of Traffic Police & Urban Mobility Control
-- ==========================================================

CREATE DATABASE IF NOT EXISTS smart_traffic_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE smart_traffic_db;

-- 1. ROLES TABLE
CREATE TABLE IF NOT EXISTS roles (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. USERS (AUTHORIZED EMPLOYEES ONLY - NO PUBLIC REGISTRATION)
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    department VARCHAR(100) NOT NULL,
    status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    last_login DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles (role_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 3. LOCATIONS / JUNCTIONS (VERTICES IN TRAFFIC GRAPH)
CREATE TABLE IF NOT EXISTS locations (
    location_id INT AUTO_INCREMENT PRIMARY KEY,
    location_code VARCHAR(50) NOT NULL UNIQUE,
    location_name VARCHAR(100) NOT NULL,
    area VARCHAR(100) NOT NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    capacity_vpm INT NOT NULL DEFAULT 80 COMMENT 'Max vehicle capacity per minute',
    speed_limit_kmh INT NOT NULL DEFAULT 50 COMMENT 'Designated speed limit',
    status ENUM('ACTIVE', 'MAINTENANCE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 4. JUNCTION CORRIDORS / ROADS (EDGES IN TRAFFIC GRAPH - ADSA / DMGT)
CREATE TABLE IF NOT EXISTS junction_corridors (
    corridor_id INT AUTO_INCREMENT PRIMARY KEY,
    source_location_id INT NOT NULL,
    target_location_id INT NOT NULL,
    road_name VARCHAR(100) NOT NULL,
    distance_km DECIMAL(5, 2) NOT NULL,
    lanes INT NOT NULL DEFAULT 2,
    base_travel_time_sec INT NOT NULL DEFAULT 120,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_corridor_source FOREIGN KEY (source_location_id) REFERENCES locations (location_id) ON DELETE CASCADE,
    CONSTRAINT fk_corridor_target FOREIGN KEY (target_location_id) REFERENCES locations (location_id) ON DELETE CASCADE,
    CONSTRAINT uq_corridor UNIQUE (source_location_id, target_location_id)
) ENGINE=InnoDB;

-- 5. SENSORS TABLE
CREATE TABLE IF NOT EXISTS sensors (
    sensor_id INT AUTO_INCREMENT PRIMARY KEY,
    sensor_code VARCHAR(50) NOT NULL UNIQUE,
    sensor_type ENUM('Vehicle Counter', 'Speed Radar Sensor', 'Traffic Density Sensor', 'Smart ANPR Camera') NOT NULL,
    location_id INT NOT NULL,
    model VARCHAR(100) NOT NULL DEFAULT 'TrafficSense-V400',
    status ENUM('ONLINE', 'OFFLINE', 'WARNING', 'MAINTENANCE') NOT NULL DEFAULT 'ONLINE',
    installed_at DATE NOT NULL,
    last_communication DATETIME DEFAULT CURRENT_TIMESTAMP,
    battery_health INT DEFAULT 100 COMMENT 'Percentage 0-100',
    firmware_version VARCHAR(20) DEFAULT 'v2.4.1',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_sensors_location FOREIGN KEY (location_id) REFERENCES locations (location_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 6. TRAFFIC RECORDS (TIME-SERIES SENSOR READINGS)
CREATE TABLE IF NOT EXISTS traffic_records (
    record_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    sensor_id INT NOT NULL,
    location_id INT NOT NULL,
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    vehicle_count INT NOT NULL COMMENT 'Vehicles detected in measurement window',
    average_speed DECIMAL(5, 2) NOT NULL COMMENT 'Average speed in km/h',
    traffic_density DECIMAL(5, 2) NOT NULL COMMENT 'Density index 0-100 percentage',
    congestion_level ENUM('LOW', 'MODERATE', 'HIGH', 'CRITICAL') NOT NULL,
    weather_condition VARCHAR(50) DEFAULT 'CLEAR',
    CONSTRAINT fk_records_sensor FOREIGN KEY (sensor_id) REFERENCES sensors (sensor_id) ON DELETE CASCADE,
    CONSTRAINT fk_records_location FOREIGN KEY (location_id) REFERENCES locations (location_id) ON DELETE CASCADE,
    INDEX idx_records_timestamp (timestamp),
    INDEX idx_records_location_time (location_id, timestamp),
    INDEX idx_records_sensor (sensor_id)
) ENGINE=InnoDB;

-- 7. ALERTS TABLE
CREATE TABLE IF NOT EXISTS alerts (
    alert_id INT AUTO_INCREMENT PRIMARY KEY,
    sensor_id INT NULL,
    location_id INT NOT NULL,
    alert_type VARCHAR(60) NOT NULL,
    severity ENUM('INFO', 'WARNING', 'CRITICAL') NOT NULL DEFAULT 'WARNING',
    message TEXT NOT NULL,
    status ENUM('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED') NOT NULL DEFAULT 'ACTIVE',
    acknowledged_by INT NULL,
    acknowledged_at DATETIME NULL,
    resolved_by INT NULL,
    resolved_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_alerts_sensor FOREIGN KEY (sensor_id) REFERENCES sensors (sensor_id) ON DELETE SET NULL,
    CONSTRAINT fk_alerts_location FOREIGN KEY (location_id) REFERENCES locations (location_id) ON DELETE CASCADE,
    CONSTRAINT fk_alerts_ack_user FOREIGN KEY (acknowledged_by) REFERENCES users (user_id) ON DELETE SET NULL,
    CONSTRAINT fk_alerts_res_user FOREIGN KEY (resolved_by) REFERENCES users (user_id) ON DELETE SET NULL,
    INDEX idx_alerts_status (status),
    INDEX idx_alerts_created (created_at)
) ENGINE=InnoDB;

-- 8. SYSTEM CONFIGURATION & THRESHOLDS TABLE
CREATE TABLE IF NOT EXISTS system_settings (
    setting_key VARCHAR(60) PRIMARY KEY,
    setting_value VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'TRAFFIC',
    description VARCHAR(255) NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;
