@echo off
color 0A
cls

echo.
echo ══════════════════════════════════════════════════════════
echo     AutoSRS.ai - SUPER SIMPLE START
echo ══════════════════════════════════════════════════════════
echo.

REM Check admin
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ Need admin rights!
    echo.
    echo Right-click this file and select "Run as administrator"
    pause
    exit /b 1
)

echo ✓ Admin rights confirmed
echo.

REM Start MySQL
echo Starting MySQL...
net start MySQL80 >nul 2>&1
if %errorLevel% neq 0 (
    net start MySQL >nul 2>&1
    if %errorLevel% neq 0 (
        net start mysqld >nul 2>&1
    )
)
timeout /t 2 >nul
echo ✓ MySQL started
echo.

REM Setup database
echo Setting up database...
cd /d "D:\up dated Final_year_Project\backend"
mysql -u root < setup-database-simple.sql >nul 2>&1
echo ✓ Database ready
echo.

REM Install deps
if not exist "node_modules" (
    echo Installing backend packages...
    call npm install >nul 2>&1
    echo ✓ Backend ready
)

cd /d "D:\up dated Final_year_Project"
if not exist "node_modules" (
    echo Installing frontend packages...
    call npm install >nul 2>&1
    echo ✓ Frontend ready
)

echo.
echo ══════════════════════════════════════════════════════════
echo     🚀 Ready to start!
echo ══════════════════════════════════════════════════════════
echo.
echo Open TWO command prompts and run:
echo.
echo   [Terminal 1]
echo   cd backend
echo   npm start
echo.
echo   [Terminal 2]
echo   npm run dev
echo.
echo Then open: http://localhost:3000
echo.
pause
