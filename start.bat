@echo off
title ATS CV Tailor Launcher
echo ===================================================
echo     Launching AI ATS CV Tailor Ecosystem
echo ===================================================

echo [1/2] Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "ATS Tailor - Backend (FastAPI)" cmd /k "cd /d %~dp0backend && python -u run_server.py"

echo [2/2] Starting Vite Frontend on http://localhost:5173 ...
start "ATS Tailor - Frontend (Vite)" cmd /k "cd /d %~dp0frontend && npm run dev"

timeout /t 3 >nul
echo.
echo ===================================================
echo   All services launched! Opening web application...
echo ===================================================
start http://localhost:5173
pause
