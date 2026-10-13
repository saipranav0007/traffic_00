import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.database.init_db import init_database
from app.simulation.traffic_simulator import run_traffic_simulator_loop
from app.api import (
    auth, dashboard, traffic, sensors, analytics, locations, alerts, employees, settings as settings_api, graph_routing
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("uvicorn")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize DB and start simulation
    logger.info("Starting up Smart City Traffic Sensor System...")
    init_database()
    
    # Start background traffic simulator task
    simulator_task = asyncio.create_task(run_traffic_simulator_loop())
    yield
    # Shutdown: Cancel simulation task
    logger.info("Shutting down Smart City Traffic Sensor System...")
    simulator_task.cancel()
    try:
        await simulator_task
    except asyncio.CancelledError:
        pass

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Intelligent Smart City Traffic Sensor Monitoring & Congestion Management Control Center",
    lifespan=lifespan
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust as needed in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(dashboard.router, prefix=settings.API_V1_STR)
app.include_router(traffic.router, prefix=settings.API_V1_STR)
app.include_router(sensors.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)
app.include_router(locations.router, prefix=settings.API_V1_STR)
app.include_router(alerts.router, prefix=settings.API_V1_STR)
app.include_router(employees.router, prefix=settings.API_V1_STR)
app.include_router(settings_api.router, prefix=settings.API_V1_STR)
app.include_router(graph_routing.router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "system": settings.PROJECT_NAME,
        "status": "OPERATIONAL",
        "version": settings.VERSION,
        "docs_url": "/docs"
    }
