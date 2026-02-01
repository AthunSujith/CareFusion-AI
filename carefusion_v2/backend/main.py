from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time
from app.core.config import get_settings
from app.routers import health, patients, ai
from app.core.database import connect_to_mongo, close_mongo_connection

settings = get_settings()

app = FastAPI(title=settings.APP_NAME)

# CORS - Improved for tunneling and production
# When allow_credentials=True, allow_origins cannot be ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://.*", # Allow all origins dynamically while supporting credentials
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["Authorization", "Content-Type", "bypass-tunnel-reminder", "*"],
    expose_headers=["*"],
)

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    # Handle OPTIONS pre-flight explicitly for tunnels
    if request.method == "OPTIONS":
        return JSONResponse(
            content="OK",
            status_code=200,
            headers={
                "Access-Control-Allow-Origin": request.headers.get("Origin", "*"),
                "Access-Control-Allow-Methods": "*",
                "Access-Control-Allow-Headers": "Authorization, Content-Type, bypass-tunnel-reminder, *",
                "Access-Control-Allow-Credentials": "true",
            }
        )
    
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    print(f"DEBUG: {request.method} {request.url.path} - {response.status_code} ({process_time:.4f}s)")
    return response

@app.on_event("startup")
async def startup_db_client():
    await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_db_client():
    await close_mongo_connection()

@app.get("/")
async def root():
    return {"status": "ok", "message": "CareFusion AI Node is online"}

# Include Routers
app.include_router(health.router, prefix="/api", tags=["Health"])
app.include_router(patients.router, prefix="/api/v2", tags=["Patients"])
app.include_router(ai.router, prefix="/api/v2/ai", tags=["AI"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
