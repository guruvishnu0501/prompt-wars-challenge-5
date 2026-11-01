import json
import re
import logging
from typing import Dict, Any, Optional
import httpx
from backend.app.config import settings

logger = logging.getLogger("eventwise.groq")

# High-fidelity curated demo event plans for reliable demo mode
DEMO_TEMPLATES: Dict[str, Dict[str, Any]] = {
    "wedding": {
        "theme_concept": "Celestial Romance & Ethereal Botanical Elegance",
        "color_palette": "Dusty Rose, Champagne Gold, Sage Green, Midnight Navy",
        "dress_code": "Black-Tie Optional / Garden Formal",
        "mood_description": "An enchanting, timeless celebration with candlelight, cascading florals, acoustic strings, and an unforgettable romantic atmosphere.",
        "budget_allocations": [
            {"category": "Venue & Rentals", "percentage": 0.35, "notes": "Historic manor / botanical conservatory booking and furniture rentals"},
            {"category": "Catering & Bar", "percentage": 0.28, "notes": "Plated 3-course dinner, artisanal cocktail hour, champagne toast"},
            {"category": "Photography & Video", "percentage": 0.12, "notes": "Full-day coverage, drone aerials, highlight film, digital gallery"},
            {"category": "Music & Entertainment", "percentage": 0.08, "notes": "Acoustic ceremony duo + 5-piece live dance band for reception"},
            {"category": "Decor & Flowers", "percentage": 0.08, "notes": "Floral arch, centerpieces, fairy string lighting, table runners"},
            {"category": "Invitations & Favors", "percentage": 0.04, "notes": "Embossed foil invites, personalized artisanal favors"},
            {"category": "Contingency / Buffer", "percentage": 0.05, "notes": "Emergency buffer for unforeseen logistical expenses"}
        ],
        "timeline_tasks": [
            {"title": "Secure and confirm venue & date deposit", "category": "Venue", "days_before_event": 180, "priority": "high", "notes": "Review insurance and curfew restrictions"},
            {"title": "Book headliner caterer and tasting session", "category": "Catering", "days_before_event": 120, "priority": "high", "notes": "Finalize dietary restriction options"},
            {"title": "Hire lead photographer and videographer", "category": "Media", "days_before_event": 90, "priority": "high", "notes": "Review portfolio shots and shot list"},
            {"title": "Send out formal invitations and launch RSVP portal", "category": "Guests", "days_before_event": 60, "priority": "medium", "notes": "Track dietary preferences and plus-ones"},
            {"title": "Finalize floral decor arrangements and lighting layout", "category": "Decor", "days_before_event": 30, "priority": "medium", "notes": "Confirm setup time window with venue"},
            {"title": "Finalize day-of run of show with coordinator and DJ", "category": "Coordination", "days_before_event": 14, "priority": "high", "notes": "Distribute minute-by-minute timeline"},
            {"title": "Conduct ceremony rehearsal and rehearsal dinner", "category": "Coordination", "days_before_event": 1, "priority": "high", "notes": "Walkthrough with wedding party and officiant"},
            {"title": "Event execution and on-site vendor management", "category": "Event Day", "days_before_event": 0, "priority": "high", "notes": "Lead coordinator handles vendor arrivals"}
        ],
        "schedule": [
            {"time": "15:00", "activity": "Vendor Arrival & Setup", "description": "Florist, rentals, sound engineering team arrive for prep"},
            {"time": "16:30", "activity": "Guest Arrival & Welcome Refreshments", "description": "Sparkling water and prosecco served in outer courtyard"},
            {"time": "17:00", "activity": "Ceremony Begins", "description": "Acoustic prelude, bridal processional, vow exchange"},
            {"time": "17:45", "activity": "Cocktail Hour & Photography", "description": "Passed hors d'oeuvres, signature cocktails, family portraits"},
            {"time": "19:00", "activity": "Grand Reception & Dinner Service", "description": "Welcome toasts followed by 3-course gourmet dinner"},
            {"time": "20:30", "activity": "First Dance & Dance Floor Opens", "description": "Live band kicks off high-energy dance sets"},
            {"time": "22:45", "activity": "Sparkler Send-Off", "description": "Guests line path for couple's grand farewell exit"}
        ],
        "recommended_vendors": [
            {"name": "Lumina Grand Ballroom & Gardens", "category": "Venue", "notes": "Capacity 250, includes ambient lighting and suite"},
            {"name": "Epicurean Artisans Catering", "category": "Catering", "notes": "Farm-to-table seasonal menu with full bar staff"},
            {"name": "Vivid Memoir Photography & Film", "category": "Media", "notes": "Dual shooter package, drone footage included"},
            {"name": "Velvet Groove Band & DJ", "category": "Entertainment", "notes": "Covers Motown, Pop, Funk and top 40"}
        ]
    },
    "corporate": {
        "theme_concept": "Horizon 2027: Innovate, Scale & Transform",
        "color_palette": "Deep Tech Navy, Electric Cyan, Crisp White, Slate Gray",
        "dress_code": "Smart Business Casual",
        "mood_description": "Sleek, forward-thinking, and high-energy summit atmosphere engineered for impactful knowledge-sharing and high-value networking.",
        "budget_allocations": [
            {"category": "Venue & AV Equipment", "percentage": 0.40, "notes": "Conference auditorium, LED video wall, live stream mics"},
            {"category": "Catering & Beverages", "percentage": 0.30, "notes": "Continuous artisan coffee bar, networking buffet lunch, cocktail mixer"},
            {"category": "Keynote & Speakers", "percentage": 0.12, "notes": "Honorariums, executive green room hospitality, VIP transit"},
            {"category": "Marketing & Signage", "percentage": 0.08, "notes": "Digital badge printers, sponsor backdrops, wayfinding signage"},
            {"category": "Staffing & Logistics", "percentage": 0.05, "notes": "Registration ushers, technical AV engineers, security"},
            {"category": "Contingency / Buffer", "percentage": 0.05, "notes": "Emergency tech redundancy and logistics reserve"}
        ],
        "timeline_tasks": [
            {"title": "Lock summit venue and audio-visual contract", "category": "Venue", "days_before_event": 120, "priority": "high", "notes": "Ensure high-speed fiber internet dedicated line"},
            {"title": "Confirm keynote speakers and agenda tracks", "category": "Program", "days_before_event": 75, "priority": "high", "notes": "Collect bios and presentation deck specs"},
            {"title": "Launch attendee ticket portal and corporate sponsorships", "category": "Marketing", "days_before_event": 60, "priority": "high", "notes": "Early-bird ticketing campaign"},
            {"title": "Finalize catering headcount and dietary menu", "category": "Catering", "days_before_event": 21, "priority": "medium", "notes": "Include vegetarian, vegan, and gluten-free options"},
            {"title": "Full tech rehearsal and AV slide run-through", "category": "Tech", "days_before_event": 1, "priority": "high", "notes": "Test mics, clickers, confidence monitors, streaming"},
            {"title": "Summit live execution and attendee management", "category": "Event Day", "days_before_event": 0, "priority": "high", "notes": "Check-in kicks off at 08:00 AM sharp"}
        ],
        "schedule": [
            {"time": "08:00", "activity": "Registration & Networking Breakfast", "description": "Barista coffee, pastries, badge check-in"},
            {"time": "09:00", "activity": "Opening Keynote: Future Frontiers", "description": "Welcome address and keynote by industry leaders"},
            {"time": "10:30", "activity": "Breakout Strategy Workshops", "description": "Concurrent interactive sessions across 3 tracks"},
            {"time": "12:30", "activity": "Executive Networking Lunch", "description": "Gourmet buffet and structured peer roundtable discussions"},
            {"time": "14:00", "activity": "Panel Debate & Product Demos", "description": "Live tech showcases and audience Q&A via digital polling"},
            {"time": "16:30", "activity": "Closing Remarks & Awards", "description": "Wrap-up, key takeaways, and innovation recognitions"},
            {"time": "17:15", "activity": "Networking Cocktail Reception", "description": "Craft beers, wine, passed appetizers, social networking"}
        ],
        "recommended_vendors": [
            {"name": "Apex Innovation Center", "category": "Venue", "notes": "State-of-the-art keynote hall and networking mezzanine"},
            {"name": "StreamLine AV Solutions", "category": "Audio/Visual", "notes": "Multi-camera streaming setup, 4K LED wall"},
            {"name": "Gourmet Corporate Kitchen", "category": "Catering", "notes": "Specialists in high-speed, upscale buffet catering"}
        ]
    },
    "birthday": {
        "theme_concept": "Neon Glow & Retro Arcade Extravaganza",
        "color_palette": "Neon Magenta, Cyber Teal, Ultra Violet, Matte Black",
        "dress_code": "Retro Chic / Vivid Casual",
        "mood_description": "Vibrant, playful, unforgettable night filled with retro arcade games, dynamic DJ beats, signature mocktails/cocktails, and immersive neon art.",
        "budget_allocations": [
            {"category": "Venue & Decoration", "percentage": 0.30, "notes": "Lounge rental with blacklight glow decor & balloon installations"},
            {"category": "Food & Cake", "percentage": 0.35, "notes": "Interactive slider & taco bar, specialty custom birthday cake"},
            {"category": "Entertainment & Activities", "percentage": 0.15, "notes": "DJ setup, photobooth with instant 360 video and neon props"},
            {"category": "Photography", "percentage": 0.10, "notes": "Candid party photographer capturing highlights"},
            {"category": "Party Favors & Invites", "percentage": 0.05, "notes": "Custom glow wearables, souvenir retro glasses"},
            {"category": "Contingency / Buffer", "percentage": 0.05, "notes": "Buffer for additional food or extended party hours"}
        ],
        "timeline_tasks": [
            {"title": "Book private lounge or party loft", "category": "Venue", "days_before_event": 45, "priority": "high", "notes": "Confirm sound system and outside catering policy"},
            {"title": "Order custom designer centerpiece cake", "category": "Bakery", "days_before_event": 25, "priority": "high", "notes": "Confirm dietary flavors and custom toppers"},
            {"title": "Send digital invitations with RSVP tracking", "category": "Invites", "days_before_event": 21, "priority": "medium", "notes": "Remind guests of dress code theme"},
            {"title": "Hire party DJ and rent 360 photo booth", "category": "Entertainment", "days_before_event": 14, "priority": "medium", "notes": "Submit must-play and do-not-play playlist"},
            {"title": "Confirm final guest headcount and food order", "category": "Catering", "days_before_event": 5, "priority": "high", "notes": "Ensure sufficient late-night snack supplies"},
            {"title": "Party setup and host arrival", "category": "Event Day", "days_before_event": 0, "priority": "high", "notes": "Setup lighting, photo booth, and dessert table"}
        ],
        "schedule": [
            {"time": "19:00", "activity": "Doors Open & Welcome Drinks", "description": "Neon cocktail bar opens, ambient chillwave music"},
            {"time": "20:00", "activity": "Gourmet Food Stations Open", "description": "Interactive street-food style food bar"},
            {"time": "21:00", "activity": "Photobooth Madness & Party Games", "description": "360 video booth opens, social photo ops"},
            {"time": "22:00", "activity": "Cake Cutting & Birthday Toast", "description": "Celebration toast, confetti cannon, cake served"},
            {"time": "22:30", "activity": "High-Energy Dance Party", "description": "DJ cranks the tempo for an energetic dance floor"}
        ],
        "recommended_vendors": [
            {"name": "The Velvet Neon Lounge", "category": "Venue", "notes": "Built-in LED lighting and VIP lounge banquettes"},
            {"name": "Sweet Alchemy Pastry Lab", "category": "Bakery", "notes": "Sculpted neon-drip geometric birthday cakes"},
            {"name": "Pulse Interactive Entertainment", "category": "Entertainment", "notes": "DJ with 360 rotating slow-mo booth"}
        ]
    }
}

def clean_and_parse_json(raw_text: str) -> Optional[Dict[str, Any]]:
    """Strips markdown code blocks, reasoning traces, or formatting around JSON."""
    text = raw_text.strip()
    # If wrapped in ```json ... ```
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
    if match:
        text = match.group(1).strip()
    try:
        return json.loads(text)
    except Exception:
        # Try to find first { and last }
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1 and end > start:
            try:
                return json.loads(text[start:end+1])
            except Exception:
                pass
    return None

async def generate_event_plan(
    title: str,
    event_type: str,
    event_date: str,
    guest_count: int,
    total_budget: float,
    location: str = "",
    custom_notes: str = "",
    force_demo: bool = False
) -> Dict[str, Any]:
    """
    Generates an intelligent event plan.
    Calls live Groq API strictly from backend if GROQ_API_KEY is available.
    Supports candidate models (e.g. openai/gpt-oss-120b, llama-3.3-70b-versatile, qwen/qwen3.8-27b).
    If key is absent, force_demo is True, or live call fails, falls back gracefully to deterministic Demo Mode.
    Response always clearly states `is_demo`, `provider`, and `disclaimer`.
    """
    api_key = settings.GROQ_API_KEY.strip()
    can_call_groq = bool(api_key) and not force_demo

    if can_call_groq:
        prompt = f"""
You are EventWise AI, an expert event planner. Generate a comprehensive, creative, structured event plan.
Event Title: {title}
Event Type: {event_type}
Date: {event_date}
Guest Count: {guest_count}
Total Budget: ${total_budget} {location and f'at {location}'}
Notes/Preferences: {custom_notes}

Respond strictly with a valid JSON object matching this exact schema:
{{
  "theme_concept": "String",
  "color_palette": "String (e.g. Color 1, Color 2, Color 3)",
  "dress_code": "String",
  "mood_description": "String",
  "budget_allocations": [
    {{"category": "String", "percentage": 0.35, "notes": "String"}}
  ],
  "timeline_tasks": [
    {{"title": "String", "category": "String", "days_before_event": 60, "priority": "high|medium|low", "notes": "String"}}
  ],
  "schedule": [
    {{"time": "HH:MM", "activity": "String", "description": "String"}}
  ],
  "recommended_vendors": [
    {{"name": "String", "category": "String", "notes": "String"}}
  ]
}}
Do not enclose in markdown blocks, return only the raw JSON.
"""
        models_to_try = [settings.GROQ_MODEL] + [
            m for m in settings.GROQ_CANDIDATE_MODELS if m != settings.GROQ_MODEL
        ]

        async with httpx.AsyncClient(timeout=30.0) as client:
            for model_name in models_to_try:
                try:
                    logger.info("Attempting live Groq API call with model: %s", model_name)
                    res = await client.post(
                        "https://api.groq.com/openai/v1/chat/completions",
                        headers={
                            "Authorization": f"Bearer {api_key}",
                            "Content-Type": "application/json"
                        },
                        json={
                            "model": model_name,
                            "messages": [
                                {
                                    "role": "system",
                                    "content": "You are a world-class professional event planning AI. You output strictly valid JSON matching the requested schema."
                                },
                                {"role": "user", "content": prompt}
                            ],
                            "temperature": 0.7,
                            "response_format": {"type": "json_object"}
                        }
                    )

                    if res.status_code == 200:
                        data = res.json()
                        content = data["choices"][0]["message"]["content"]
                        parsed = clean_and_parse_json(content)
                        if parsed and "theme_concept" in parsed:
                            # Update active model in settings
                            settings.GROQ_MODEL = model_name
                            return {
                                **parsed,
                                "is_demo": False,
                                "provider": f"Live Groq ({model_name})",
                                "disclaimer": ""
                            }
                    elif res.status_code == 404:
                        # Model not found on this account tier; try next candidate model
                        continue
                    else:
                        logger.warning("Groq API (%s) returned status %d: %s", model_name, res.status_code, res.text)
                except Exception as e:
                    logger.error("Exception during live Groq API call with model %s: %s", model_name, str(e))

    # Demo Mode Fallback
    key_type = event_type.lower()
    matched_template = None
    for k in DEMO_TEMPLATES:
        if k in key_type:
            matched_template = DEMO_TEMPLATES[k]
            break
    if not matched_template:
        matched_template = DEMO_TEMPLATES["birthday"]

    disclaimer = (
        "Demo Mode Active (Live Groq key not configured or provider unavailable. "
        "Generated using EventWise Curated Intelligence Engine.)"
    )

    return {
        **matched_template,
        "is_demo": True,
        "provider": "EventWise Demo Engine",
        "disclaimer": disclaimer
    }
