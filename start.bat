@echo off
title Verity - Multimodal Document Intelligence Launcher
cls

echo ======================================================================
echo           VERITY MULTIMODAL DOCUMENT INTELLIGENCE
echo ======================================================================
echo.
echo Starting Backend API and Frontend Dev Server...
echo.

:: 1. Launch FastAPI Backend in a separate window
start "Verity Backend (Port 8000)" cmd /k "cd /d "%~dp0backend" && python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

:: 2. Launch Vite Frontend in a separate window
start "Verity Frontend (Port 5173)" cmd /k "cd /d "%~dp0frontend" && npm run dev -- --host 0.0.0.0 --port 5173"

:: 3. Give servers a brief moment to bind to ports
echo Waiting for servers to initialize...
timeout /t 3 /nobreak >nul 2>&1 || ping 127.0.0.1 -n 4 >nul

:: 4. Automatically open the default browser to the web app
echo Opening browser to http://localhost:5173 ...
start http://localhost:5173

echo.
echo ======================================================================
echo  [SUCCESS] All systems active!
echo  - Frontend Web UI:  http://localhost:5173
echo  - Backend API:     http://localhost:8000
echo  - API Swagger Docs: http://localhost:8000/docs
echo ======================================================================
echo.
echo Both servers are running in separate command windows.
echo To stop them, simply close their respective terminal windows.
echo.
pause
