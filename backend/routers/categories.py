"""
Daily Signals - Categories Router
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Category, User
from backend.schemas import CategoryCreate, CategoryUpdate, CategoryResponse

router = APIRouter(prefix="/categories", tags=["Categories"])


def get_current_user_id() -> int:
    """Mock user identifier for single-user execution tracking system"""
    return 1


@router.get("", response_model=List[CategoryResponse])
def get_categories(db: Session = Depends(get_db)):
    user_id = get_current_user_id()
    categories = db.query(Category).filter(Category.user_id == user_id).order_by(Category.display_order, Category.id).all()
    return categories


@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(payload: CategoryCreate, db: Session = Depends(get_db)):
    user_id = get_current_user_id()
    existing = db.query(Category).filter(Category.user_id == user_id, Category.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category with this name already exists")
    
    category = Category(
        user_id=user_id,
        name=payload.name,
        color=payload.color or "#3b82f6",
        display_order=payload.display_order or 0
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(category_id: int, db: Session = Depends(get_db)):
    user_id = get_current_user_id()
    category = db.query(Category).filter(Category.id == category_id, Category.user_id == user_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    db.delete(category)
    db.commit()
    return None
