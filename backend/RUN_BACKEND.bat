@echo off
title Backend - AutoSRS.ai
color 0A
cls

echo ==============================================
echo   Backend Server - AutoSRS.ai
echo ==============================================
echo.

REM Go to backend folder (folder where this .bat exists)
cd /d "%~dp0"

REM Ensure backend .env exists
if not exist ".env" (
  echo.
  echo [WARN] backend\.env not found. Creating it from .env.example...
  copy /Y ".env.example" ".env" >nul
  echo [ACTION] Please open backend\.env and set DB_PASSWORD, then re-run this file.
  echo.
  pause
  exit /b 1
)

echo Starting Backend Server...
echo API URL:  http://localhost:5000
echo API Docs: http://localhost:5000/api
echo.

npm start

pause
