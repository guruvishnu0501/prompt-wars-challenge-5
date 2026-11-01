import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        extra="allow"
    )

    APP_NAME: str = "EventWise AI"
    APP_VERSION: str = "1.0.0"
    APP_ENV: str = "development"
    DATABASE_URL: str = "sqlite:///./eventwise.db"
    
    # Live Groq API Key (never exposed to frontend)
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
    
    # Candidate models in order of priority
    GROQ_CANDIDATE_MODELS: List[str] = [
        "openai/gpt-oss-120b",
        "llama-3.3-70b-versatile",
        "llama-3.1-8b-instant",
        "qwen/qwen3.8-27b",
        "openai/gpt-oss-20b"
    ]
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*"
    ]
    
    # Rate Limiting: 60 requests per minute
    RATE_LIMIT_PER_MINUTE: int = 60

settings = Settings()
