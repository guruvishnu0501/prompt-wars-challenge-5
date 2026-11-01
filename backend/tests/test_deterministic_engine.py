import pytest
from datetime import date, timedelta
from backend.app.deterministic_engine import (
    validate_and_normalize_budget,
    recalculate_budget_reduction,
    recalculate_guest_count_change,
    reschedule_event_dates,
    parse_date,
    format_date
)

def test_validate_and_normalize_budget_sum_exact():
    total_budget = 10000.0
    items = validate_and_normalize_budget(total_budget, event_type="wedding")
    assert len(items) > 0
    total_allocated = sum(item["allocated_amount"] for item in items)
    # Check deterministic exact equality to the cent
    assert round(total_allocated, 2) == round(total_budget, 2)

def test_validate_and_normalize_budget_invalid_input():
    with pytest.raises(ValueError, match="Total budget must be a positive number"):
        validate_and_normalize_budget(0.0)
    with pytest.raises(ValueError, match="Total budget must be a positive number"):
        validate_and_normalize_budget(-500.0)

def test_budget_reduction_preserves_spent():
    items = [
        {"id": 1, "category": "Venue", "allocated_amount": 5000.0, "spent_amount": 3000.0},
        {"id": 2, "category": "Catering", "allocated_amount": 3000.0, "spent_amount": 1000.0},
        {"id": 3, "category": "Decor", "allocated_amount": 2000.0, "spent_amount": 0.0}
    ]
    # Reduce total budget from 10,000 to 6,000 (total spent is 4,000)
    result = recalculate_budget_reduction(items, 6000.0)
    assert result["is_deficit"] is False
    assert result["total_spent"] == 4000.0
    assert result["total_allocated"] == 6000.0
    
    # Check that allocated amount for venue is at least spent amount (3000)
    venue = next(i for i in result["items"] if i["category"] == "Venue")
    assert venue["allocated_amount"] >= 3000.0

def test_budget_reduction_exceeds_spent_warning():
    items = [
        {"id": 1, "category": "Venue", "allocated_amount": 5000.0, "spent_amount": 4000.0},
        {"id": 2, "category": "Catering", "allocated_amount": 3000.0, "spent_amount": 2500.0}
    ]
    # Total spent is 6500. New budget is 5000 (Deficit of 1500)
    result = recalculate_budget_reduction(items, 5000.0)
    assert result["is_deficit"] is True
    assert "Deficit Warning" in result["warning"]
    assert result["total_spent"] == 6500.0

def test_guest_count_change_variable_items():
    items = [
        {"id": 1, "category": "Catering & Bar", "allocated_amount": 4000.0, "is_variable_guest": True},
        {"id": 2, "category": "Venue Rental", "allocated_amount": 6000.0, "is_variable_guest": False}
    ]
    # Double guests from 50 to 100
    res = recalculate_guest_count_change(items, old_guest_count=50, new_guest_count=100, total_budget=10000.0)
    assert res["new_guest_count"] == 100
    assert res["cost_per_guest"] == 100.0  # 10000 / 100
    
    catering = next(i for i in res["items"] if i["category"] == "Catering & Bar")
    assert catering["allocated_amount"] == 8000.0  # Doubled
    
    venue = next(i for i in res["items"] if i["category"] == "Venue Rental")
    assert venue["allocated_amount"] == 6000.0  # Fixed

def test_reschedule_event_dates_and_overdue():
    today = date(2026, 10, 25)
    old_event_date = "2026-11-25"
    tasks = [
        {"id": 1, "title": "Book Venue", "due_date": "2026-10-25", "days_before_event": 31, "status": "pending"},
        {"id": 2, "title": "Send Invites", "due_date": "2026-11-05", "days_before_event": 20, "status": "completed"}
    ]
    
    # Reschedule event to earlier date: 2026-11-15 (10 days earlier)
    new_event_date = "2026-11-15"
    updated = reschedule_event_dates(tasks, old_event_date, new_event_date, reference_today=today)
    
    # Task 1 was due 31 days before event: 2026-11-15 - 31 days = 2026-10-15
    task1 = next(t for t in updated if t["id"] == 1)
    assert task1["due_date"] == "2026-10-15"
    # Due date is in the past and pending -> is_overdue must be True
    assert task1["is_overdue"] is True
    
    # Task 2 is completed -> is_overdue must be False even if past
    task2 = next(t for t in updated if t["id"] == 2)
    assert task2["is_overdue"] is False
