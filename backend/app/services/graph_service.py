import heapq
from typing import Dict, List, Tuple, Any, Optional
from sqlalchemy.orm import Session
from app.models.models import Location, JunctionCorridor, Sensor, TrafficRecord
from app.services.traffic_service import get_live_junction_status

def build_traffic_graph(db: Session) -> Tuple[Dict[int, Dict[str, Any]], Dict[int, List[Dict[str, Any]]]]:
    """
    Constructs an ADSA/DMGT Graph:
    - Vertices (V): City Traffic Junctions (Locations)
    - Directed Edges (E): Inter-connecting Corridors with weights (distance, speed, congestion)
    """
    locations = db.query(Location).filter(Location.status == "ACTIVE").all()
    corridors = db.query(JunctionCorridor).all()

    nodes = {}
    for loc in locations:
        live = get_live_junction_status(loc.location_id, db)
        nodes[loc.location_id] = {
            "location_id": loc.location_id,
            "name": loc.location_name,
            "code": loc.location_code,
            "area": loc.area,
            "latitude": float(loc.latitude),
            "longitude": float(loc.longitude),
            "congestion_level": live.get("congestion_level", "LOW"),
            "average_speed": live.get("average_speed", float(loc.speed_limit_kmh))
        }

    adj = {loc.location_id: [] for loc in locations}
    for c in corridors:
        if c.source_location_id in adj and c.target_location_id in nodes:
            # Target node condition
            target_live = nodes[c.target_location_id]
            spd = max(5.0, target_live["average_speed"])
            dist = float(c.distance_km)
            
            # Congestion multipliers
            cong = target_live["congestion_level"]
            cong_multiplier = 1.0
            if cong == "MODERATE":
                cong_multiplier = 1.35
            elif cong == "HIGH":
                cong_multiplier = 2.20
            elif cong == "CRITICAL":
                cong_multiplier = 3.80

            # Travel time in minutes
            est_time_min = (dist / spd) * 60.0 * (1.0 + 0.15 * (cong_multiplier - 1.0))

            adj[c.source_location_id].append({
                "corridor_id": c.corridor_id,
                "target_id": c.target_location_id,
                "road_name": c.road_name,
                "distance_km": dist,
                "lanes": c.lanes,
                "estimated_time_min": round(est_time_min, 2),
                "speed_kmh": spd,
                "congestion_level": cong,
                "congestion_weight": round(dist * cong_multiplier, 2)
            })

    return nodes, adj

def dijkstra_route(
    source_id: int,
    target_id: int,
    criterion: str,
    db: Session
) -> Optional[Dict[str, Any]]:
    """
    Dijkstra's Algorithm Implementation for ADSA / DMGT Graph Routing:
    - SHORTEST_DISTANCE: Weight = distance_km
    - FASTEST_TIME: Weight = estimated_time_min
    - LEAST_CONGESTED: Weight = distance * congestion_multiplier
    """
    nodes, adj = build_traffic_graph(db)

    if source_id not in nodes or target_id not in nodes:
        return None

    # Priority Queue: (cost, current_node, path_nodes, path_edges)
    pq = [(0.0, source_id, [source_id], [])]
    min_costs = {source_id: 0.0}

    while pq:
        cost, u, path, edges = heapq.heappop(pq)

        if u == target_id:
            # Reached destination! Format detailed route
            total_dist = sum(e["distance_km"] for e in edges)
            total_time = sum(e["estimated_time_min"] for e in edges)
            avg_spd = round(total_dist / (total_time / 60.0), 1) if total_time > 0 else 45.0

            steps = []
            for idx, e in enumerate(edges, 1):
                from_name = nodes[e["from_id"]]["name"]
                to_name = nodes[e["target_id"]]["name"]
                steps.append({
                    "step_number": idx,
                    "from_location": from_name,
                    "to_location": to_name,
                    "road_name": e["road_name"],
                    "distance_km": e["distance_km"],
                    "estimated_time_min": e["estimated_time_min"],
                    "congestion_level": e["congestion_level"],
                    "speed_kmh": e["speed_kmh"]
                })

            # Check overall path congestion
            congestions = [e["congestion_level"] for e in edges]
            if "CRITICAL" in congestions:
                summary = "Critical Congestion Along Path - Caution Advised"
            elif "HIGH" in congestions:
                summary = "Moderate-to-High Congestion Detected"
            elif "MODERATE" in congestions:
                summary = "Normal Urban Flow with Minor Delays"
            else:
                summary = "Optimal Clear Route"

            return {
                "path": path,
                "path_names": [nodes[nid]["name"] for nid in path],
                "total_distance_km": round(total_dist, 2),
                "total_estimated_time_min": round(total_time, 1),
                "average_speed_kmh": avg_spd,
                "path_congestion_summary": summary,
                "steps": steps
            }

        if cost > min_costs.get(u, float('inf')):
            continue

        for neighbor in adj.get(u, []):
            v = neighbor["target_id"]

            if criterion == "SHORTEST_DISTANCE":
                edge_weight = neighbor["distance_km"]
            elif criterion == "FASTEST_TIME":
                edge_weight = neighbor["estimated_time_min"]
            else:  # LEAST_CONGESTED
                edge_weight = neighbor["congestion_weight"]

            new_cost = cost + edge_weight

            if new_cost < min_costs.get(v, float('inf')):
                min_costs[v] = new_cost
                edge_info = neighbor.copy()
                edge_info["from_id"] = u
                heapq.heappush(pq, (new_cost, v, path + [v], edges + [edge_info]))

    return None
