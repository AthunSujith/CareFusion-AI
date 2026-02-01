from fastapi import APIRouter, UploadFile, File, HTTPException, Form, Body
from app.core.config import get_settings
from app.core.database import get_db
import os
import aiofiles
from pathlib import Path
from datetime import datetime, timedelta
from typing import Optional

router = APIRouter()
settings = get_settings()

@router.post("/patients/upload")
async def upload_patient_file(
    patientId: str = Form(...),
    folderType: str = Form(...),
    file: UploadFile = File(...),
    category: Optional[str] = Form("General")
):
    try:
        if not patientId or not folderType:
            raise HTTPException(status_code=400, detail="Missing patientId or folderType")

        db = get_db()
        
        base_path = Path(settings.USER_DATA_ROOT)
        safe_folder_type = folderType.strip().replace("..", "")
        # Use category as subfolder if provided
        target_dir = base_path / patientId / category / safe_folder_type
        
        if not target_dir.exists():
            target_dir.mkdir(parents=True, exist_ok=True)
            
        file_path = target_dir / file.filename
        
        async with aiofiles.open(file_path, 'wb') as out_file:
            while content := await file.read(1024 * 1024):
                await out_file.write(content)
                
        # Register in records database too
        record = {
            "patientId": patientId,
            "doctorId": "self",
            "timestamp": datetime.utcnow().isoformat(),
            "recordType": "document",
            "category": category,
            "moduleData": {
                "filename": file.filename,
                "folderType": folderType,
                "path": str(file_path)
            }
        }
        await db.records.insert_one(record)

        return {
            "status": "success",
            "patientId": patientId,
            "category": category,
            "folderType": folderType,
            "filename": file.filename,
            "saved_path": str(file_path)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")

@router.get("/patients/{patientId}/categories")
async def get_patient_categories(patientId: str):
    db = get_db()
    categories = await db.records.distinct("category", {"patientId": patientId})
    # Ensure "General" is always there
    if "General" not in categories:
        categories.append("General")
    return {"status": "success", "categories": sorted(categories)}

# --- Handshake System ---

@router.post("/patients/handshake/register")
async def register_handshake(
    patientId: str = Body(..., embed=True),
    code: str = Body(..., embed=True),
    patientName: str = Body("Patient", embed=True)
):
    db = get_db()
    # Expire in 5 minutes
    expiry = datetime.utcnow() + timedelta(minutes=5)
    
    handshake = {
        "code": code.replace("-", "").upper(),
        "patientId": patientId,
        "patientName": patientName,
        "expiresAt": expiry
    }
    
    await db.handshakes.delete_many({"patientId": patientId}) # One active handshake per patient
    await db.handshakes.insert_one(handshake)
    
    return {"status": "success", "message": "Handshake code registered", "expiresAt": expiry}

@router.post("/patients/handshake/verify")
async def verify_handshake(
    code: str = Body(..., embed=True)
):
    db = get_db()
    clean_code = code.replace("-", "").upper()
    
    handshake = await db.handshakes.find_one({
        "code": clean_code,
        "expiresAt": {"$gt": datetime.utcnow()}
    })
    
    if not handshake:
        raise HTTPException(status_code=404, detail="Invalid or expired handshake code")
    
    return {
        "status": "success",
        "patient": {
            "id": handshake["patientId"],
            "name": handshake["patientName"],
            "avatar": handshake["patientName"][0] if handshake["patientName"] else "P",
            "status": "Connected"
        }
    }
