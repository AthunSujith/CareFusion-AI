from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from app.core.config import get_settings
import os
import aiofiles
from pathlib import Path

router = APIRouter()
settings = get_settings()

@router.post("/patients/upload")
async def upload_patient_file(
    patientId: str = Form(...),
    folderType: str = Form(...),
    file: UploadFile = File(...)
):
    try:
        # Validate inputs
        if not patientId or not folderType:
            raise HTTPException(status_code=400, detail="Missing patientId or folderType")

        # Define root path
        base_path = Path(settings.USER_DATA_ROOT)
        # Normalize folderType just in case
        safe_folder_type = folderType.strip().replace("..", "") # Basic sanitization
        
        # Structure: USER_DATA_ROOT / patientId / folderType / filename
        target_dir = base_path / patientId / safe_folder_type
        
        # Ensure directory exists
        if not target_dir.exists():
            target_dir.mkdir(parents=True, exist_ok=True)
            
        file_path = target_dir / file.filename
        
        # Save file streaming
        async with aiofiles.open(file_path, 'wb') as out_file:
            while content := await file.read(1024 * 1024):  # 1MB chunks
                await out_file.write(content)
                
        return {
            "status": "success",
            "patientId": patientId,
            "folderType": folderType,
            "filename": file.filename,
            "saved_path": str(file_path)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")
