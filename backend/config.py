"""
Daily Signals - Configuration
"""
import os
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    PROJECT_NAME: str = "Daily Signals API"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"

    # Grab the URL from the environment, fallback to localhost for local testing
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://user:pass@localhost/db")
    
    # Execution scoring weights
    MINIMUM_ACHIEVED_BASE_SCORE: float = 75.0  # Percentage credit awarded when minimum is met
    
    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
