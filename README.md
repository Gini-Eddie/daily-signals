# Daily Signals — Personal Execution & Habit Tracking System

> *"Measure execution. Study the trend. Improve the system."*

**Daily Signals** is a clean, focused, and production-oriented personal habit, execution, and progress tracking system. Rather than judging progress by outcomes outside direct control, Daily Signals anchors on controllable daily actions, leading indicators, and disciplined consistency.

---

## Core Philosophy

- **Controllable Actions First**: Outcomes (results, revenue, weight, job offers) are lagging indicators. Controllable habits (push-ups, sit-ups, study hours, applications sent, outreach calls) are leading indicators.
- **Protect the Floor**: Every quantitative habit supports a **Floor Minimum** (e.g. 15 mins of workout or 5 pages of reading) alongside a **Full Target** (45 mins or 10 pages). Achieving the floor on tough days protects momentum and awards 75% execution score.
- **Inspect and Verify**: Review your execution before ending the day, verify that everything is in order, and publish your daily log with a timestamped record.

---

## Key Features

### 1. Daily Habits & Execution Tracking
- **Multi-Type Tracking**:
  - **Binary Habits**: Completed or not (e.g., Morning Prayer, Journaling, Planning).
  - **Quantitative Habits**: Exact units and reps (e.g., Push-ups, Sit-ups, Prospect Calls, Job Applications).
  - **Floor Minimum & Full Target Habits**: Floor protects against total zero; full target drives mastery (e.g., Exercise, AI Engineering Block, Reading).
- **Fast Daily Logging**: Quick `+` / `-` increment buttons, direct number entry, and one-tap binary completion with instant auto-save.

### 2. Daily Priority Signals
- Focus on the top 3 highest-leverage actions for the current date.
- Mark signals complete as they are executed throughout the day.

### 3. Personal Intake & Mini-Authentication
- **Non-Complex Intake**: Personalize your profile with your name (e.g., Ginika), role, and execution motto without cumbersome password friction.
- **Daily Check-In**: One-tap check-in with consecutive streak tracking.
- **Blank Starting State**: Reset habit values to zero for the day at any time to start fresh.

### 4. Daily Verification & Publishing Workflow
- **Diagnostic Pre-Check**: Review your daily execution score, completion percentages, and exercise statuses (Push-ups, Sit-ups, workouts) to ensure everything is in order.
- **Publish for the Day**: Save a verified snapshot for the date with timestamp, publisher name, and optional daily reflection notes.

### 5. Daily Reflection
- Structured 3-prompt daily debrief:
  1. *What went well today?*
  2. *What interfered with execution?*
  3. *What will you adjust tomorrow?*

### 6. Habit History & Day Explorer
- Historical calendar navigation to inspect any past date's execution score, completed signals, and logged habit values.

### 7. Weekly Analytics & Review
- **7-Day Trend Visualizations**: Day-by-day score graphs, floor protection counts, and habit completion heatmaps.
- **Weekly Review Protocol**: Aggregate score, best execution day, most consistent habits, and strategic reflection adjustments.

### 8. Python FastAPI Backend Specification Inspector
- An in-app viewer providing the complete Python FastAPI + Pydantic + SQLAlchemy architecture for users who wish to deploy against a standalone Python/PostgreSQL server.

---

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, Vite
- **Backend**: Node.js / Express REST API (`server.ts`) with typed endpoints
- **Python Backend Specification**: FastAPI, Pydantic v2, SQLAlchemy schemas included
- **Data Store**: Persistent JSON database (`data/store.json`) with auto-seeding and validation

---

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/dashboard/today?date=YYYY-MM-DD` | Returns daily score, scheduled habits, signals, reflection, and publication status |
| `POST` | `/api/publish` | Verifies and publishes the day's execution log |
| `GET` | `/api/publish/status?date=YYYY-MM-DD` | Returns publication status for a specific date |
| `POST` | `/api/entries/clear-day` | Clears all habit values for a date (resets to blank) |
| `GET` | `/api/user/profile` | Fetches personalized user profile & streak info |
| `POST` | `/api/user/profile` | Updates user name, role, and motto |
| `POST` | `/api/user/checkin` | Records daily check-in for the user |
| `GET` | `/api/habits` | Lists all habits with category details |
| `POST` | `/api/habits` | Creates a new habit |
| `PUT` | `/api/habits/:id` | Updates an existing habit |
| `POST` | `/api/entries` | Upserts a single habit entry |
| `POST` | `/api/entries/batch` | Batch updates multiple habit entries |
| `GET` | `/api/signals?date=YYYY-MM-DD` | Retrieves the 3 priority signals for the date |
| `POST` | `/api/signals` | Creates or updates daily priority signals |
| `GET` | `/api/analytics/weekly?week_offset=0` | Returns 7-day analytics, execution averages, and trends |
| `GET` | `/api/analytics/review?week_offset=0` | Returns weekly review summaries and insights |
| `POST` | `/api/reset-starter-data` | Restores default starter categories and habits |

---

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm

### Installation & Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```
   The application will be accessible at `http://localhost:3000`.

3. **Build for production**:
   ```bash
   npm run build
   ```

4. **Start the production server**:
   ```bash
   npm start
   ```

---

## License

MIT License. Designed for personal execution, discipline, and daily consistency.
