import pytest
from unittest.mock import patch, AsyncMock
from backend.app.groq_service import generate_event_plan
from backend.app.config import settings

@pytest.mark.asyncio
async def test_demo_mode_without_api_key():
    # Force empty key
    with patch.object(settings, "GROQ_API_KEY", ""):
        plan = await generate_event_plan(
            title="Tech Launch 2027",
            event_type="corporate",
            event_date="2027-04-15",
            guest_count=100,
            total_budget=25000.0,
            location="San Francisco"
        )
        assert plan["is_demo"] is True
        assert plan["provider"] == "EventWise Demo Engine"
        assert "Demo Mode Active" in plan["disclaimer"]
        assert len(plan["budget_allocations"]) > 0
        assert len(plan["timeline_tasks"]) > 0
        assert len(plan["schedule"]) > 0

@pytest.mark.asyncio
async def test_groq_provider_failure_graceful_fallback():
    # Mock httpx failure (e.g. 500 error or network error)
    with patch.object(settings, "GROQ_API_KEY", "gsk_test_mock_key"):
        with patch("httpx.AsyncClient.post", side_effect=Exception("Connection timeout to api.groq.com")):
            plan = await generate_event_plan(
                title="Grand Wedding",
                event_type="wedding",
                event_date="2027-06-20",
                guest_count=150,
                total_budget=50000.0
            )
            # Must not crash, should fall back cleanly to demo mode
            assert plan["is_demo"] is True
            assert plan["provider"] == "EventWise Demo Engine"
            assert "Demo Mode Active" in plan["disclaimer"]
            assert plan["theme_concept"] != ""
