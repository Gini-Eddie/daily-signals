"""
Daily Signals - Configuration
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    PROJECT_NAME: str = "Daily Signals API"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # PostgreSQL Database URL
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/daily_signals"
    
    # Execution scoring weights
    MINIMUM_ACHIEVED_BASE_SCORE: float = 75.0  # Percentage credit awarded when minimum is met
    
    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
