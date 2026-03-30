@echo off
REM ============================================
REM 🔐 Secure File Storage - Setup Script (Windows)
REM ============================================
REM This script sets up the system for local development

echo 🔐 Secure File Storage System - Setup
echo ======================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed
    echo    Download from: https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✓ Node.js version: %NODE_VERSION%

for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo ✓ NPM version: %NPM_VERSION%
echo.

REM Install dependencies
echo 📦 Installing dependencies...
call npm install

if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo ✓ Dependencies installed
echo.

REM Create directories if they don't exist
echo 📁 Creating directories...
if not exist "uploads" mkdir uploads
if not exist "metadata" mkdir metadata
if not exist "public" mkdir public

echo ✓ Directories created
echo.

REM Check if server.js exists
if not exist "server.js" (
    echo ❌ server.js not found in current directory
    pause
    exit /b 1
)

echo ✅ Setup complete!
echo.
echo 🚀 To start the server, run:
echo    npm start
echo.
echo    Then open: http://localhost:3000
echo.
echo 📝 For development with auto-reload:
echo    npm run dev
echo.
echo 📚 For more information, read:
echo    - README.md (Features ^& Usage)
echo    - ARCHITECTURE.md (Technical Details)
echo.
pause
