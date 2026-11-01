import pytest
from httpx import AsyncClient, ASGITransport
from backend.app.main import app

@pytest.mark.asyncio
async def test_health_check():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "groq_configured" in data
        assert "mode" in data

@pytest.mark.asyncio
async def test_create_event_and_deterministic_budget():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        payload = {
            "title": "Summer Gala 2027",
            "event_type": "wedding",
            "event_date": "2027-08-15",
            "guest_count": 80,
            "total_budget": 12000.0,
            "currency": "USD",
            "location": "Napa Valley",
            "force_demo": True
        }
        res = await ac.post("/api/events", json=payload)
        assert res.status_code == 201
        data = res.json()
        assert data["title"] == "Summer Gala 2027"
        assert data["total_budget"] == 12000.0
        assert data["guest_count"] == 80
        assert data["cost_per_guest"] == 150.0  # 12000 / 80
        assert data["is_demo"] is True
        assert len(data["budget_items"]) > 0
        assert len(data["tasks"]) > 0

        # Verify sum of allocated budget equals total_budget
        allocated_sum = sum(b["allocated_amount"] for b in data["budget_items"])
        assert round(allocated_sum, 2) == 12000.0
        
        event_id = data["id"]
        
        # Test guest count change endpoint
        gc_res = await ac.post(f"/api/events/{event_id}/change-guest-count", json={"new_guest_count": 100})
        assert gc_res.status_code == 200
        gc_data = gc_res.json()
        assert gc_data["guest_count"] == 100
        assert gc_data["cost_per_guest"] == 120.0  # 12000 / 100

        # Test budget reduction endpoint
        br_res = await ac.post(f"/api/events/{event_id}/recalculate-budget", json={"new_total_budget": 9000.0})
        assert br_res.status_code == 200
        br_data = br_res.json()
        assert br_data["total_budget"] == 9000.0
        new_alloc_sum = sum(b["allocated_amount"] for b in br_data["budget_items"])
        assert round(new_alloc_sum, 2) == 9000.0

@pytest.mark.asyncio
async def test_invalid_inputs_validation():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Negative budget
        res1 = await ac.post("/api/events", json={
            "title": "Invalid Event",
            "event_type": "birthday",
            "event_date": "2027-01-01",
            "guest_count": 50,
            "total_budget": -100.0
        })
        assert res1.status_code == 422

        # Zero guest count
        res2 = await ac.post("/api/events", json={
            "title": "Invalid Event",
            "event_type": "birthday",
            "event_date": "2027-01-01",
            "guest_count": 0,
            "total_budget": 5000.0
        })
        assert res2.status_code == 422

        # Invalid date format
        res3 = await ac.post("/api/events", json={
            "title": "Invalid Event",
            "event_type": "birthday",
            "event_date": "15-08-2027",  # Not YYYY-MM-DD
            "guest_count": 50,
            "total_budget": 5000.0
        })
        assert res3.status_code == 422

@pytest.mark.asyncio
async def test_plan_regeneration_overwrite_protection():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Create event
        res = await ac.post("/api/events", json={
            "title": "Founder Birthday",
            "event_type": "birthday",
            "event_date": "2027-05-10",
            "guest_count": 40,
            "total_budget": 4000.0,
            "force_demo": True
        })
        event_id = res.json()["id"]

        # Add custom user task
        task_res = await ac.post(f"/api/events/{event_id}/tasks", json={
            "title": "Special Custom Family Surprise",
            "category": "Custom",
            "due_date": "2027-05-01",
            "priority": "high"
        })
        assert task_res.status_code == 201

        # Attempt to overwrite plan without confirmation -> Must fail with 400
        regen_bad = await ac.post(f"/api/events/{event_id}/generate-plan", json={
            "merge_mode": "replace",
            "confirmed_overwrite": False
        })
        assert regen_bad.status_code == 400
        assert "Overwriting the existing plan will remove custom user edits" in regen_bad.json()["detail"]

        # Regenerate with merge mode -> User custom task must still exist!
        regen_merge = await ac.post(f"/api/events/{event_id}/generate-plan", json={
            "merge_mode": "merge",
            "confirmed_overwrite": False
        })
        assert regen_merge.status_code == 200
        titles = [t["title"] for t in regen_merge.json()["tasks"]]
        assert "Special Custom Family Surprise" in titles
