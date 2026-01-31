# CareFusion AI - Server Handshake Controller
$BACKEND_DIR = "C:\CareFusion-AI\carefusion_v2\backend"
$SUBDOMAIN = "clinical-vault-bridge-2026"
$PORT = 5001

Write-Host "Initializing CareFusion AI Clinical Server..." -ForegroundColor Cyan

# Start Backend
Write-Host "Starting Backend Node Service on port $PORT..." -ForegroundColor Yellow
Start-Process cmd.exe -ArgumentList "/k npm run dev" -WorkingDirectory $BACKEND_DIR

# Wait
Start-Sleep -Seconds 5

# Find ngrok executable
$NGROK = "ngrok"
if (!(Get-Command $NGROK -ErrorAction SilentlyContinue)) {
    $PATHS = @(
        "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\Ngrok.Ngrok_Microsoft.Winet.Source_8wekyb3d8bbwe\ngrok.exe",
        "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\Ngrok.Ngrok_Microsoft.Winget.Source_8wekyb3d8bbwe\ngrok.exe"
    )
    foreach ($P in $PATHS) {
        if (Test-Path $P) {
            $NGROK = $P
            break
        }
    }
}

# 2. Start Ngrok Tunnel (High Reliability)
Write-Host "Establishing Professional Clinical Bridge via Ngrok..." -ForegroundColor Cyan
Write-Host "NOTE: Look for the URL ending in '.ngrok-free.app' in the new window." -ForegroundColor Green
Start-Process cmd.exe -ArgumentList "/k `"$NGROK`" http $PORT" -WorkingDirectory $BACKEND_DIR

Write-Host "Server processes launched in separate windows." -ForegroundColor Green
Write-Host "1. Find your '.ngrok-free.app' URL in the Ngrok window." -ForegroundColor Cyan
Write-Host "2. Copy that URL into your Browser / Vercel Clinical Bridge setting." -ForegroundColor Cyan
Write-Host "Keep these windows open to maintain the clinical tunnel." -ForegroundColor Red
