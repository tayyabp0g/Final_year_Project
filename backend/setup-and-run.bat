@echo off
echo ==========================================
echo MySQL Database Setup and Backend Start
echo ==========================================
echo.

REM Start MySQL Service
echo Starting MySQL Service...
net start MySQL80
if errorlevel 1 (
    echo MySQL is already running or failed to start
) else (
    echo MySQL started successfully
)
timeout /t 2

REM Setup Database
echo.
echo Setting up database...
echo Please enter your MySQL root password when prompted:
mysql -u root -p < setup-database.sql

echo.
echo Database setup complete!
echo.

REM Install dependencies if node_modules doesn't exist
if not exist node_modules (
    echo Installing Node dependencies...
    npm install
)

echo.
echo ==========================================
echo Starting Backend Server...
echo ==========================================
echo API will be available at: http://localhost:5000
echo.
npm start
