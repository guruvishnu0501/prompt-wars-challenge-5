@echo off
title EventWise AI - Backend Server
cd /d "%~dp0"
echo Starting EventWise AI FastAPI Backend on http://127.0.0.1:8000...
.\venv\Scripts\python.exe -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
pause
