from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Body
from app.core.database import get_db
from app.models.verification import (
    PendingUserSignup, PendingDoctorSignup, UserStatus, 
    PersonalInfo, IdentityInfo, MedicalCredentials, 
    DocumentType, MedicalDegree, IDType
)
from app.services.document_storage import LocalDocumentStorage, validate_file_type, validate_file_size
from app.core.config import get_settings
from datetime import datetime
import json
from pydantic import ValidationError

router = APIRouter()
settings = get_settings()
storage = LocalDocumentStorage()

# --- Helper Functions ---

async def check_existing_user(email: str, phone: str, db):
    # Check both verified and pending collections
    # This is a bit expensive but necessary
    existing_pending = await db.pending_users.find_one({"$or": [{"personal_info.email": email}, {"personal_info.phone": phone}]})
    if existing_pending:
        return True
    existing_verified = await db.patients.find_one({"$or": [{"email": email}, {"phone": phone}]}) # Assuming patients collection structure
    if existing_verified:
        return True
    return False

# --- Document Upload Endpoint ---

@router.post("/upload-document")
async def upload_document(
    user_id: str = Form(...),
    doc_type: DocumentType = Form(...),
    file: UploadFile = File(...)
):
    # 1. Validate File
    if not validate_file_type(file.filename, file.content_type):
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDF and Images allowed.")
    
    content = await file.read()
    if not validate_file_size(content, max_size_mb=settings.MAX_DOCUMENT_SIZE_MB):
        raise HTTPException(status_code=400, detail=f"File exceeds maximum size of {settings.MAX_DOCUMENT_SIZE_MB}MB")

    # 2. Encrypt & Store
    try:
        metadata = storage.upload_document(
            user_id=user_id,
            doc_type=doc_type,
            file_data=content,
            original_filename=file.filename,
            mime_type=file.content_type
        )
        return metadata.dict()
    except Exception as e:
        print(f"Upload error: {e}")
        raise HTTPException(status_code=500, detail="Secure storage failed")

# --- Patient Signup Submission ---

@router.post("/patient")
async def submit_patient_signup(
    signup_model: PendingUserSignup,
    db = Depends(get_db)
):
    # Check for existing
    if await check_existing_user(signup_model.personal_info.email, signup_model.personal_info.phone, db):
        raise HTTPException(status_code=409, detail="User with this email or phone already exists")

    # Insert into Pendng Collection
    new_record = await db.pending_users.insert_one(signup_model.dict())
    
    return {
        "status": "success", 
        "message": "Application submitted for verification", 
        "reference_id": signup_model.user_id
    }

# --- Doctor Signup Submission ---

@router.post("/doctor")
async def submit_doctor_signup(
    signup_model: PendingDoctorSignup,
    db = Depends(get_db)
):

    # Basic NMC Check mockup (In production, call external API)
    if settings.REQUIRE_NMC_VERIFICATION:
        # Mock validation logic
        reg_num = signup_model.medical_credentials.nmc_registration
        if not reg_num or len(reg_num) < 5:
            signup_model.nmc_verification_status = "FAILED"
            signup_model.risk_score += 50
        else:
            signup_model.nmc_verification_status = "VERIFIED"

    # Insert
    await db.pending_doctors.insert_one(signup_model.dict())

    return {
        "status": "success", 
        "message": "Doctor application submitted for verification", 
        "reference_id": signup_model.doctor_id,
        "nmc_status": signup_model.nmc_verification_status
    }
