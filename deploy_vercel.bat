@echo off
TITLE Deploy AI Smart Metrology Inspector to Vercel
color 0B
echo ===============================================================================
echo       DEPLOYING TO VERCEL: AI-Smart-Metrology-Inspector (PCR 2011)
echo ===============================================================================
echo.
cd /d "%~dp0"
echo [1/2] Building frontend bundle...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Frontend build failed.
    pause
    exit /b 1
)
cd ..

echo.
echo [2/2] Deploying to Vercel Production...
call npx -y vercel deploy --prod
echo.
if %errorlevel% equ 0 (
    echo ===============================================================================
    echo  [SUCCESS] Project successfully deployed to Vercel!
    echo ===============================================================================
) else (
    echo [NOTICE] If prompted to log in, please follow the browser prompt to authorize Vercel.
)
echo.
pause
