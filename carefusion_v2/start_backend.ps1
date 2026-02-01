$BackendPath = "C:\CareFusion-AI\carefusion_v2\backend"
$EnvPath = "C:\CareFusion-AI\carefusionEV\Scripts\Activate.ps1"
$NgrokPort = 8000

Write-Host "Starting CareFusion AI Backend..." -ForegroundColor Green

# 1. Activate Environment
if (Test-Path $EnvPath) {
    Write-Host "Activating Python Environment..."
    . $EnvPath
} else {
    Write-Host "Warning: Virtual environment not found at $EnvPath" -ForegroundColor Yellow
}

# 2. Check for Requirements
Write-Host "Checking dependencies..."
pip install -r "$BackendPath\requirements.txt" | Out-Null

# 3. Start Backend
Write-Host "Starting FastAPI Server on Port $NgrokPort..."
Start-Process -FilePath "uvicorn" -ArgumentList "main:app --host 0.0.0.0 --port $NgrokPort --reload" -WorkingDirectory $BackendPath -NoNewWindow

# 4. Attempt Tunnel (Optional)
if (Get-Command "ngrok" -ErrorAction SilentlyContinue) {
    Write-Host "Starting Ngrok Tunnel..."
    Start-Process -FilePath "ngrok" -ArgumentList "http $NgrokPort" -NoNewWindow
} else {
    Write-Host "Ngrok not found in PATH. Keeping local server running." -ForegroundColor Yellow
    Write-Host "To use remote access, install Ngrok and run: ngrok http $NgrokPort"
}

Write-Host "Backend is running at http://localhost:$NgrokPort" -ForegroundColor Cyan
