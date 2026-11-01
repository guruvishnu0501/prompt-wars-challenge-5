import pytest
from datetime import date, timedelta
from httpx import AsyncClient, ASGITransport
from backend.app.main import app

@pytest.mark.asyncio
async def test_vendor_and_guest_crud_and_cascade():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Create event
        res = await ac.post("/api/events", json={
            "title": "Corporate Summit 2027",
            "event_type": "corporate",
            "event_date": "2027-09-20",
            "guest_count": 120,
            "total_budget": 30000.0,
            "force_demo": True
        })
        assert res.status_code == 201
        event_id = res.json()["id"]

        # Add custom vendor
        v_res = await ac.post(f"/api/events/{event_id}/vendors", json={
            "name": "Skyline Drone Works",
            "category": "Media",
            "quote_amount": 1500.0,
            "status": "contacted",
            "notes": "4K aerial recording"
        })
        assert v_res.status_code == 201
        vendor_id = v_res.json()["id"]

        # Update vendor
        v_up = await ac.put(f"/api/vendors/{vendor_id}", json={
            "status": "booked",
            "quote_amount": 1400.0
        })
        assert v_up.status_code == 200
        assert v_up.json()["status"] == "booked"
        assert v_up.json()["quote_amount"] == 1400.0

        # Add Guest
        g_res = await ac.post(f"/api/events/{event_id}/guests", json={
            "name": "Alice Wonderland",
            "email": "alice@example.com",
            "rsvp_status": "attending",
            "dietary_notes": "Gluten-Free, Vegan",
            "plus_one": True
        })
        assert g_res.status_code == 201
        guest_id = g_res.json()["id"]

        # Update Guest RSVP
        g_up = await ac.put(f"/api/guests/{guest_id}", json={
            "rsvp_status": "declined"
        })
        assert g_up.status_code == 200
        assert g_up.json()["rsvp_status"] == "declined"

        # Delete Vendor
        v_del = await ac.delete(f"/api/vendors/{vendor_id}")
        assert v_del.status_code == 204

        # Delete Guest
        g_del = await ac.delete(f"/api/guests/{guest_id}")
        assert g_del.status_code == 204

@pytest.mark.asyncio
async def test_task_status_toggle_and_overdue_recalculation():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post("/api/events", json={
            "title": "Anniversary Dinner",
            "event_type": "birthday",
            "event_date": "2027-12-01",
            "guest_count": 25,
            "total_budget": 2000.0,
            "force_demo": True
        })
        event_id = res.json()["id"]

        # Add past task (yesterday)
        yesterday_str = (date.today() - timedelta(days=1)).strftime("%Y-%m-%d")
        t_res = await ac.post(f"/api/events/{event_id}/tasks", json={
            "title": "Confirm Reservation",
            "due_date": yesterday_str,
            "status": "pending",
            "priority": "high"
        })
        assert t_res.status_code == 201
        assert t_res.json()["is_overdue"] is True
        task_id = t_res.json()["id"]

        # Mark completed -> is_overdue should now be False
        t_up = await ac.put(f"/api/tasks/{task_id}", json={
            "status": "completed"
        })
        assert t_up.status_code == 200
        assert t_up.json()["status"] == "completed"
        assert t_up.json()["is_overdue"] is False
