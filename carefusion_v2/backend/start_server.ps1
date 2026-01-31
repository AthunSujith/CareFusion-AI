# CareFusion AI - Server Handshake Controller
$BACKEND_DIR = "C:\CareFusion-AI\carefusion_v2\backend"
$SUBDOMAIN = "clinical-vault-bridge-2026"
$PORT = 5001

# 1. Fetch LocalTunnel Password (Public IP)
$IP = "Searching..."
try {
    $IP_RESPONSE = Invoke-WebRequest -Uri "https://loca.lt/mytunnelpassword" -UseBasicParsing -TimeoutSec 5
    $IP = $IP_RESPONSE.Content.Trim()
} catch {
    $IP = "Check browser at whatsmyip.org"
}

Write-Host "Initializing CareFusion AI Clinical Server..." -ForegroundColor Cyan
Write-Host "Your LocalTunnel Password is: $IP" -ForegroundColor Green

# 2. Start Backend
Write-Host "Starting Backend Node Service on port $PORT..." -ForegroundColor Yellow
Start-Process cmd.exe -ArgumentList "/k npm run dev" -WorkingDirectory $BACKEND_DIR

# Wait for backend to warm up
Start-Sleep -Seconds 5

# 3. Start Secure Bridge (Primary: LocalTunnel)
# This provides the static URL: https://clinical-vault-bridge-2026.loca.lt
Write-Host "Establishing Primary Secure Bridge..." -ForegroundColor Yellow
Start-Process cmd.exe -ArgumentList "/k npx localtunnel --port $PORT --local-host 127.0.0.1 --subdomain $SUBDOMAIN" -WorkingDirectory $BACKEND_DIR

# 4. Optional: Start Ngrok (High Reliability Backup)
# If LocalTunnel is slow or fails, you can use Ngrok by running:
# Start-Process cmd.exe -ArgumentList "/k npx ngrok http $PORT" -WorkingDirectory $BACKEND_DIR

Write-Host "Server processes launched in separate windows." -ForegroundColor Green
Write-Host "Primary Access: https://$SUBDOMAIN.loca.lt" -ForegroundColor Cyan
Write-Host "Keep these windows open to maintain the clinical bridge." -ForegroundColor Red
