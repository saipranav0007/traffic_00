from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.schemas.schemas import RouteRequest, RouteResponse
from app.services.graph_service import dijkstra_route, build_traffic_graph
from app.models.models import User
from app.api.deps import get_current_user

router = APIRouter(prefix="/routing", tags=["Graph Routing (ADSA/DMGT)"])

@router.post("/calculate-route", response_model=RouteResponse)
def calculate_route(
    payload: RouteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if payload.source_location_id == payload.target_location_id:
        raise HTTPException(status_code=400, detail="Source and destination junctions cannot be the same")

    result = dijkstra_route(
        source_id=payload.source_location_id,
        target_id=payload.target_location_id,
        criterion=payload.criterion,
        db=db
    )

    if not result:
        raise HTTPException(status_code=404, detail="No viable corridor route found between selected junctions")

    return result

@router.get("/graph-data")
def get_full_graph_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    nodes, adj = build_traffic_graph(db)
    return {
        "nodes": list(nodes.values()),
        "adjacency": adj
    }
