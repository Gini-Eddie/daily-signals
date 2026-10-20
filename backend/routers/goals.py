"""Weekly goals live separately from daily habits and preserve each week's progress."""
from datetime import date
from typing import Annotated
from uuid import uuid4
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from auth import read_state, write_state
from threading import Lock

router = APIRouter(prefix="/weekly-goals", tags=["Weekly Goals"])
lock = Lock()


class GoalFields(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    target: float = Field(gt=0, allow_inf_nan=False)
    progress: float = Field(default=0, ge=0, allow_inf_nan=False)
    unit: str = Field(default="steps", max_length=50)


class GoalCreate(GoalFields):
    week_start: date


class GoalUpdate(BaseModel):
    title: str | None = None
    target: float | None = None
    progress: float | None = None
    unit: str | None = None


def validate(data):
    value = GoalFields.model_validate(data)
    if not value.title.strip():
        raise HTTPException(400, "Enter a goal title.")
    return {**value.model_dump(), "title": value.title.strip()}


@router.get("")
def list_goals(week_start: date):
    if week_start.weekday() != 0:
        raise HTTPException(400, "Choose a Monday as the week start.")
    return [g for g in read_state("weekly_goals", []) if g["week_start"] == week_start.isoformat()]


@router.post("", status_code=201)
def create_goal(payload: GoalCreate):
    if payload.week_start.weekday() != 0:
        raise HTTPException(400, "Choose a Monday as the week start.")
    goal = {**validate(payload.model_dump()), "week_start": payload.week_start.isoformat(), "id": str(uuid4())}
    with lock:
        goals = read_state("weekly_goals", [])
        goals.append(goal)
        write_state("weekly_goals", goals)
    return goal


@router.put("/{goal_id}")
def update_goal(goal_id: str, payload: GoalUpdate):
    with lock:
        goals = read_state("weekly_goals", [])
        for goal in goals:
            if goal["id"] == goal_id:
                data = {**goal, **payload.model_dump(exclude_unset=True)}
                try:
                    goal.update(validate(data))
                except ValueError:
                    raise HTTPException(400, "Enter a title, positive target and non-negative progress.")
                write_state("weekly_goals", goals)
                return goal
    raise HTTPException(404, "Goal not found.")


@router.delete("/{goal_id}", status_code=204)
def delete_goal(goal_id: str):
    with lock:
        goals = read_state("weekly_goals", [])
        remaining = [g for g in goals if g["id"] != goal_id]
        if len(remaining) == len(goals):
            raise HTTPException(404, "Goal not found.")
        write_state("weekly_goals", remaining)
