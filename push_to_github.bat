@echo off
TITLE AI Smart Metrology Inspector - GitHub Push Manager
color 0B

:MENU
cls
echo ===============================================================================
echo        AI SMART METROLOGY INSPECTOR - GITHUB PUSH & TOKEN MANAGER
echo ===============================================================================
echo Repository: https://github.com/himanshuk91014-spec/AI-Smart-Metrology-Inspector
echo.
echo [1] Push to GitHub directly (Standard Push)
echo [2] Configure GitHub Personal Access Token (PAT) and Push
echo [3] Generate / View Instructions for GitHub Token
echo [4] Reset Remote URL to Standard HTTPS (Remove saved token)
echo [5] Exit
echo ===============================================================================
echo.
set /p choice="Choose an option (1-5): "

if "%choice%"=="1" goto DIRECT_PUSH
if "%choice%"=="2" goto TOKEN_PUSH
if "%choice%"=="3" goto TOKEN_HELP
if "%choice%"=="4" goto RESET_REMOTE
if "%choice%"=="5" goto EXIT_SCRIPT
goto MENU

:DIRECT_PUSH
echo.
echo ===============================================================================
echo  [1/3] Checking Git Status and Staging Modified Files...
echo ===============================================================================
cd /d "%~dp0"
git add .
git commit -m "update: metrology compliance engine updates & configurations" >nul 2>&1

echo [2/3] Pushing to GitHub (origin main)...
git push -u origin main
if %errorlevel% equ 0 (
    goto SUCCESS
) else (
    echo.
    echo -------------------------------------------------------------------------------
    echo [ERROR] Git push failed or authentication was rejected.
    echo If GitHub asks for a password, note that GitHub requires a Personal Access Token (PAT).
    echo -------------------------------------------------------------------------------
    echo.
    pause
    goto MENU
)

:TOKEN_PUSH
cls
echo ===============================================================================
echo          CONFIGURE GITHUB PERSONAL ACCESS TOKEN (PAT)
echo ===============================================================================
echo.
echo Please paste your GitHub Personal Access Token below (starts with ghp_ or github_pat_):
echo (Right-click or press Ctrl+V to paste)
echo.
set /p GITHUB_TOKEN="GitHub Token: "

if "%GITHUB_TOKEN%"=="" (
    echo [ERROR] Token cannot be empty.
    pause
    goto MENU
)

echo.
echo [1/3] Updating Git Remote with Access Token...
git remote set-url origin https://%GITHUB_TOKEN%@github.com/himanshuk91014-spec/AI-Smart-Metrology-Inspector.git

echo [2/3] Staging and Committing Latest Workspace Files...
git add .
git commit -m "feat: AI Smart Legal Metrology Inspector & Compliance System" >nul 2>&1

echo [3/3] Pushing to https://github.com/himanshuk91014-spec/AI-Smart-Metrology-Inspector.git...
git push -u origin main --force

if %errorlevel% equ 0 (
    goto SUCCESS
) else (
    echo.
    echo ===============================================================================
    echo [ERROR] Authentication failed. Please make sure:
    echo 1. Your token is valid and not expired.
    echo 2. Token has 'repo' (Full control of private/public repositories) permissions.
    echo ===============================================================================
    pause
    goto MENU
)

:RESET_REMOTE
echo.
echo Resetting Git Remote to: https://github.com/himanshuk91014-spec/AI-Smart-Metrology-Inspector.git
git remote set-url origin https://github.com/himanshuk91014-spec/AI-Smart-Metrology-Inspector.git
echo Remote reset successfully.
pause
goto MENU

:TOKEN_HELP
cls
echo ===============================================================================
echo           HOW TO CREATE A GITHUB PERSONAL ACCESS TOKEN (PAT)
echo ===============================================================================
echo.
echo 1. Log in to GitHub (https://github.com)
echo 2. Go to: Settings -> Developer settings -> Personal access tokens -> Tokens (classic)
echo    OR visit directly: https://github.com/settings/tokens
echo 3. Click 'Generate new token' -> 'Generate new token (classic)'
echo 4. Set Note name (e.g. 'SIH-Metrology-Inspector')
echo 5. Under Select scopes, check:
echo    [X] 'repo'  (Full control of private repositories)
echo 6. Click 'Generate token' at bottom of page.
echo 7. Copy the token (it starts with 'ghp_...').
echo.
set /p OPEN_BROWSER="Do you want to open the GitHub Token page now in your browser? (y/n): "
if /i "%OPEN_BROWSER%"=="y" (
    start https://github.com/settings/tokens/new?scopes=repo&description=SIH-Metrology-Inspector
)
pause
goto MENU

:SUCCESS
color 0A
echo.
echo ===============================================================================
echo  [SUCCESS] Code successfully pushed to GitHub!
echo  URL: https://github.com/himanshuk91014-spec/AI-Smart-Metrology-Inspector
echo ===============================================================================
echo.
pause
exit /b 0

:EXIT_SCRIPT
exit /b 0
