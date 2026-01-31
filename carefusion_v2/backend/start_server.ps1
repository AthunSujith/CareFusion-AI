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

# Find cloudflared executable
$CLOUDFLARED = "cloudflared"
if (!(Get-Command $CLOUDFLARED -ErrorAction SilentlyContinue)) {
    $PATHS = @(
        "C:\Program Files (x86)\cloudflared\cloudflared.exe",
        "C:\Program Files\cloudflared\cloudflared.exe",
        "$BACKEND_DIR\bin\cloudflared.exe"
    )
    foreach ($P in $PATHS) {
        if (Test-Path $P) {
            $CLOUDFLARED = $P
            break
        }
    }
}

# 2. Start Cloudflare Tunnel (Standard for Medical Apps)
Write-Host "Establishing Professional Clinical Bridge via Cloudflare..." -ForegroundColor Cyan
Write-Host "NOTE: Look for the URL ending in '.trycloudflare.com' in the new window." -ForegroundColor Green
Start-Process cmd.exe -ArgumentList "/k `"$CLOUDFLARED`" tunnel --url http://127.0.0.1:$PORT" -WorkingDirectory $BACKEND_DIR

Write-Host "Server processes launched in separate windows." -ForegroundColor Green
Write-Host "1. Find your '.trycloudflare.com' URL in the Cloudflared window." -ForegroundColor Cyan
Write-Host "2. Copy that URL into your Browser / Vercel Clinical Bridge setting." -ForegroundColor Cyan
Write-Host "Keep these windows open to maintain the clinical tunnel." -ForegroundColor Red
