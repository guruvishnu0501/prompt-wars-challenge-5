from datetime import datetime, date, timedelta
from typing import List, Dict, Any, Optional

def parse_date(date_str: str) -> date:
    try:
        return datetime.strptime(date_str.strip(), "%Y-%m-%d").date()
    except Exception as e:
        raise ValueError(f"Invalid date format '{date_str}'. Expected YYYY-MM-DD.") from e

def format_date(d: date) -> str:
    return d.strftime("%Y-%m-%d")

# Default budget allocation percentages by event type
DEFAULT_PERCENTAGES: Dict[str, Dict[str, float]] = {
    "wedding": {
        "Venue & Rentals": 0.35,
        "Catering & Bar": 0.28,
        "Photography & Video": 0.12,
        "Music & Entertainment": 0.08,
        "Decor & Flowers": 0.08,
        "Invitations & Favors": 0.04,
        "Contingency / Buffer": 0.05
    },
    "corporate": {
        "Venue & AV Equipment": 0.40,
        "Catering & Beverages": 0.30,
        "Keynote & Speakers": 0.12,
        "Marketing & Signage": 0.08,
        "Staffing & Logistics": 0.05,
        "Contingency / Buffer": 0.05
    },
    "birthday": {
        "Venue & Decoration": 0.30,
        "Food & Cake": 0.35,
        "Entertainment & Activities": 0.15,
        "Photography": 0.10,
        "Party Favors & Invites": 0.05,
        "Contingency / Buffer": 0.05
    },
    "default": {
        "Venue & Facilities": 0.35,
        "Food & Beverages": 0.30,
        "Entertainment & Media": 0.15,
        "Decor & Ambiance": 0.10,
        "Logistics & Favors": 0.05,
        "Contingency / Buffer": 0.05
    }
}

VARIABLE_CATEGORIES = {
    "catering & bar",
    "food & beverages",
    "food & cake",
    "invitations & favors",
    "party favors & invites",
    "logistics & favors"
}

def is_category_variable(category_name: str) -> bool:
    return category_name.strip().lower() in VARIABLE_CATEGORIES

def validate_and_normalize_budget(
    total_budget: float,
    raw_allocations: Optional[List[Dict[str, Any]]] = None,
    event_type: str = "default"
) -> List[Dict[str, Any]]:
    """
    Validates and deterministically normalizes budget allocations to sum EXACTLY to total_budget.
    Rounds each category to 2 decimal places and places any cent rounding remainder into the largest category.
    """
    if total_budget <= 0:
        raise ValueError("Total budget must be a positive number greater than 0.")

    lookup_type = event_type.lower()
    default_pcts = DEFAULT_PERCENTAGES.get(lookup_type, DEFAULT_PERCENTAGES["default"])

    if not raw_allocations:
        raw_allocations = [
            {"category": cat, "percentage": pct}
            for cat, pct in default_pcts.items()
        ]

    # Calculate raw allocations
    total_raw_pct = sum(item.get("percentage", 0.0) for item in raw_allocations)
    if total_raw_pct <= 0:
        # Fall back to equal split
        count = len(raw_allocations) or 1
        for item in raw_allocations:
            item["percentage"] = 1.0 / count
        total_raw_pct = 1.0

    normalized_items = []
    running_allocated = 0.0

    for item in raw_allocations:
        cat = item.get("category", "Uncategorized").strip()
        raw_pct = float(item.get("percentage", 0.0))
        normalized_pct = raw_pct / total_raw_pct
        allocated = round(total_budget * normalized_pct, 2)
        running_allocated += allocated
        
        normalized_items.append({
            "category": cat,
            "percentage": round(normalized_pct * 100, 2),
            "allocated_amount": allocated,
            "spent_amount": round(float(item.get("spent_amount", 0.0)), 2),
            "is_variable_guest": is_category_variable(cat),
            "notes": item.get("notes", "")
        })

    # Fix exact penny rounding difference
    discrepancy = round(total_budget - running_allocated, 2)
    if discrepancy != 0.0 and normalized_items:
        # Add discrepancy to the item with largest allocation
        largest_item = max(normalized_items, key=lambda x: x["allocated_amount"])
        largest_item["allocated_amount"] = round(largest_item["allocated_amount"] + discrepancy, 2)
        # Recalculate percentage
        largest_item["percentage"] = round((largest_item["allocated_amount"] / total_budget) * 100, 2)

    return normalized_items

def recalculate_budget_reduction(
    current_items: List[Dict[str, Any]],
    new_total_budget: float
) -> Dict[str, Any]:
    """
    Deterministically handles budget reduction or change:
    - Never reduces category below already spent amount.
    - Warns if total committed spent > new_total_budget.
    - Proportionally scales discretionary (allocated - spent) amounts to match new total budget.
    """
    if new_total_budget <= 0:
        raise ValueError("New total budget must be a positive number greater than 0.")

    total_spent = round(sum(item.get("spent_amount", 0.0) for item in current_items), 2)
    warning = None
    is_deficit = False

    if total_spent > new_total_budget:
        is_deficit = True
        deficit_amount = round(total_spent - new_total_budget, 2)
        warning = (
            f"Budget Deficit Warning: Total spent ({total_spent}) exceeds new budget "
            f"({new_total_budget}) by {deficit_amount}. All unspent allocations set to 0."
        )
        updated_items = []
        for item in current_items:
            spent = round(item.get("spent_amount", 0.0), 2)
            updated_items.append({
                **item,
                "allocated_amount": spent,
                "percentage": round((spent / total_spent) * 100, 2) if total_spent > 0 else 0.0
            })
        return {
            "items": updated_items,
            "total_budget": new_total_budget,
            "total_spent": total_spent,
            "total_allocated": total_spent,
            "remaining_budget": round(new_total_budget - total_spent, 2),
            "warning": warning,
            "is_deficit": is_deficit
        }

    # Available discretionary funds to distribute
    discretionary_fund = round(new_total_budget - total_spent, 2)
    current_unspent_total = sum(
        max(0.0, item.get("allocated_amount", 0.0) - item.get("spent_amount", 0.0))
        for item in current_items
    )

    updated_items = []
    running_allocated = 0.0

    for item in current_items:
        spent = round(float(item.get("spent_amount", 0.0)), 2)
        allocated = round(float(item.get("allocated_amount", 0.0)), 2)
        unspent = max(0.0, allocated - spent)

        if current_unspent_total > 0:
            scale_ratio = unspent / current_unspent_total
            new_unspent = round(discretionary_fund * scale_ratio, 2)
        else:
            new_unspent = round(discretionary_fund / len(current_items), 2)

        new_allocated = round(spent + new_unspent, 2)
        running_allocated += new_allocated

        updated_items.append({
            **item,
            "allocated_amount": new_allocated,
            "spent_amount": spent,
            "percentage": round((new_allocated / new_total_budget) * 100, 2)
        })

    # Adjust rounding discrepancy to match new_total_budget
    discrepancy = round(new_total_budget - running_allocated, 2)
    if discrepancy != 0.0 and updated_items:
        largest_item = max(updated_items, key=lambda x: x["allocated_amount"])
        largest_item["allocated_amount"] = round(largest_item["allocated_amount"] + discrepancy, 2)
        largest_item["percentage"] = round((largest_item["allocated_amount"] / new_total_budget) * 100, 2)

    return {
        "items": updated_items,
        "total_budget": new_total_budget,
        "total_spent": total_spent,
        "total_allocated": round(sum(x["allocated_amount"] for x in updated_items), 2),
        "remaining_budget": round(new_total_budget - total_spent, 2),
        "warning": warning,
        "is_deficit": is_deficit
    }

def recalculate_guest_count_change(
    current_items: List[Dict[str, Any]],
    old_guest_count: int,
    new_guest_count: int,
    total_budget: float
) -> Dict[str, Any]:
    """
    Adjusts variable per-guest budget items when guest count changes.
    Calculates cost per guest deterministically.
    """
    if new_guest_count <= 0:
        raise ValueError("Guest count must be at least 1.")
    if old_guest_count <= 0:
        old_guest_count = new_guest_count

    ratio = new_guest_count / old_guest_count
    updated_items = []
    
    for item in current_items:
        allocated = float(item.get("allocated_amount", 0.0))
        is_var = item.get("is_variable_guest", False) or is_category_variable(item.get("category", ""))
        
        if is_var:
            # Scale variable item
            new_allocated = round(allocated * ratio, 2)
        else:
            new_allocated = allocated
            
        updated_items.append({
            **item,
            "allocated_amount": new_allocated,
            "is_variable_guest": is_var,
            "percentage": round((new_allocated / total_budget) * 100, 2) if total_budget > 0 else 0.0
        })

    total_allocated = round(sum(x["allocated_amount"] for x in updated_items), 2)
    cost_per_guest = round(total_budget / new_guest_count, 2)
    variable_cost_per_guest = round(
        sum(x["allocated_amount"] for x in updated_items if x["is_variable_guest"]) / new_guest_count,
        2
    )

    return {
        "items": updated_items,
        "old_guest_count": old_guest_count,
        "new_guest_count": new_guest_count,
        "total_budget": total_budget,
        "total_allocated": total_allocated,
        "cost_per_guest": cost_per_guest,
        "variable_cost_per_guest": variable_cost_per_guest,
        "budget_variance": round(total_budget - total_allocated, 2)
    }

def reschedule_event_dates(
    tasks: List[Dict[str, Any]],
    old_event_date_str: str,
    new_event_date_str: str,
    reference_today: Optional[date] = None
) -> List[Dict[str, Any]]:
    """
    Deterministically shifts milestone deadlines when the event date moves.
    Flags overdue tasks based on reference_today.
    """
    old_event_date = parse_date(old_event_date_str)
    new_event_date = parse_date(new_event_date_str)
    today = reference_today or date.today()

    updated_tasks = []
    for task in tasks:
        # Determine days before event
        days_before = task.get("days_before_event")
        if days_before is None:
            # Compute from task due date relative to old event date
            task_due = parse_date(task.get("due_date", old_event_date_str))
            days_before = (old_event_date - task_due).days

        # New task due date
        new_due_date = new_event_date - timedelta(days=days_before)
        new_due_str = format_date(new_due_date)
        is_completed = task.get("status") == "completed"
        is_overdue = (new_due_date < today) and (not is_completed)

        updated_tasks.append({
            **task,
            "due_date": new_due_str,
            "days_before_event": days_before,
            "is_overdue": is_overdue,
            "days_until_due": (new_due_date - today).days
        })

    return updated_tasks

def annotate_tasks_with_overdue(
    tasks: List[Dict[str, Any]],
    reference_today: Optional[date] = None
) -> List[Dict[str, Any]]:
    """
    Annotates existing tasks with overdue flags and days remaining.
    """
    today = reference_today or date.today()
    annotated = []
    for task in tasks:
        try:
            task_due = parse_date(task["due_date"])
            is_completed = task.get("status") == "completed"
            is_overdue = (task_due < today) and (not is_completed)
            days_left = (task_due - today).days
        except Exception:
            is_overdue = False
            days_left = 0

        annotated.append({
            **task,
            "is_overdue": is_overdue,
            "days_until_due": days_left
        })
    return annotated
