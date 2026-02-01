import subprocess
import time
import json
import re
import os
import aiofiles
from datetime import datetime
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Query
from pydantic import BaseModel
from typing import Optional, List, Any
from app.core.config import get_settings
from app.core.database import get_db
from bson import ObjectId

router = APIRouter()
settings = get_settings()

# Models
class AIRequest(BaseModel):
    module: str
    input_data: str
    is_text: bool = False
    history: Optional[str] = None
    patientId: Optional[str] = None

class SymptomSaveRequest(BaseModel):
    userId: str
    patientId: str
    symptomText: str
    aiResponse: Any

class ImagingSaveRequest(BaseModel):
    userId: str
    patientId: str
    imagePath: Optional[str]
    prediction: str
    confidence: float
    observations: str
    analysisId: Optional[str]

class GenomicsSaveRequest(BaseModel):
    userId: str
    patientId: str
    fileName: Optional[str]
    variants: List[str]
    summary: str
    interpretation: str

# Helper Functions
def run_script(python_path: str, script_path: str, args: list) -> str:
    cmd = [python_path, script_path] + args
    cwd = os.path.dirname(script_path)
    try:
        result = subprocess.run(
            cmd, capture_output=True, text=True, encoding='utf-8', cwd=cwd, timeout=300
        )
        if result.returncode != 0:
            print(f"Error running script {script_path}: {result.stderr}")
            raise Exception(f"Script failed: {result.stderr}")
        return result.stdout
    except Exception as e:
        raise Exception(f"Subprocess failed: {str(e)}")

def extract_json(output: str, marker_start: str = "---PIPELINE_OUTPUT_START---", marker_end: str = "---PIPELINE_OUTPUT_END---") -> dict:
    marker_pattern = f"{marker_start}(.*?){marker_end}"
    match = re.search(marker_pattern, output, re.DOTALL)
    if match:
        try: return json.loads(match.group(1).strip())
        except: pass
    
    # Fallback to last JSON object
    try:
        start = output.rfind('{')
        end = output.rfind('}')
        if start != -1 and end != -1 and end > start:
            return json.loads(output[start:end+1])
    except: pass
    return {"raw_output": output, "error": "JSON parse failed"}

# --- AI Module Endpoints ---

@router.post("/module1/analyze")
async def analyze_symptoms(
    userId: str = Form(...),
    textInput: Optional[str] = Form(None),
    audio_file: Optional[UploadFile] = File(None)
):
    input_data = textInput
    is_text = True
    
    if audio_file:
        # Save audio file temporarily
        temp_dir = os.path.join(settings.USER_DATA_ROOT, userId, "temp")
        os.makedirs(temp_dir, exist_ok=True)
        file_path = os.path.join(temp_dir, audio_file.filename)
        async with aiofiles.open(file_path, 'wb') as out_file:
            content = await audio_file.read()
            await out_file.write(content)
        input_data = file_path
        is_text = False

    args = [input_data]
    if is_text: args.append("--text")
    
    output = run_script(settings.AI_PYTHON_EXECUTABLE, settings.MODULE1_SCRIPT_PATH, args)
    data = extract_json(output)
    
    return {"status": "success", "result": data}

@router.post("/module2/scan")
async def scan_image(
    userId: str = Form(...),
    medical_image: UploadFile = File(...)
):
    print(f"DEBUG: Imaging Scan started for user {userId}, file {medical_image.filename}")
    temp_dir = os.path.join(settings.USER_DATA_ROOT, userId, "imaging")
    os.makedirs(temp_dir, exist_ok=True)
    
    # Sanitize filename
    safe_filename = "".join([c for c in medical_image.filename if c.isalnum() or c in "._-"]).strip()
    if not safe_filename: safe_filename = "image_" + str(int(time.time()))
    file_path = os.path.join(temp_dir, safe_filename)
    
    try:
        async with aiofiles.open(file_path, 'wb') as out_file:
            content = await medical_image.read()
            await out_file.write(content)
        
        print(f"DEBUG: File saved to {file_path}. Running AI script...")
        args = [file_path, settings.MODULE2_CHECKPOINT, temp_dir]
        output = run_script(settings.AI_PYTHON_EXECUTABLE, settings.MODULE2_SCRIPT_PATH, args)
        data = extract_json(output)
        print(f"DEBUG: AI Script finished. Result: {data.get('prediction', 'No prediction')}")
        return data
    except Exception as e:
        print(f"ERROR in scan_image: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/module3/dna")
async def analyze_dna(
    userId: str = Form(...),
    vcf_file: UploadFile = File(...)
):
    temp_dir = os.path.join(settings.USER_DATA_ROOT, userId, "dna")
    os.makedirs(temp_dir, exist_ok=True)
    file_path = os.path.join(temp_dir, vcf_file.filename)
    
    async with aiofiles.open(file_path, 'wb') as out_file:
        content = await vcf_file.read()
        await out_file.write(content)
        
    args = ["--vcf", file_path]
    # Use specific executable for module 3 (conda env) if provided
    python_exe = settings.MODULE3_PYTHON_EXECUTABLE or settings.AI_PYTHON_EXECUTABLE
    output = run_script(python_exe, settings.MODULE3_SCRIPT_PATH, args)
    data = extract_json(output, "---DNA_RESULT_START---", "---DNA_RESULT_END---")
    
    return data

@router.post("/module4/temporal")
async def analyze_temporal(
    userId: str = Form(...),
    observation: str = Form(...)
):
    print(f"DEBUG: Temporal Analysis started for user {userId}")
    args = [userId, observation]
    
    try:
        output = run_script(settings.AI_PYTHON_EXECUTABLE, settings.MODULE4_SCRIPT_PATH, args)
        data = extract_json(output, "---TEMPORAL_OUTPUT_START---", "---TEMPORAL_OUTPUT_END---")
        print(f"DEBUG: Temporal Analysis finished. Risk Level: {data.get('risk_analysis', {}).get('overall_risk_level', 'unknown')}")
        return data
    except Exception as e:
        print(f"ERROR in analyze_temporal: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat/general")
async def general_chat(
    prompt: str = Form(...),
    pdf_doc: Optional[UploadFile] = File(None)
):
    args = [prompt]
    if pdf_doc:
        # Save PDF temporarily
        temp_path = os.path.join(settings.USER_DATA_ROOT, "temp_chat", pdf_doc.filename)
        os.makedirs(os.path.dirname(temp_path), exist_ok=True)
        async with aiofiles.open(temp_path, 'wb') as out_file:
            await out_file.write(await pdf_doc.read())
        args.extend(["--pdf", temp_path])
        
    output = run_script(settings.AI_PYTHON_EXECUTABLE, settings.MODULE_CHAT_SCRIPT_PATH, args)
    data = extract_json(output)
    return {"status": "success", "result": data}

# --- Record Management ---

@router.post("/records/symptom/save")
async def save_symptom_record(req: SymptomSaveRequest):
    db = get_db()
    record = {
        "doctorId": req.userId,
        "patientId": req.patientId,
        "timestamp": datetime.utcnow().isoformat(),
        "recordType": "symptom",
        "moduleData": {
            "symptomText": req.symptomText,
            "aiResponse": req.aiResponse
        }
    }
    result = await db.records.insert_one(record)
    return {"status": "success", "id": str(result.inserted_id)}

@router.post("/records/imaging/save")
async def save_imaging_record(req: ImagingSaveRequest):
    db = get_db()
    record = {
        "doctorId": req.userId,
        "patientId": req.patientId,
        "timestamp": datetime.utcnow().isoformat(),
        "recordType": "imaging",
        "moduleData": {
            "imagePath": req.imagePath,
            "prediction": req.prediction,
            "confidence": req.confidence,
            "observations": req.observations,
            "analysisId": req.analysisId
        }
    }
    result = await db.records.insert_one(record)
    return {"status": "success", "id": str(result.inserted_id)}

@router.post("/records/genomics/save")
async def save_genomics_record(req: GenomicsSaveRequest):
    db = get_db()
    record = {
        "doctorId": req.userId,
        "patientId": req.patientId,
        "timestamp": datetime.utcnow().isoformat(),
        "recordType": "genomics",
        "moduleData": {
            "fileName": req.fileName,
            "variants": req.variants,
            "summary": req.summary,
            "interpretation": req.interpretation
        }
    }
    result = await db.records.insert_one(record)
    return {"status": "success", "id": str(result.inserted_id)}

@router.get("/records/{doctor_id}")
async def get_records(doctor_id: str, patientId: Optional[str] = Query(None)):
    db = get_db()
    query = {"doctorId": doctor_id}
    if patientId:
        query["patientId"] = patientId
        
    cursor = db.records.find(query).sort("timestamp", -1)
    records = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        records.append(doc)
        
    return {"status": "success", "records": records}

@router.get("/records/{record_id}/pdf")
async def get_record_pdf(record_id: str):
    # For now, return a mock PDF download or just text representation
    # In a real app, use reportlab or similar
    db = get_db()
    record = await db.records.find_one({"_id": ObjectId(record_id)})
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
        
    return {"status": "success", "message": "PDF generation endpoint reached", "record_id": record_id}

# Maintain legacy /ai endpoint for safety
@router.post("/ai")
async def legacy_ai(request: AIRequest):
    # Map to new structure if needed
    raise HTTPException(status_code=410, detail="Please use specific module endpoints")
