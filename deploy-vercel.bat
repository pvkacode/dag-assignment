@echo off
echo ========================================
echo Vercel Deployment Guide
echo ========================================
echo.
echo Step 1: Login to Vercel
echo   - This will open your browser
echo   - Click "Authorize" to connect your GitHub account
echo.
pause
vercel login
echo.
echo Step 2: Deploy to Production
echo.
pause
vercel --prod
echo.
echo Deployment complete!
pause

