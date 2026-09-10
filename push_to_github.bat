@echo off
TITLE Push AI Smart Metrology Inspector to GitHub
color 0A
echo ===============================================================================
echo          PUSHING TO GITHUB: AI-Smart-Metrology-Inspector
echo ===============================================================================
echo.
cd /d "%~dp0"
git push -u origin main --force
echo.
if %errorlevel% equ 0 (
    echo ===============================================================================
    echo  [SUCCESS] Code successfully pushed to:
    echo  https://github.com/himanshuk91014-spec/AI-Smart-Metrology-Inspector
    echo ===============================================================================
) else (
    echo [ERROR] Push encountered an issue. Please verify GitHub authentication.
)
echo.
pause
