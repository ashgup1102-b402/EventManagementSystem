@echo off
setlocal

echo ==========================================
echo Event Management System - Local Launcher
echo ==========================================

:: Check if Node.js is installed
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install it from https://nodejs.org/
    pause
    exit /b
)

echo [INFO] Killing any existing processes on ports 5000 and 5173...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173') do taskkill /f /pid %%a >nul 2>&1

echo.
echo [1/2] Starting Backend Server (Port 5000)...
cd backend
:: Check if node_modules exists
if not exist node_modules (
    echo [INFO] Installing backend dependencies...
    call npm.cmd install
)
start "EMS-Backend" cmd /c "npm.cmd run dev"

echo [2/2] Starting Frontend Server (Port 5173)...
cd ..\frontend
:: Check if node_modules exists
if not exist node_modules (
    echo [INFO] Installing frontend dependencies...
    call npm.cmd install
)
start "EMS-Frontend" cmd /c "npm.cmd run dev"

echo.
echo ==========================================
echo Servers are initializing in separate windows.
echo Please wait a few seconds...
echo ==========================================
timeout /t 8

echo [INFO] Opening the application in your browser...
start http://localhost:5173

echo.
echo troubleshooting Tips:
echo 1. Check the "EMS-Backend" window for database connection errors.
echo 2. Check the "EMS-Frontend" window for compilation errors.
echo 3. Ensure your PostgreSQL database is running on port 5432.
echo.
echo You can keep this window open or close it.
pause
