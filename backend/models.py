"""
Daily Signals - PostgreSQL SQLAlchemy Models

Entities:
- users
- categories
- habits
- habit_entries
- daily_signals
- daily_reflections
"""
from datetime import datetime, date
from enum import Enum
from sqlalchemy import (
    Column, Integer, String, Text, Float, Boolean, 
    Date, DateTime, ForeignKey, Enum as SQLEnum, JSON, UniqueConstraint, Index
)
from sqlalchemy.orm import relationship
from backend.database import Base


class TrackingType(str, Enum):
    BINARY = "BINARY"                     # Completed / Not Completed
    QUANTITY = "QUANTITY"                 # Measurable with Target
    MINIMUM_TARGET = "MINIMUM_TARGET"     # Minimum execution + Full target


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    categories = relationship("Category", back_populates="user", cascade="all, delete-orphan")
    habits = relationship("Habit", back_populates="user", cascade="all, delete-orphan")
    daily_signals = relationship("DailySignal", back_populates="user", cascade="all, delete-orphan")
    daily_reflections = relationship("DailyReflection", back_populates="user", cascade="all, delete-orphan")


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    color = Column(String(50), default="#3b82f6")
    display_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="categories")
    habits = relationship("Habit", back_populates="category", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint("user_id", "name", name="uq_user_category_name"),
    )


class Habit(Base):
    __tablename__ = "habits"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True, index=True)
    
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    tracking_type = Column(SQLEnum(TrackingType), nullable=False, default=TrackingType.BINARY)
    unit = Column(String(50), nullable=True)  # reps, pages, minutes, hours, calls, applications, outreaches, sessions
    
    minimum_value = Column(Float, nullable=True)  # For MINIMUM_TARGET
    target_value = Column(Float, nullable=True)   # For QUANTITY and MINIMUM_TARGET
    
    # Days of week scheduled: array of integers 0 (Monday) to 6 (Sunday)
    applicable_days = Column(JSON, nullable=False, default=lambda: [0, 1, 2, 3, 4, 5, 6])
    
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    display_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="habits")
    category = relationship("Category", back_populates="habits")
    entries = relationship("HabitEntry", back_populates="habit", cascade="all, delete-orphan")


class HabitEntry(Base):
    __tablename__ = "habit_entries"

    id = Column(Integer, primary_key=True, index=True)
    habit_id = Column(Integer, ForeignKey("habits.id", ondelete="CASCADE"), nullable=False, index=True)
    entry_date = Column(Date, nullable=False, index=True)
    
    actual_value = Column(Float, nullable=True, default=0.0)
    binary_completed = Column(Boolean, nullable=True, default=False)
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    habit = relationship("Habit", back_populates="entries")

    __table_args__ = (
        UniqueConstraint("habit_id", "entry_date", name="uq_habit_entry_date"),
        Index("ix_habit_entry_date_lookup", "habit_id", "entry_date"),
    )


class DailySignal(Base):
    """
    Today's 3 Signals:
    The three most critical controllable daily actions.
    """
    __tablename__ = "daily_signals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    signal_date = Column(Date, nullable=False, index=True)
    order_position = Column(Integer, nullable=False, default=1)  # 1, 2, or 3
    
    title = Column(String(200), nullable=False)
    category_name = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    target_quantity = Column(String(100), nullable=True)  # e.g., "5 calls", "2 applications"
    is_completed = Column(Boolean, default=False, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="daily_signals")

    __table_args__ = (
        UniqueConstraint("user_id", "signal_date", "order_position", name="uq_user_signal_order"),
    )


class DailyReflection(Base):
    """
    Optional end-of-day reflection:
    1. What went well?
    2. What interfered with execution?
    3. What will I adjust tomorrow?
    """
    __tablename__ = "daily_reflections"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    reflection_date = Column(Date, nullable=False, index=True)
    
    what_went_well = Column(Text, nullable=True)
    what_interfered = Column(Text, nullable=True)
    what_to_adjust = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="daily_reflections")

    __table_args__ = (
        UniqueConstraint("user_id", "reflection_date", name="uq_user_reflection_date"),
    )
