@echo off
REM Aswan Food Delivery - Production Deployment Script for Windows
REM This script deploys the application to Railway

echo 🚀 Starting Aswan Food Delivery Deployment...

REM Check if Railway CLI is installed
railway --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Railway CLI is not installed. Please install it first:
    echo npm install -g @railway/cli
    pause
    exit /b 1
)

REM Check if user is logged in to Railway
railway whoami >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] You are not logged in to Railway. Please login first:
    echo railway login
    pause
    exit /b 1
)

echo [INFO] Building and deploying backend...

REM Deploy backend
cd server

REM Check if .env exists
if not exist .env (
    echo [WARNING] .env file not found. Creating from example...
    copy env.example .env
    echo [WARNING] Please update .env with your actual values before deploying!
)

REM Deploy to Railway
railway up --detach

echo [SUCCESS] Backend deployed successfully!

REM Get the backend URL
for /f "tokens=*" %%i in ('railway domain') do set BACKEND_URL=%%i
echo [INFO] Backend URL: https://%BACKEND_URL%

REM Update frontend environment
cd ..\client

REM Create .env file for frontend
echo REACT_APP_API_URL=https://%BACKEND_URL%/api > .env
echo REACT_APP_ENV=production >> .env

echo [SUCCESS] Frontend environment updated!

REM Build frontend
echo [INFO] Building frontend...
call npm run build

echo [SUCCESS] Frontend built successfully!

REM Deploy frontend to Vercel (if Vercel CLI is available)
vercel --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] Deploying frontend to Vercel...
    vercel --prod
    echo [SUCCESS] Frontend deployed to Vercel!
) else (
    echo [WARNING] Vercel CLI not found. Please deploy frontend manually:
    echo 1. Install Vercel CLI: npm install -g vercel
    echo 2. Run: vercel --prod
)

echo [SUCCESS] 🎉 Deployment completed successfully!
echo [INFO] Backend: https://%BACKEND_URL%
echo [INFO] Frontend: Check Vercel dashboard for URL

echo.
echo 📋 Next steps:
echo 1. Update your domain settings in Railway
echo 2. Configure your database connection
echo 3. Set up environment variables in Railway dashboard
echo 4. Test your application
echo.
echo 🔧 Useful commands:
echo railway logs - View backend logs
echo railway status - Check deployment status
echo railway connect - Connect to database

pause

