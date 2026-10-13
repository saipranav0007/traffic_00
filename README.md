# 🚦 Smart City Traffic Sensor System (`traffic_00`)

> **Traffic Event & Sensor Telemetry Management System**  
> An intelligent full-stack system that tracks, logs, and visualizes all traffic events and real-time telemetry across located sensors. Engineered for Municipal Traffic Police Departments and Smart Mobility Command Centers.

---

## 📋 Table of Contents
1. [System Architecture & Data Flow](#-system-architecture--data-flow)
2. [Key Features & Modules](#-key-features--modules)
3. [Academic Subject Mapping (DBMS, ADSA, DMGT, Python)](#-academic-subject-mapping)
4. [Role-Based Access Control (RBAC)](#-role-based-access-control-rbac)
5. [Mathematical Congestion Classification Model](#-mathematical-congestion-classification-model)
6. [Pre-Seeded Demo Credentials](#-pre-seeded-demo-credentials)
7. [Technology Stack](#-technology-stack)
8. [Setup and Execution Instructions](#-setup-and-execution-instructions)
9. [REST API Documentation](#-rest-api-documentation)

---

## 🏛 System Architecture & Data Flow

```
Hardware Traffic Sensors / Multi-Threaded Simulation Engine
                        ↓
            FastAPI Backend Ingestion Pipeline
                        ↓
    Mathematical Congestion Indexing & Anomaly Rules
                        ↓
             MySQL 8.0 Relational Database
                        ↓
         Protected RESTful APIs (JWT + RBAC)
                        ↓
       React.js Command Center Frontend (Tailored Dark UI)
  [Dashboard • Live Traffic • Sensors • Analytics • GIS Map • Records • Alerts • Admin]
```

---

## 🌟 Key Features & Modules

### 1. 🛡️ Official Restricted Authentication
- **No Public Registration**: Accounts are exclusively provisioned by System Administrators.
- **Login Identifier**: Official Employee / Officer ID (e.g., `ADM-001`, `TP-1042`, `TSO-0187`).
- **Security**: Passwords hashed using standard `bcrypt` ($2b$12$) with cryptographically secure salts.

### 2. 📊 Executive Command Dashboard
- **5 High-Level KPIs**: Total Sensors, Active Sensors, Vehicles Detected Today, Congested Bottlenecks, Active Alerts.
- **12-Hour Traffic Dynamics**: Interactive volume curves vs. speed trends.
- **Sensor Grid Health Breakdown**: Real-time doughnut chart of operational hardware.
- **Live Junction Telemetry Table**: Real-time traffic indicators with direct incident links.

### 3. 🚦 Live Traffic Monitoring
- Real-time updates every 5-6 seconds across all 8 metropolitan junctions.
- View modes: **Tactical Status Cards** or **Dense High-Contrast Table**.
- Density percentage gauges and dynamic congestion badges.

### 4. 📡 Hardware Sensor Management
- Full lifecycle monitoring of multi-modal sensors:
  - *Vehicle Counters (Inductive Loop / Infrared)*
  - *Speed Radar Detectors*
  - *Optical Traffic Density Sensors*
  - *Smart ANPR Cameras*
- Admin controls: Add sensor, configure hardware thresholds, toggle offline/maintenance, ping telemetry.

### 5. 📈 Multi-Variate Traffic Analytics
- Chart.js powered visualization of stored historical records:
  - 24-Hour Diurnal volume curves.
  - Congestion classification share.
  - Junction volume rankings.
  - 7-Day comparative mobility trends.
- Automated KPI computation: Peak traffic window, highest traffic corridor, city-wide average velocity.

### 6. 🗺️ Interactive GIS Map & ADSA Graph Routing
- **GIS Leaflet Map**: Custom dark command center theme with color-coded junction markers:
  - 🟢 **Emerald**: Low / Normal Flow
  - 🟡 **Amber**: Moderate Density
  - 🟠 **Orange**: High Congestion
  - 🔴 **Crimson**: Critical Gridlock
  - ⚪ **Slate**: Sensor Offline / Signal Lost
- **Graph Network Analysis (ADSA / DMGT)**:
  - Models junctions as Graph Vertices and arterial roads as Directed Edges with dynamic congestion weights.
  - Computes **Dijkstra's Algorithm** for Shortest Physical Path, Fastest Route, and Least-Congested Route.

### 7. 🗄️ Historical Database Records Archive
- Query thousands of historical time-series telemetry records.
- Multi-parameter filtering: Date/time range, junction, sensor ID, congestion classification, and free-text search.
- Server-side pagination and one-click **CSV Dataset Export**.

### 8. 🚨 Incident & Alert Dispatch Workflow
- Automated rule-based generation when congestion exceeds thresholds or sensors drop offline.
- Status workflow: `ACTIVE` → `ACKNOWLEDGED` → `RESOLVED` with officer tracking.
- Manual Officer Emergency Dispatch Broadcast.

### 9. 👥 Authorized Personnel Management (Admin Only)
- Admin control over officer accounts, role assignments, account status toggles (`ACTIVE` / `INACTIVE`), and password resets.

---

## 🎓 Academic Subject Mapping

| Subject | Implementation Details |
| :--- | :--- |
| **DBMS (Database Management Systems)** | Normalized MySQL 8.0 schema (`schema.sql`), primary keys, foreign keys with cascade constraints, compound B-tree indexes on `(location_id, timestamp)`, aggregate queries (`SUM`, `AVG`, `GROUP BY hour/junction`). |
| **ADSA (Advanced Data Structures & Algorithms)** | Graph representation of road networks ($G = (V, E)$). Priority-Queue-driven **Dijkstra's Shortest Path Algorithm** with multi-variable dynamic weight penalties for traffic congestion and travel time. |
| **DMGT (Discrete Mathematics & Graph Theory)** | Modeling urban corridors as weighted directed graphs. Vertex degree analysis, connectivity, and shortest path optimization. |
| **Python & Modern Web Engineering** | Modular FastAPI architecture, asynchronous background simulation task loops, Pydantic v2 data validation, SQLAlchemy ORM, and React 18 frontend with Chart.js and Leaflet. |

---

## 🎚 Mathematical Congestion Classification Model

The system utilizes a weighted composite Congestion Index ($CI$):

$$CI = w_1 \cdot \left(\frac{V}{C}\right) + w_2 \cdot \left(1 - \frac{S}{S_{\text{limit}}}\right)$$

Where:
- $V$ = Vehicles detected per minute
- $C$ = Designated junction capacity (vpm)
- $S$ = Observed average vehicle velocity (km/h)
- $S_{\text{limit}}$ = Speed limit for the corridor
- $w_1 = 0.60, w_2 = 0.40$ (Weights for volume ratio vs speed deficit)

### Classification Rules:
- **LOW**: $V \le 40$ vpm and $CI < 0.45$
- **MODERATE**: $40 < V \le 70$ vpm or $0.45 \le CI < 0.85$
- **HIGH**: $V > 70$ vpm or $CI \ge 0.85$
- **CRITICAL**: $S \le 18$ km/h and $V \ge 70$ vpm

---

## 🔑 Pre-Seeded Demo Credentials

| Role | Officer ID | Name | Password | Access Level |
| :--- | :--- | :--- | :--- | :--- |
| **ADMIN** | `ADM-001` | Chief Inspector Rajesh Verma | `Admin@2026` | Full system control, sensor management, employee provisioning, thresholds |
| **TRAFFIC OFFICER** | `TP-1042` | Officer Meera Nambiar | `Officer@2026` | Live traffic monitoring, GIS map, alerts dispatch, records, analytics |
| **TRAFFIC OPERATOR** | `TSO-0187` | Operator Arun Kumar | `Operator@2026` | Live sensor monitoring, alert acknowledgement, records lookup |

*(Quick-switch demo buttons are also provided directly on the Login screen for testing!)*

---

## 💻 Technology Stack

- **Backend**: Python 3.12, FastAPI, SQLAlchemy 2.0, PyMySQL, PyJWT, Bcrypt, Pydantic v2
- **Database**: MySQL Server 8.0 (with automatic fallback to SQLite)
- **Frontend**: React 18, Vite 6, Chart.js, React-Chartjs-2, Leaflet, React-Leaflet, Lucide Icons, Custom Command Design System (Vanilla CSS)

---

## 🚀 Setup and Execution Instructions

### 1. Database Setup
Ensure MySQL is running on localhost (default port 3306). The schema and initial seed data will automatically be populated upon backend startup.
Alternatively, load the SQL files directly:
```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```

### 2. Backend Setup
```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation will be available at: `http://127.0.0.1:8000/docs`

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open `http://127.0.0.1:5173` in your browser.

---

## 📡 REST API Documentation

- `POST /api/auth/login` - Officer ID and password authentication
- `GET /api/auth/me` - Retrieve authenticated officer session
- `GET /api/dashboard/summary` - Top KPI statistics
- `GET /api/dashboard/hourly-trend` - 12-hour volume and velocity trends
- `GET /api/traffic/live` - Live multi-sensor junction feeds
- `GET /api/traffic/records` - Historical database records with search/filters
- `GET /api/traffic/export/csv` - Export filtered traffic records to CSV
- `GET /api/sensors` - Sensor grid hardware list with live readings
- `POST /api/sensors` - Deploy new sensor (Admin only)
- `PUT /api/sensors/{id}` - Update sensor configuration (Admin only)
- `GET /api/analytics/overview` - Multi-variate 24h & 7-day analytics
- `GET /api/locations/live-map` - GIS vertices and corridor network
- `POST /api/routing/calculate-route` - ADSA Dijkstra shortest & least-congested route
- `GET /api/alerts` - Incident alert feeds
- `POST /api/alerts/{id}/acknowledge` - Acknowledge alert
- `POST /api/alerts/{id}/resolve` - Mark incident as resolved
- `POST /api/alerts/manual` - Broadcast manual officer dispatch alert
- `GET /api/employees` - List authorized officers (Admin only)
- `POST /api/employees` - Provision new officer account (Admin only)
- `POST /api/settings/inject-incident` - Inject simulated gridlock for demo testing
