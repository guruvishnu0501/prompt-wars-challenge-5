from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import Event, BudgetItem
from backend.app.schemas import BudgetItemCreate, BudgetItemUpdate, BudgetItemOut

router = APIRouter(tags=["Budget"])

@router.post("/api/events/{event_id}/budget", response_model=BudgetItemOut, status_code=status.HTTP_201_CREATED)
def add_budget_item(event_id: int, payload: BudgetItemCreate, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    percentage = round((payload.allocated_amount / event.total_budget) * 100, 2) if event.total_budget > 0 else 0.0

    item = BudgetItem(
        event_id=event_id,
        category=payload.category,
        allocated_amount=payload.allocated_amount,
        spent_amount=payload.spent_amount,
        is_variable_guest=payload.is_variable_guest,
        percentage=percentage,
        notes=payload.notes or "",
        is_user_edited=True
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.put("/api/budget/{item_id}", response_model=BudgetItemOut)
def update_budget_item(item_id: int, payload: BudgetItemUpdate, db: Session = Depends(get_db)):
    item = db.query(BudgetItem).filter(BudgetItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Budget item not found")

    if payload.category is not None:
        item.category = payload.category
    if payload.allocated_amount is not None:
        item.allocated_amount = payload.allocated_amount
        event = db.query(Event).filter(Event.id == item.event_id).first()
        if event and event.total_budget > 0:
            item.percentage = round((payload.allocated_amount / event.total_budget) * 100, 2)
    if payload.spent_amount is not None:
        item.spent_amount = payload.spent_amount
    if payload.is_variable_guest is not None:
        item.is_variable_guest = payload.is_variable_guest
    if payload.notes is not None:
        item.notes = payload.notes

    item.is_user_edited = True
    db.commit()
    db.refresh(item)
    return item

@router.delete("/api/budget/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_budget_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(BudgetItem).filter(BudgetItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Budget item not found")
    db.delete(item)
    db.commit()
    return None
