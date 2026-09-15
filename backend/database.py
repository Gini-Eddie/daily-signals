"""
Daily Signals - Database Connection & Session Management
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from config import settings

# Create PostgreSQL SQLAlchemy Engine
# Note: connect_args can include options if using SQLite for test or PostgreSQL for prod
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    connect_args=connect_args
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """FastAPI Dependency injection for database sessions"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
