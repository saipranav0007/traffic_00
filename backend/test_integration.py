import requests
import json
import sys

BASE_URL = "http://127.0.0.1:8000/api"

def run_tests():
    print("=" * 60)
    print("SMART CITY TRAFFIC SENSOR SYSTEM - AUTOMATED INTEGRATION TEST")
    print("=" * 60)

    # 1. TEST LOGIN (ADMIN)
    print("\n[1] Testing Authentication: Admin Login (ADM-001)...")
    res = requests.post(f"{BASE_URL}/auth/login", json={"employee_id": "ADM-001", "password": "Admin@2026"})
    assert res.status_code == 200, f"Login failed: {res.text}"
    admin_token = res.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print(f"-> Logged in successfully. Officer: {res.json()['user']['name']}, Role: {res.json()['user']['role']['role_name']}")

    # 2. TEST INVALID LOGIN (Security Check)
    print("\n[2] Testing Security: Invalid Credentials Check...")
    bad_res = requests.post(f"{BASE_URL}/auth/login", json={"employee_id": "ADM-001", "password": "WrongPassword"})
    assert bad_res.status_code == 401, "Should reject wrong password"
    print(f"-> Correctly rejected with: '{bad_res.json()['detail']}'")

    # 3. TEST DASHBOARD SUMMARY
    print("\n[3] Testing Dashboard Summary API...")
    dash_res = requests.get(f"{BASE_URL}/dashboard/summary", headers=admin_headers)
    assert dash_res.status_code == 200, f"Dashboard failed: {dash_res.text}"
    d = dash_res.json()
    print(f"-> Total Sensors: {d['total_sensors']}, Active: {d['active_sensors']}, Vehicles Today: {d['vehicles_today']}, Congested: {d['congested_locations']}, Alerts: {d['active_alerts']}")

    # 4. TEST LIVE TRAFFIC
    print("\n[4] Testing Live Traffic API...")
    live_res = requests.get(f"{BASE_URL}/traffic/live", headers=admin_headers)
    assert live_res.status_code == 200
    live_data = live_res.json()
    print(f"-> Live Junctions Monitored: {len(live_data)}")
    for j in live_data[:3]:
        print(f"   * {j['location_name']}: {j['vehicle_count']} veh/min, {j['average_speed']} km/h, Level: {j['congestion_level']}, Sensor: {j['sensor_status']}")

    # 5. TEST SENSORS LIST & DEPLOYMENT
    print("\n[5] Testing Sensor Telemetry & Deployment...")
    sensors_res = requests.get(f"{BASE_URL}/sensors", headers=admin_headers)
    assert sensors_res.status_code == 200
    sensors_list = sensors_res.json()
    print(f"-> Active Sensor Nodes in Grid: {len(sensors_list)}")

    # Deploy test sensor
    test_code = "SNS-TEST-999"
    add_res = requests.post(f"{BASE_URL}/sensors", headers=admin_headers, json={
        "sensor_code": test_code,
        "sensor_type": "Speed Radar Sensor",
        "location_id": 1,
        "model": "TestRadar-V1",
        "status": "ONLINE",
        "installed_at": "2026-09-30",
        "battery_health": 100,
        "firmware_version": "v2.5.0"
    })
    assert add_res.status_code == 201 or "already exists" in add_res.text
    print(f"-> Sensor {test_code} deployed successfully")

    # 6. TEST ANALYTICS OVERVIEW
    print("\n[6] Testing Multi-Variate Analytics Engine...")
    ana_res = requests.get(f"{BASE_URL}/analytics/overview", headers=admin_headers)
    assert ana_res.status_code == 200
    ana_data = ana_res.json()
    print(f"-> Peak Traffic Time: {ana_data['kpis']['peak_traffic_time']}")
    print(f"-> Highest Traffic Location: {ana_data['kpis']['highest_traffic_location']}")
    print(f"-> Average Speed: {ana_data['kpis']['average_speed_kmh']} km/h")
    print(f"-> Congestion Events Logged: {ana_data['kpis']['congestion_events_count']}")

    # 7. TEST ADSA / DMGT GRAPH ROUTING (Dijkstra Algorithm)
    print("\n[7] Testing ADSA / DMGT Graph Routing (Dijkstra Shortest & Least Congested Path)...")
    route_res = requests.post(f"{BASE_URL}/routing/calculate-route", headers=admin_headers, json={
        "source_location_id": 1,
        "target_location_id": 7,
        "criterion": "LEAST_CONGESTED"
    })
    assert route_res.status_code == 200, f"Routing failed: {route_res.text}"
    r_data = route_res.json()
    print(f"-> Optimal Path: {' -> '.join(r_data['path_names'])}")
    print(f"-> Total Distance: {r_data['total_distance_km']} km, Est Time: {r_data['total_estimated_time_min']} mins, Avg Speed: {r_data['average_speed_kmh']} km/h")

    # 8. TEST HISTORICAL DATABASE RECORDS
    print("\n[8] Testing Historical Database Records & Pagination...")
    rec_res = requests.get(f"{BASE_URL}/traffic/records?page=1&limit=10", headers=admin_headers)
    assert rec_res.status_code == 200
    rec_data = rec_res.json()
    print(f"-> Total Historical Records Archived: {rec_data['total']}, Page 1 of {rec_data['total_pages']}")

    # 9. TEST ALERTS WORKFLOW
    print("\n[9] Testing Alerts & Incident Dispatch Workflow...")
    alert_res = requests.get(f"{BASE_URL}/alerts", headers=admin_headers)
    assert alert_res.status_code == 200
    alerts = alert_res.json()
    print(f"-> Alerts in System: {len(alerts)}")
    if alerts:
        first_alert = alerts[0]
        ack_res = requests.post(f"{BASE_URL}/alerts/{first_alert['alert_id']}/acknowledge", headers=admin_headers)
        print(f"-> Alert #{first_alert['alert_id']} Acknowledged: {ack_res.json()['status']}")

    # 10. TEST EMPLOYEE MANAGEMENT (ADMIN ONLY)
    print("\n[10] Testing Admin Employee Provisioning...")
    emp_res = requests.get(f"{BASE_URL}/employees", headers=admin_headers)
    assert emp_res.status_code == 200
    print(f"-> Total Authorized Officers: {len(emp_res.json())}")

    # 11. TEST NON-ADMIN RBAC RESTRICTION
    print("\n[11] Testing RBAC Security: Officer Token Blocking Admin Endpoints...")
    off_res = requests.post(f"{BASE_URL}/auth/login", json={"employee_id": "TP-1042", "password": "Officer@2026"})
    officer_token = off_res.json()["access_token"]
    off_headers = {"Authorization": f"Bearer {officer_token}"}
    forbidden_res = requests.get(f"{BASE_URL}/employees", headers=off_headers)
    assert forbidden_res.status_code == 403, "Officer should be blocked from employee management"
    print(f"-> Correctly blocked officer from admin module: '{forbidden_res.json()['detail']}'")

    print("\n" + "=" * 60)
    print("ALL 11 BACKEND, SECURITY, DATABASE, AND ALGORITHM TESTS PASSED!")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
