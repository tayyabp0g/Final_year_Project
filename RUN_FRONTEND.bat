@echo off
title Frontend - AutoSRS.ai
color 0A
cls

echo ==============================================
echo   Frontend Server - AutoSRS.ai
echo ==============================================
echo.

REM Go to project root (folder where this .bat exists)
cd /d "%~dp0"

echo Starting Frontend Server...
echo URL: http://localhost:3000
echo.

npm run dev

pause

