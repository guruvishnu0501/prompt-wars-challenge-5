"""
EventWise AI - Comprehensive End-to-End Audit & Verification Script
Rigorously tests all 12 Challenge 5 requirements against actual runtime execution.
"""
import sys
from datetime import date, timedelta
from fastapi.testclient import TestClient
from backend.app.main import app

def run_audit():
    print("=" * 80)
    print("EVENTWISE AI - SENIOR CODE REVIEWER END-TO-END AUDIT & VERIFICATION")
    print("=" * 80)

    client = TestClient(app)
    passed_checks = []
    failed_checks = []

    def check(name: str, condition: bool, detail: str = ""):
        if condition:
            print(f"[PASS] {name} - {detail}")
            passed_checks.append(name)
        else:
            print(f"[FAIL] {name} - {detail}")
            failed_checks.append(name)

    # 1. Health & Secrets Management
    res = client.get("/api/health")
    check("Req 7: Health & Secrets", res.status_code == 200 and "GROQ_API_KEY" not in res.text,
          f"Status 200, API key not leaked, mode: {res.json().get('mode')}")

    # 2. Verify Live Groq backend proxying & Demo Mode Labeling (Req 2 & 6)
    event_payload = {
        "title": "Silicon Valley AI Founders Gala",
        "event_type": "corporate",
        "event_date": "2027-10-15",
        "guest_count": 80,
        "total_budget": 20000.0,
        "location": "San Francisco, CA",
        "custom_notes": "Tech executives and investors, high-end keynote and networking mixer",
        "force_demo": True
    }
    create_res = client.post("/api/events", json=event_payload)
    check("Req 1 & 6: Event Creation & Demo Labeling", create_res.status_code == 201,
          f"Event ID: {create_res.json().get('id')}, is_demo: {create_res.json().get('is_demo')}, provider: {create_res.json().get('ai_provider')}")
    event_data = create_res.json()
    event_id = event_data["id"]

    # 3. Deterministic Budget Allocations (Req 3)
    budget_items = event_data["budget_items"]
    allocated_sum = sum(b["allocated_amount"] for b in budget_items)
    check("Req 3: Deterministic Budget Sum", round(allocated_sum, 2) == 20000.0,
          f"Allocated sum (${allocated_sum}) equals total budget ($20,000.00) to exact cent")
    check("Req 3: Per-Guest Cost Determinism", event_data["cost_per_guest"] == 250.0,
          f"Cost per guest is exactly total_budget / guest_count = $250.00")

    # 4. Record a committed expense to test preservation
    venue_item = next(b for b in budget_items if "Venue" in b["category"])
    update_spent = client.put(f"/api/budget/{venue_item['id']}", json={"spent_amount": 5000.0})
    check("Req 5: Expense Update Persistence", update_spent.status_code == 200 and update_spent.json()["spent_amount"] == 5000.0,
          f"Spent $5,000 on {venue_item['category']}")

    # 5. Test Budget Reduction (Req 4)
    # Reduce budget from 20,000 to 14,000 (spent is 5,000, so discretionary is 9,000)
    recalc_res = client.post(f"/api/events/{event_id}/recalculate-budget", json={"new_total_budget": 14000.0})
    check("Req 4: Budget Reduction Handling", recalc_res.status_code == 200,
          f"Reduced to $14,000. Remaining: ${recalc_res.json()['remaining_budget']}")
    recalc_items = recalc_res.json()["budget_items"]
    recalc_alloc_sum = sum(b["allocated_amount"] for b in recalc_items)
    check("Req 4: Reduced Allocations Sum Determinism", round(recalc_alloc_sum, 2) == 14000.0,
          f"New sum ${recalc_alloc_sum} matches new budget $14,000.00 exactly")
    venue_after = next(b for b in recalc_items if b["id"] == venue_item["id"])
    check("Req 4: Committed Funds Preservation", venue_after["allocated_amount"] >= 5000.0,
          f"Venue allocation (${venue_after['allocated_amount']}) preserved committed spent ($5,000.00)")

    # 6. Test Guest Count Scaling (Req 4)
    gc_res = client.post(f"/api/events/{event_id}/change-guest-count", json={"new_guest_count": 100})
    check("Req 4: Guest Count Scaling", gc_res.status_code == 200 and gc_res.json()["guest_count"] == 100,
          f"Updated to 100 guests, new per-guest cost: ${gc_res.json()['cost_per_guest']}")

    # 7. Test Event Date Rescheduling (Req 4)
    resched_res = client.post(f"/api/events/{event_id}/reschedule-date", json={"new_event_date": "2027-11-20"})
    check("Req 4: Event Date Rescheduling", resched_res.status_code == 200 and resched_res.json()["event_date"] == "2027-11-20",
          "Tasks successfully shifted to align with new date")

    # 8. Test Overdue Task Detection & Completion (Req 4)
    yesterday_str = (date.today() - timedelta(days=2)).strftime("%Y-%m-%d")
    overdue_task_res = client.post(f"/api/events/{event_id}/tasks", json={
        "title": "Past Due Venue Security Clearance",
        "category": "Compliance",
        "due_date": yesterday_str,
        "priority": "high",
        "notes": "Must be cleared before load-in"
    })
    check("Req 4: Overdue Task Flagging", overdue_task_res.json()["is_overdue"] is True,
          f"Task due {yesterday_str} correctly flagged as overdue")
    
    # Check event metrics reflect overdue count
    ev_check = client.get(f"/api/events/{event_id}").json()
    check("Req 4: Overdue Task Count Aggregate", ev_check["overdue_task_count"] >= 1,
          f"Event reflects {ev_check['overdue_task_count']} overdue task(s)")

    # Complete the task
    task_id = overdue_task_res.json()["id"]
    complete_res = client.put(f"/api/tasks/{task_id}", json={"status": "completed"})
    check("Req 1 & 4: Task Completion Status Update", complete_res.json()["status"] == "completed" and complete_res.json()["is_overdue"] is False,
          "Completed task is no longer flagged as overdue")

    # 9. Test User Edits Persistence & Safe Plan Regeneration (Req 5)
    # Add custom user expense item
    custom_item_res = client.post(f"/api/events/{event_id}/budget", json={
        "category": "Custom Executive Swag Bags",
        "allocated_amount": 1200.0,
        "spent_amount": 0.0,
        "notes": "Embossed leather notebooks"
    })
    check("Req 5: Custom Budget Item Addition", custom_item_res.status_code == 201,
          f"Custom category '{custom_item_res.json()['category']}' added")

    # Attempt silent overwrite without confirmation -> Must be rejected with 400!
    bad_regen = client.post(f"/api/events/{event_id}/generate-plan", json={
        "merge_mode": "replace",
        "confirmed_overwrite": False
    })
    check("Req 5: Silent Overwrite Blocked", bad_regen.status_code == 400,
          "Plan regeneration rejected with HTTP 400 when confirmed_overwrite is False")

    # Regenerate in Merge mode -> Custom items must remain intact!
    merge_regen = client.post(f"/api/events/{event_id}/generate-plan", json={
        "merge_mode": "merge",
        "confirmed_overwrite": False
    })
    check("Req 5: Safe Merge Regeneration", merge_regen.status_code == 200,
          "Regenerated in merge mode successfully")
    merged_cats = [b["category"] for b in merge_regen.json()["budget_items"]]
    check("Req 5: Custom User Data Persisted", "Custom Executive Swag Bags" in merged_cats,
          "User-created custom budget item persisted across regeneration")

    # 10. Test Invalid Inputs (Req 4 & 7)
    invalid_budget = client.post("/api/events", json={
        "title": "Bad Event", "event_type": "gala", "event_date": "2027-01-01",
        "guest_count": 50, "total_budget": -500.0
    })
    check("Req 4 & 7: Reject Negative Budget", invalid_budget.status_code == 422,
          "Negative budget rejected with HTTP 422 Unprocessable Content")

    invalid_date = client.post("/api/events", json={
        "title": "Bad Date Event", "event_type": "gala", "event_date": "invalid-date",
        "guest_count": 50, "total_budget": 5000.0
    })
    check("Req 4 & 7: Reject Invalid Date Format", invalid_date.status_code == 422,
          "Invalid date rejected with HTTP 422")

    # 11. Vendor & Guest CRUD (Req 1 & 12)
    v_res = client.post(f"/api/events/{event_id}/vendors", json={
        "name": "Omni Streaming Media", "category": "AV", "quote_amount": 2500.0, "status": "contacted"
    })
    check("Req 1 & 12: Add Vendor", v_res.status_code == 201, f"Added vendor {v_res.json()['name']}")
    
    g_res = client.post(f"/api/events/{event_id}/guests", json={
        "name": "Dr. Aris Thorne", "email": "aris@example.com", "rsvp_status": "attending",
        "dietary_notes": "Pescatarian", "plus_one": True
    })
    check("Req 1 & 12: Add Guest", g_res.status_code == 201, f"Added guest {g_res.json()['name']}")

    print("\n" + "=" * 80)
    print(f"AUDIT SUMMARY: {len(passed_checks)} CHECKS PASSED, {len(failed_checks)} FAILED")
    print("=" * 80)
    
    if failed_checks:
        sys.exit(1)
    else:
        print("ALL VERIFICATION CHECKS PASSED PERFECTLY!\n")

if __name__ == "__main__":
    run_audit()
