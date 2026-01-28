@echo off
REM Request admin rights
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo.
    echo ⚠️  This script needs Administrator permissions!
    echo.
    echo Please right-click on this file and select "Run as administrator"
    echo.
    pause
    exit /b 1
)

cls
color 0A
title AutoSRS.ai - Simple Setup

echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║   🚀 AutoSRS.ai - Simple Setup & Run                   ║
echo ╚════════════════════════════════════════════════════════╝
echo.

REM Check MySQL service
echo Checking MySQL service...
sc query MySQL80 >nul 2>&1
if %errorLevel% equ 0 (
    echo ✅ MySQL80 service found
) else (
    echo ⚠️  MySQL80 service not found, trying MySQL...
    sc query MySQL >nul 2>&1
    if %errorLevel% equ 0 (
        echo ✅ MySQL service found
    ) else (
        echo ❌ MySQL service not found!
        echo.
        echo Please ensure MySQL is installed and the service is named "MySQL80" or "MySQL"
        pause
        exit /b 1
    )
)

REM Start MySQL
echo.
echo Starting MySQL service...
net start MySQL80 >nul 2>&1
if %errorLevel% neq 0 (
    net start MySQL >nul 2>&1
    if %errorLevel% neq 0 (
        net start mysqld >nul 2>&1
    )
)
if %errorLevel% equ 0 (
    echo ✅ MySQL started
) else (
    echo MySQL already running or checking...
)

timeout /t 2 >nul

REM Create database
echo.
echo Setting up database...
cd /d "D:\up dated Final_year_Project\backend"
mysql -u root -p < setup-database.sql >nul 2>&1
if %errorLevel% equ 0 (
    echo ✅ Database setup complete
) else (
    echo ⚠️  Database setup skipped (might already exist)
)

REM Check if node_modules exists
echo.
if exist "node_modules" (
    echo ✅ Backend dependencies already installed
) else (
    echo Installing backend dependencies...
    call npm install
    if %errorLevel% neq 0 (
        echo ❌ npm install failed
        pause
        exit /b 1
    )
    echo ✅ Backend dependencies installed
)

REM Check frontend dependencies
cd /d "D:\up dated Final_year_Project"
if exist "node_modules" (
    echo ✅ Frontend dependencies already installed
) else (
    echo.
    echo Installing frontend dependencies...
    call npm install
    if %errorLevel% neq 0 (
        echo ❌ npm install failed
        pause
        exit /b 1
    )
    echo ✅ Frontend dependencies installed
)

echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║            ✅ Setup Complete!                          ║
echo ╠════════════════════════════════════════════════════════╣
echo ║                                                        ║
echo ║  Now run these in TWO SEPARATE TERMINALS:             ║
echo ║                                                        ║
echo ║  Terminal 1 (Backend):                                ║
echo ║    cd backend                                         ║
echo ║    npm start                                          ║
echo ║                                                        ║
echo ║  Terminal 2 (Frontend):                               ║
echo ║    npm run dev                                        ║
echo ║                                                        ║
echo ║  Then open: http://localhost:3000                    ║
echo ║                                                        ║
echo ╚════════════════════════════════════════════════════════╝
echo.
pause
