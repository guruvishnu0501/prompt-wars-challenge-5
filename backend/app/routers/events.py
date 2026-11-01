import json
from datetime import datetime, date, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models import Event, BudgetItem, Task, Vendor, Guest
from backend.app.schemas import (
    EventCreate, EventUpdate, EventOut, PlanGenerateRequest,
    BudgetRecalculateRequest, GuestCountChangeRequest, EventDateChangeRequest,
    TaskOut
)
from backend.app.deterministic_engine import (
    validate_and_normalize_budget, recalculate_budget_reduction,
    recalculate_guest_count_change, reschedule_event_dates,
    annotate_tasks_with_overdue, parse_date, format_date
)
from backend.app.groq_service import generate_event_plan

router = APIRouter(prefix="/api/events", tags=["Events"])

def compute_event_metrics(event: Event) -> dict:
    total_spent = sum(item.spent_amount for item in event.budget_items)
    total_allocated = sum(item.allocated_amount for item in event.budget_items)
    remaining_budget = round(event.total_budget - total_spent, 2)
    cost_per_guest = round(event.total_budget / event.guest_count, 2) if event.guest_count > 0 else 0.0

    today = date.today()
    annotated_tasks = []
    overdue_count = 0
    completed_count = 0

    for t in event.tasks:
        try:
            t_due = parse_date(t.due_date)
            is_overdue = (t_due < today) and (t.status != "completed")
            days_left = (t_due - today).days
        except Exception:
            is_overdue = False
            days_left = 0

        if is_overdue:
            overdue_count += 1
        if t.status == "completed":
            completed_count += 1

        annotated_tasks.append({
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
        })

    return {
        "total_spent": round(total_spent, 2),
        "total_allocated": round(total_allocated, 2),
        "remaining_budget": remaining_budget,
        "cost_per_guest": cost_per_guest,
        "overdue_task_count": overdue_count,
        "total_task_count": len(event.tasks),
        "completed_task_count": completed_count,
        "annotated_tasks": annotated_tasks
    }

def format_event_out(event: Event) -> EventOut:
    metrics = compute_event_metrics(event)
    out = EventOut.model_validate(event)
    out.total_spent = metrics["total_spent"]
    out.total_allocated = metrics["total_allocated"]
    out.remaining_budget = metrics["remaining_budget"]
    out.cost_per_guest = metrics["cost_per_guest"]
    out.overdue_task_count = metrics["overdue_task_count"]
    out.total_task_count = metrics["total_task_count"]
    out.completed_task_count = metrics["completed_task_count"]
    out.tasks = [TaskOut(**t) for t in metrics["annotated_tasks"]]
    return out

@router.get("", response_model=List[EventOut])
def list_events(db: Session = Depends(get_db)):
    events = db.query(Event).order_by(Event.created_at.desc()).all()
    return [format_event_out(e) for e in events]

@router.post("", response_model=EventOut, status_code=status.HTTP_201_CREATED)
async def create_event(payload: EventCreate, db: Session = Depends(get_db)):
    # 1. Create base event
    event = Event(
        title=payload.title,
        event_type=payload.event_type,
        event_date=payload.event_date,
        guest_count=payload.guest_count,
        total_budget=payload.total_budget,
        currency=payload.currency,
        location=payload.location or ""
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    # 2. Generate Plan via Groq backend or Demo fallback
    plan = await generate_event_plan(
        title=event.title,
        event_type=event.event_type,
        event_date=event.event_date,
        guest_count=event.guest_count,
        total_budget=event.total_budget,
        location=event.location,
        custom_notes=payload.custom_notes or "",
        force_demo=payload.force_demo
    )

    # 3. Update Event with AI Blueprint
    event.theme_concept = plan.get("theme_concept", "")
    event.color_palette = plan.get("color_palette", "")
    event.dress_code = plan.get("dress_code", "")
    event.mood_description = plan.get("mood_description", "")
    event.schedule_json = json.dumps(plan.get("schedule", []))
    event.is_demo = plan.get("is_demo", True)
    event.ai_provider = plan.get("provider", "Demo Mode")

    # 4. Deterministically validate and normalize budget allocations
    raw_budget = plan.get("budget_allocations", [])
    normalized_items = validate_and_normalize_budget(
        total_budget=event.total_budget,
        raw_allocations=raw_budget,
        event_type=event.event_type
    )

    for b in normalized_items:
        db.add(BudgetItem(
            event_id=event.id,
            category=b["category"],
            allocated_amount=b["allocated_amount"],
            spent_amount=b.get("spent_amount", 0.0),
            is_variable_guest=b.get("is_variable_guest", False),
            percentage=b.get("percentage", 0.0),
            notes=b.get("notes", "")
        ))

    # 5. Populate timeline tasks with deterministic target dates
    event_date_obj = parse_date(event.event_date)
    for t in plan.get("timeline_tasks", []):
        days_before = t.get("days_before_event", 30)
        due = event_date_obj - timedelta(days=days_before)
        db.add(Task(
            event_id=event.id,
            title=t.get("title", "Task"),
            category=t.get("category", "General"),
            due_date=format_date(due),
            days_before_event=days_before,
            priority=t.get("priority", "medium"),
            notes=t.get("notes", "")
        ))

    # 6. Populate recommended vendors
    for v in plan.get("recommended_vendors", []):
        db.add(Vendor(
            event_id=event.id,
            name=v.get("name", "Vendor"),
            category=v.get("category", "General"),
            notes=v.get("notes", ""),
            status="researching"
        ))

    db.commit()
    db.refresh(event)
    return format_event_out(event)

@router.get("/{event_id}", response_model=EventOut)
def get_event(event_id: int, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return format_event_out(event)

@router.put("/{event_id}", response_model=EventOut)
def update_event(event_id: int, payload: EventUpdate, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    if payload.title is not None:
        event.title = payload.title
    if payload.event_type is not None:
        event.event_type = payload.event_type
    if payload.currency is not None:
        event.currency = payload.currency
    if payload.location is not None:
        event.location = payload.location

    # If event_date changes via PUT, trigger deterministic reschedule
    if payload.event_date and payload.event_date != event.event_date:
        old_date = event.event_date
        event.event_date = payload.event_date
        old_tasks = [{"id": t.id, "due_date": t.due_date, "days_before_event": t.days_before_event, "status": t.status} for t in event.tasks]
        rescheduled = reschedule_event_dates(old_tasks, old_date, payload.event_date)
        resched_map = {r["id"]: r for r in rescheduled}
        for t in event.tasks:
            if t.id in resched_map:
                t.due_date = resched_map[t.id]["due_date"]
                t.days_before_event = resched_map[t.id]["days_before_event"]

    # If total_budget changes via PUT, trigger deterministic budget reduction / scaling
    if payload.total_budget and payload.total_budget != event.total_budget:
        event.total_budget = payload.total_budget
        current_items = [{
            "id": b.id, "category": b.category, "allocated_amount": b.allocated_amount,
            "spent_amount": b.spent_amount, "is_variable_guest": b.is_variable_guest,
            "notes": b.notes, "is_user_edited": b.is_user_edited
        } for b in event.budget_items]
        recalc = recalculate_budget_reduction(current_items, payload.total_budget)
        item_map = {item["id"]: item for item in recalc["items"]}
        for b in event.budget_items:
            if b.id in item_map:
                b.allocated_amount = item_map[b.id]["allocated_amount"]
                b.percentage = item_map[b.id]["percentage"]

    # If guest_count changes via PUT, scale variable items
    if payload.guest_count and payload.guest_count != event.guest_count:
        old_guests = event.guest_count
        event.guest_count = payload.guest_count
        current_items = [{
            "id": b.id, "category": b.category, "allocated_amount": b.allocated_amount,
            "spent_amount": b.spent_amount, "is_variable_guest": b.is_variable_guest,
            "notes": b.notes, "is_user_edited": b.is_user_edited
        } for b in event.budget_items]
        recalc = recalculate_guest_count_change(current_items, old_guests, payload.guest_count, event.total_budget)
        item_map = {item["id"]: item for item in recalc["items"]}
        for b in event.budget_items:
            if b.id in item_map:
                b.allocated_amount = item_map[b.id]["allocated_amount"]
                b.is_variable_guest = item_map[b.id]["is_variable_guest"]
                b.percentage = item_map[b.id]["percentage"]

    db.commit()
    db.refresh(event)
    return format_event_out(event)

@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(event_id: int, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    db.delete(event)
    db.commit()
    return None

@router.post("/{event_id}/generate-plan", response_model=EventOut)
async def regenerate_plan(
    event_id: int,
    payload: PlanGenerateRequest,
    db: Session = Depends(get_db)
):
    """
    Requirement 5: Check that user edits persist correctly and that regenerating an AI plan
    does not silently overwrite user data.
    """
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    if payload.merge_mode == "replace" and not payload.confirmed_overwrite:
        raise HTTPException(
            status_code=400,
            detail="Overwriting the existing plan will remove custom user edits. Please set confirmed_overwrite to true to proceed, or select 'merge' mode."
        )

    # Call AI / Demo planner
    plan = await generate_event_plan(
        title=event.title,
        event_type=event.event_type,
        event_date=event.event_date,
        guest_count=event.guest_count,
        total_budget=event.total_budget,
        location=event.location,
        custom_notes=payload.custom_notes or "",
        force_demo=payload.force_demo
    )

    # Update Blueprint
    event.theme_concept = plan.get("theme_concept", event.theme_concept)
    event.color_palette = plan.get("color_palette", event.color_palette)
    event.dress_code = plan.get("dress_code", event.dress_code)
    event.mood_description = plan.get("mood_description", event.mood_description)
    event.schedule_json = json.dumps(plan.get("schedule", []))
    event.is_demo = plan.get("is_demo", True)
    event.ai_provider = plan.get("provider", "Demo Mode")

    event_date_obj = parse_date(event.event_date)

    if payload.merge_mode == "replace" and payload.confirmed_overwrite:
        # Full replace requested explicitly by user
        db.query(BudgetItem).filter(BudgetItem.event_id == event_id).delete()
        db.query(Task).filter(Task.event_id == event_id).delete()

        normalized_items = validate_and_normalize_budget(
            total_budget=event.total_budget,
            raw_allocations=plan.get("budget_allocations", []),
            event_type=event.event_type
        )
        for b in normalized_items:
            db.add(BudgetItem(
                event_id=event.id,
                category=b["category"],
                allocated_amount=b["allocated_amount"],
                spent_amount=0.0,
                is_variable_guest=b.get("is_variable_guest", False),
                percentage=b.get("percentage", 0.0),
                notes=b.get("notes", "")
            ))

        for t in plan.get("timeline_tasks", []):
            days_before = t.get("days_before_event", 30)
            due = event_date_obj - timedelta(days=days_before)
            db.add(Task(
                event_id=event.id,
                title=t.get("title", "Task"),
                category=t.get("category", "General"),
                due_date=format_date(due),
                days_before_event=days_before,
                priority=t.get("priority", "medium"),
                notes=t.get("notes", "")
            ))
    else:
        # MERGE MODE: Preserve all user-edited items & custom expenses!
        existing_categories = {b.category.lower(): b for b in event.budget_items}
        new_allocations = plan.get("budget_allocations", [])
        for nb in new_allocations:
            cat_name = nb.get("category", "").strip()
            if cat_name.lower() not in existing_categories:
                # Add new recommended category if not already tracked
                db.add(BudgetItem(
                    event_id=event.id,
                    category=cat_name,
                    allocated_amount=round(event.total_budget * nb.get("percentage", 0.05), 2),
                    spent_amount=0.0,
                    is_variable_guest=False,
                    percentage=round(nb.get("percentage", 0.05) * 100, 2),
                    notes=nb.get("notes", "") + " (AI Suggested Addition)",
                    is_user_edited=False
                ))

        existing_task_titles = {t.title.lower() for t in event.tasks}
        for nt in plan.get("timeline_tasks", []):
            title = nt.get("title", "").strip()
            if title.lower() not in existing_task_titles:
                days_before = nt.get("days_before_event", 30)
                due = event_date_obj - timedelta(days=days_before)
                db.add(Task(
                    event_id=event.id,
                    title=title,
                    category=nt.get("category", "General"),
                    due_date=format_date(due),
                    days_before_event=days_before,
                    priority=nt.get("priority", "medium"),
                    notes=nt.get("notes", "") + " (AI Suggested Addition)",
                    is_user_edited=False
                ))

    db.commit()
    db.refresh(event)
    return format_event_out(event)

@router.post("/{event_id}/recalculate-budget", response_model=EventOut)
def recalculate_event_budget(
    event_id: int,
    payload: BudgetRecalculateRequest,
    db: Session = Depends(get_db)
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    event.total_budget = payload.new_total_budget
    current_items = [{
        "id": b.id, "category": b.category, "allocated_amount": b.allocated_amount,
        "spent_amount": b.spent_amount, "is_variable_guest": b.is_variable_guest,
        "notes": b.notes, "is_user_edited": b.is_user_edited
    } for b in event.budget_items]

    recalc = recalculate_budget_reduction(current_items, payload.new_total_budget)
    item_map = {item["id"]: item for item in recalc["items"]}

    for b in event.budget_items:
        if b.id in item_map:
            b.allocated_amount = item_map[b.id]["allocated_amount"]
            b.percentage = item_map[b.id]["percentage"]

    db.commit()
    db.refresh(event)
    return format_event_out(event)

@router.post("/{event_id}/change-guest-count", response_model=EventOut)
def change_event_guest_count(
    event_id: int,
    payload: GuestCountChangeRequest,
    db: Session = Depends(get_db)
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    old_guests = event.guest_count
    event.guest_count = payload.new_guest_count

    current_items = [{
        "id": b.id, "category": b.category, "allocated_amount": b.allocated_amount,
        "spent_amount": b.spent_amount, "is_variable_guest": b.is_variable_guest,
        "notes": b.notes, "is_user_edited": b.is_user_edited
    } for b in event.budget_items]

    recalc = recalculate_guest_count_change(current_items, old_guests, payload.new_guest_count, event.total_budget)
    item_map = {item["id"]: item for item in recalc["items"]}

    for b in event.budget_items:
        if b.id in item_map:
            b.allocated_amount = item_map[b.id]["allocated_amount"]
            b.is_variable_guest = item_map[b.id]["is_variable_guest"]
            b.percentage = item_map[b.id]["percentage"]

    db.commit()
    db.refresh(event)
    return format_event_out(event)

@router.post("/{event_id}/reschedule-date", response_model=EventOut)
def reschedule_event(
    event_id: int,
    payload: EventDateChangeRequest,
    db: Session = Depends(get_db)
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    old_date = event.event_date
    event.event_date = payload.new_event_date

    old_tasks = [{
        "id": t.id,
        "due_date": t.due_date,
        "days_before_event": t.days_before_event,
        "status": t.status
    } for t in event.tasks]

    rescheduled = reschedule_event_dates(old_tasks, old_date, payload.new_event_date)
    resched_map = {r["id"]: r for r in rescheduled}

    for t in event.tasks:
        if t.id in resched_map:
            t.due_date = resched_map[t.id]["due_date"]
            t.days_before_event = resched_map[t.id]["days_before_event"]

    db.commit()
    db.refresh(event)
    return format_event_out(event)
