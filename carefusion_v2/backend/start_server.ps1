# CareFusion AI - Server Handshake Controller
$BACKEND_DIR = "C:\CareFusion-AI\carefusion_v2\backend"
$SUBDOMAIN = "carefusion-clinical-bridge"
$PORT = 5001

Write-Host "Initializing CareFusion AI Clinical Server..." -ForegroundColor Cyan

# Start Backend
Write-Host "Starting Backend Node Service on port $PORT..." -ForegroundColor Yellow
Start-Process cmd.exe -ArgumentList "/k npm run dev" -WorkingDirectory $BACKEND_DIR

# Wait
Start-Sleep -Seconds 5

# Start LocalTunnel
Write-Host "Establishing Secure Handshake Bridge..." -ForegroundColor Yellow
Start-Process cmd.exe -ArgumentList "/k npx localtunnel --port $PORT --local-host 127.0.0.1 --subdomain $SUBDOMAIN" -WorkingDirectory $BACKEND_DIR

Write-Host "Server processes launched in separate windows." -ForegroundColor Green
Write-Host "Public Access: https://$SUBDOMAIN.loca.lt" -ForegroundColor Cyan
Write-Host "Keep those windows open to maintain the clinical bridge." -ForegroundColor Red
