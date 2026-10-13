from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.models import Location, JunctionCorridor, User
from app.schemas.schemas import LocationOut, CorridorOut
from app.services.traffic_service import get_live_junction_status
from app.api.deps import get_current_user

router = APIRouter(prefix="/locations", tags=["Locations"])

@router.get("", response_model=List[LocationOut])
def get_locations(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Location).all()

@router.get("/live-map")
def get_locations_for_map(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    locations = db.query(Location).all()
    corridors = db.query(JunctionCorridor).all()

    nodes = [get_live_junction_status(loc.location_id, db) for loc in locations]
    
    corridor_data = []
    for c in corridors:
        corridor_data.append({
            "corridor_id": c.corridor_id,
            "source_location_id": c.source_location_id,
            "target_location_id": c.target_location_id,
            "road_name": c.road_name,
            "distance_km": float(c.distance_km),
            "lanes": c.lanes
        })

    return {
        "nodes": nodes,
        "corridors": corridor_data
    }
