from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import Event, Task
from backend.app.schemas import TaskCreate, TaskUpdate, TaskOut
from backend.app.deterministic_engine import parse_date

router = APIRouter(tags=["Tasks"])

def format_task_out(t: Task) -> dict:
    today = date.today()
    try:
        t_due = parse_date(t.due_date)
        is_overdue = (t_due < today) and (t.status != "completed")
        days_left = (t_due - today).days
    except Exception:
        is_overdue = False
        days_left = 0

    return {
        "id": t.id,
        "event_id": t.event_id,
        "title": t.title,
        "category": t.category,
        "due_date": t.due_date,
        "days_before_event": t.days_before_event,
        "status": t.status,
        "priority": t.priority,
        "notes": t.notes,
        "is_user_edited": t.is_user_edited,
        "is_overdue": is_overdue,
        "days_until_due": days_left,
        "created_at": t.created_at
    }

@router.post("/api/events/{event_id}/tasks", response_model=TaskOut, status_code=status.HTTP_201_CREATED)
def add_task(event_id: int, payload: TaskCreate, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    try:
        event_d = parse_date(event.event_date)
        task_d = parse_date(payload.due_date)
        days_before = (event_d - task_d).days
    except Exception:
        days_before = payload.days_before_event

    task = Task(
        event_id=event_id,
        title=payload.title,
        category=payload.category,
        due_date=payload.due_date,
        days_before_event=days_before,
        status=payload.status,
        priority=payload.priority,
        notes=payload.notes or "",
        is_user_edited=True
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return format_task_out(task)

@router.put("/api/tasks/{task_id}", response_model=TaskOut)
def update_task(task_id: int, payload: TaskUpdate, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if payload.title is not None:
        task.title = payload.title
    if payload.category is not None:
        task.category = payload.category
    if payload.due_date is not None:
        task.due_date = payload.due_date
        event = db.query(Event).filter(Event.id == task.event_id).first()
        if event:
            try:
                event_d = parse_date(event.event_date)
                task_d = parse_date(payload.due_date)
                task.days_before_event = (event_d - task_d).days
            except Exception:
                pass
    if payload.days_before_event is not None:
        task.days_before_event = payload.days_before_event
    if payload.status is not None:
        task.status = payload.status
    if payload.priority is not None:
        task.priority = payload.priority
    if payload.notes is not None:
        task.notes = payload.notes

    task.is_user_edited = True
    db.commit()
    db.refresh(task)
    return format_task_out(task)

@router.delete("/api/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
    return None
