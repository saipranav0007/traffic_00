import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Smart City Traffic Sensor System"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Secret Key for JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "smart_traffic_jwt_secret_key_dept_police_2026_x99")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 12  # 12 hours shift token
    
    # Database Configuration (MySQL 8.0 with fallback)
    DB_HOST: str = os.getenv("DB_HOST", "localhost")
    DB_PORT: int = int(os.getenv("DB_PORT", "3306"))
    DB_USER: str = os.getenv("DB_USER", "root")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "1234")
    DB_NAME: str = os.getenv("DB_NAME", "smart_traffic_db")
    
    @property
    def DATABASE_URL(self) -> str:
        explicit_url = os.getenv("DATABASE_URL")
        if explicit_url:
            return explicit_url
        return f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
    
    # Simulation Settings
    SIMULATION_ENABLED: bool = True
    SIMULATION_INTERVAL_SEC: int = 6
    
    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
