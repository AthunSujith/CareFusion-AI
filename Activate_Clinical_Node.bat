@echo off
echo Starting CareFusion V2 Clinical Node...
cd carefusion_v2\backend
start cmd /k "npm run dev"
timeout /t 5
echo Starting Secure Tunnel...
start cmd /k "npx localtunnel --port 5000 --subdomain carefusion-v2-bridge"
echo.
echo ===================================================
echo Clinical Node is launching.
echo Handshake URL: https://carefusion-v2-bridge.loca.lt
echo ===================================================
pause
