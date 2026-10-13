import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.models.models import Base

logger = logging.getLogger("uvicorn")

def get_engine():
    try:
        # First attempt: MySQL
        engine = create_engine(
            settings.DATABASE_URL,
            pool_pre_ping=True,
            pool_recycle=3600,
            echo=False
        )
        # Test connection
        with engine.connect() as conn:
            logger.info(f"Connected to MySQL database at {settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}")
        return engine
    except Exception as e:
        logger.warning(f"MySQL connection to {settings.DATABASE_URL} failed: {e}. Using fallback SQLite database.")
        sqlite_engine = create_engine(
            "sqlite:///./smart_traffic.db",
            connect_args={"check_same_thread": False},
            echo=False
        )
        return sqlite_engine

engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
