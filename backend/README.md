# Daily Signals - FastAPI & PostgreSQL Backend

Personal Execution & Habit Tracking System.
Philosophy: *"Measure execution. Study the trend. Improve the system."*

## Architecture Overview

- **Framework**: FastAPI (Python 3.10+)
- **ORM & Database**: SQLAlchemy 2.0 with PostgreSQL
- **Data Validation**: Pydantic v2
- **Design**: RESTful API with separation of concerns:
  - `models.py`: Database models (`users`, `categories`, `habits`, `habit_entries`, `daily_signals`, `daily_reflections`)
  - `schemas.py`: Pydantic validation & serialization
  - `services/execution.py`: Business logic, scoring, and weekly diagnosis
  - `routers/`: REST endpoints for dashboard, habits, entries, signals, reflections, and analytics
  - `database.py`: SQLAlchemy session and engine management

## Local Setup & Execution

1. Create a virtual environment and install dependencies:
   ```bash
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

2. Set environment variables:
   ```bash
   export DATABASE_URL="postgresql://postgres:password@localhost:5432/daily_signals"
   ```

3. Run with Uvicorn:
   ```bash
   uvicorn backend.main:app --reload --port 8000
   ```

4. Interactive API Documentation:
   - Swagger UI: `http://localhost:8000/docs`
   - ReDoc: `http://localhost:8000/redoc`
