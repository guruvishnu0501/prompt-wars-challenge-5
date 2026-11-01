import time
from collections import defaultdict
from datetime import datetime
from fastapi import FastAPI, Request, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware

from backend.app.config import settings
from backend.app.database import engine, Base
from backend.app.routers import events, budget, tasks, vendors, guests

# Initialize database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="EventWise AI - Intelligent celebration and event planner with live Groq LLM integration and deterministic calculations."
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate Limiting State (Sliding Window in-memory)
REQUEST_HISTORY = defaultdict(list)

@app.middleware("http")
async def rate_limiting_middleware(request: Request, call_next):
    # Exempt health check and docs
    if request.url.path in ["/api/health", "/docs", "/openapi.json"]:
        return await call_next(request)

    client_ip = request.client.host if request.client else "unknown"
    now = time.time()
    window_start = now - 60.0

    # Clean old requests
    REQUEST_HISTORY[client_ip] = [t for t in REQUEST_HISTORY[client_ip] if t > window_start]

    if len(REQUEST_HISTORY[client_ip]) >= settings.RATE_LIMIT_PER_MINUTE:
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={
                "detail": "Rate limit exceeded. Maximum 60 requests per minute allowed.",
                "retry_after_seconds": 60,
                "timestamp": datetime.utcnow().isoformat()
            },
            headers={"Retry-After": "60"}
        )

    REQUEST_HISTORY[client_ip].append(now)
    response = await call_next(request)
    response.headers["X-RateLimit-Limit"] = str(settings.RATE_LIMIT_PER_MINUTE)
    response.headers["X-RateLimit-Remaining"] = str(max(0, settings.RATE_LIMIT_PER_MINUTE - len(REQUEST_HISTORY[client_ip])))
    return response

# Custom Exception Handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "status_code": exc.status_code,
            "detail": exc.detail,
            "timestamp": datetime.utcnow().isoformat(),
            "path": request.url.path
        }
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for err in exc.errors():
        loc = " -> ".join(str(l) for l in err.get("loc", []))
        errors.append(f"{loc}: {err.get('msg')}")
    return JSONResponse(
        status_code=422,
        content={
            "status_code": 422,
            "detail": "Validation error in request payload",
            "errors": errors,
            "timestamp": datetime.utcnow().isoformat()
        }
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "status_code": 500,
            "detail": "An internal server error occurred.",
            "error_type": type(exc).__name__,
            "timestamp": datetime.utcnow().isoformat()
        }
    )

# Routers
app.include_router(events.router)
app.include_router(budget.router)
app.include_router(tasks.router)
app.include_router(vendors.router)
app.include_router(guests.router)

@app.get("/api/health")
def health_check():
    has_groq_key = bool(settings.GROQ_API_KEY.strip())
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "groq_configured": has_groq_key,
        "groq_model": settings.GROQ_MODEL if has_groq_key else None,
        "mode": "Live Groq AI" if has_groq_key else "Demo Mode Active (No API Key Required)",
        "timestamp": datetime.utcnow().isoformat()
    }
