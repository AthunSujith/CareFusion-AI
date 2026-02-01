@echo off
TITLE CareFusion AI Backend Launcher
COLOR 0B

echo ==================================================
echo   CareFusion AI - FastAPI Backend and Connectivity
echo ==================================================
echo.

:: 1. Navigate to Backend
cd /d "C:\CareFusion-AI\carefusion_v2\backend"

:: 2. Activate Python Environment
echo [*] Activating Python Environment...
if exist "C:\CareFusion-AI\carefusionEV\Scripts\activate.bat" (
    call "C:\CareFusion-AI\carefusionEV\Scripts\activate.bat"
) else (
    echo [!] Warning: carefusionEV not found. Using system python.
)

:: 3. Check requirements
echo [*] Verifying dependencies...
"C:\CareFusion-AI\carefusionEV\Scripts\pip.exe" install -r requirements.txt --quiet

:: 4. Start Backend in a separate window
echo [*] Starting FastAPI Server on http://localhost:8000 ...
:: We use 0.0.0.0 to ensure tunneling works
start "CareFusion API Server" cmd /k ""C:\CareFusion-AI\carefusionEV\Scripts\uvicorn.exe" main:app --host 0.0.0.0 --port 8000 --reload"

:: 5. Handle Ngrok/Tunnel
echo.
echo [DONE] The backend is now initializing in the background.
echo.
echo IMPORTANT FOR LOCALTUNNEL USERS:
echo 1. Open your tunnel URL in a new browser tab first.
echo 2. Click the 'Click to Continue' button to bypass the reminder.
echo 3. THEN use the URL in your Vercel Dashboard.
echo.
pause
