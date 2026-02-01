from fastapi import APIRouter, Depends, HTTPException, status, Response, Body
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from app.core.database import get_db
from app.models.verification import (
    PendingUserSignup, PendingDoctorSignup, UserStatus, 
    AdminDecision, AuditLogEntry, AdminAction, VerificationQueueItem,
    RiskFlags
)
from app.services.document_storage import LocalDocumentStorage
from app.core.config import get_settings
from bson import ObjectId
from datetime import datetime, timedelta
from typing import List, Optional
import jwt
import logging
from app.services.notification import NotificationService

router = APIRouter()
settings = get_settings()
storage = LocalDocumentStorage()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("admin_router")

# Auth utils
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v2/admin/auth/login")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ADMIN_SESSION_TIMEOUT / 60)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.ADMIN_JWT_SECRET, algorithm=settings.ALGORITHM)
    return encoded_jwt

async def get_current_admin(token: str = Depends(oauth2_scheme), db = Depends(get_db)):
    try:
        payload = jwt.decode(token, settings.ADMIN_JWT_SECRET, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    
    # In a real app, query admin_users collection here
    # For prototype, we'll assume valid if token is valid and log it
    return username

# --- Authentication Endpoints ---

@router.post("/auth/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db = Depends(get_db)):
    # Prototype: Hardcoded SUPER_ADMIN for bootstrap
    # In production, check admin_users collection with hashed passwords
    if form_data.username == "admin" and form_data.password == "CareFusion2026!":
        access_token_expires = timedelta(minutes=settings.ADMIN_SESSION_TIMEOUT / 60)
        access_token = create_access_token(
            data={"sub": form_data.username, "role": "SUPER_ADMIN"}, 
            expires_delta=access_token_expires
        )
        return {"access_token": access_token, "token_type": "bearer"}
    
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")

# --- Verification Queue Endpoints ---

@router.get("/queue/users", response_model=List[VerificationQueueItem])
async def get_pending_users(db = Depends(get_db), admin: str = Depends(get_current_admin)):
    users = await db.pending_users.find({"status": UserStatus.PENDING_USER}).to_list(100)
    queue = []
    for u in users:
        # Calculate simplistic risk score (placeholder logic)
        risk_flags = RiskFlags()
        queue.append(VerificationQueueItem(
            user_id=u["user_id"],
            user_type="USER",
            full_name=u["personal_info"]["full_name"],
            email=u["personal_info"]["email"],
            submitted_at=u["submitted_at"],
            risk_score=u.get("risk_score", 0),
            risk_flags=risk_flags,
            document_count=len(u.get("documents", [])),
            status=u["status"],
            resubmission_count=u.get("resubmission_count", 0)
        ))
    return queue

@router.get("/queue/doctors", response_model=List[VerificationQueueItem])
async def get_pending_doctors(db = Depends(get_db), admin: str = Depends(get_current_admin)):
    docs = await db.pending_doctors.find({"status": UserStatus.PENDING_DOCTOR}).to_list(100)
    queue = []
    for d in docs:
        queue.append(VerificationQueueItem(
            user_id=d["doctor_id"],
            user_type="DOCTOR",
            full_name=d["personal_info"]["full_name"],
            email=d["personal_info"]["email"],
            submitted_at=d["submitted_at"],
            risk_score=d.get("risk_score", 0),
            risk_flags=RiskFlags(),
            document_count=len(d.get("documents", [])),
            status=d["status"],
            resubmission_count=d.get("resubmission_count", 0)
        ))
    return queue

@router.get("/queue/item/{target_id}")
async def get_queue_item_details(target_id: str, db = Depends(get_db), admin: str = Depends(get_current_admin)):
    # Determine if user or doctor based on ID prefix
    if target_id.startswith("PENDING-USER"):
        item = await db.pending_users.find_one({"user_id": target_id})
    elif target_id.startswith("PENDING-DOC"):
        item = await db.pending_doctors.find_one({"doctor_id": target_id})
    else:
        raise HTTPException(status_code=404, detail="Invalid ID format")
        
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
        
    # Convert ObjectId to str for JSON serialization
    item["_id"] = str(item["_id"])
    return item

# --- Audit Log Endpoints ---

@router.get("/audit/logs", response_model=List[AuditLogEntry])
async def get_audit_logs(db = Depends(get_db), admin: str = Depends(get_current_admin)):
    logs = await db.audit_logs.find().sort("timestamp", -1).to_list(100)
    return logs

@router.get("/settings")
async def get_admin_settings(admin: str = Depends(get_current_admin)):
    return {
        "admin_session_timeout": settings.ADMIN_SESSION_TIMEOUT,
        "admin_2fa_enabled": settings.ADMIN_2FA_ENABLED,
        "algorithm": settings.ALGORITHM,
        "document_encryption": "AES-256-GCM",
        "risk_thresholds": {
            "high": settings.RISK_SCORE_HIGH_THRESHOLD,
            "medium": settings.RISK_SCORE_MEDIUM_THRESHOLD
        },
        "nmc_verification_required": settings.REQUIRE_NMC_VERIFICATION
    }

# --- Document Handling ---

@router.post("/document/view")
async def view_document(
    doc_id: str = Body(..., embed=True), 
    target_id: str = Body(..., embed=True),
    db = Depends(get_db), 
    admin: str = Depends(get_current_admin)
):
    # Security: Verify admin has access to this queue item
    # Fetch document metadata from the pending record
    if target_id.startswith("PENDING-USER"):
        record = await db.pending_users.find_one({"user_id": target_id})
    else:
        record = await db.pending_doctors.find_one({"doctor_id": target_id})
        
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
        
    documents = record.get("documents", [])
    target_doc = next((d for d in documents if d["doc_id"] == doc_id), None)
    
    if not target_doc:
        raise HTTPException(status_code=404, detail="Document metadata not found")

    try:
        # Reconstruct metadata object
        # Note: In Pydantic v2 calls, we might need to adjust, but assuming standard dict unpacking works
        # storage.retrieve_document expects an object with file_path, salt, nonce, hash attributes
        # We can pass the dict directly if we create a simple object wrapper or modify service
        # Let's use a dynamic object for now
        class MetaWrapper:
            def __init__(self, d):
                self.__dict__ = d
        
        meta_obj = MetaWrapper(target_doc)
        
        # Decrypt
        file_bytes = storage.retrieve_document(meta_obj)
        
        # Log this view action
        await _log_audit(
            db, admin, AdminAction.VIEW_DOCUMENT, target_id, 
            details=f"Viewed document {doc_id} ({target_doc['original_filename']})",
            docs=[target_doc['original_filename']]
        )
        
        # Stream response
        return Response(
            content=file_bytes, 
            media_type=target_doc["mime_type"],
            headers={"Content-Disposition": f"inline; filename={target_doc['original_filename']}"}
        )
        
    except Exception as e:
        logger.error(f"Document decryption failed: {e}")
        raise HTTPException(status_code=500, detail="Secure decryption failed")

# --- Decision Handling ---

@router.post("/decision")
async def admin_decision(decision: AdminDecision, db = Depends(get_db), admin: str = Depends(get_current_admin)):
    collection = db.pending_users if decision.target_id.startswith("PENDING-USER") else db.pending_doctors
    record = await collection.find_one({
        "$or": [{"user_id": decision.target_id}, {"doctor_id": decision.target_id}]
    })
    
    if not record:
        raise HTTPException(status_code=404, detail="Target not found")
    
    previous_status = record["status"]
    new_status = None
    
    if decision.action == "APPROVE":
        new_status = UserStatus.VERIFIED_USER if "user_id" in record else UserStatus.VERIFIED_DOCTOR
        # In a real implementation: Move data to 'verified_users' collection and send email
        
    elif decision.action == "REJECT":
        new_status = UserStatus.REJECTED
        
    elif decision.action == "REQUEST_RESUBMISSION":
        new_status = UserStatus.RESUBMISSION_REQUIRED
        
    elif decision.action == "ESCALATE":
        # Just log it, status keeps pending but flagged? Or specific status
        pass

    if new_status:
        # Update DB
        update_data = {
            "status": new_status,
            "reviewed_by": admin,
            "reviewed_at": datetime.utcnow(),
            "rejection_reason": decision.reason
        }
        await collection.update_one({"_id": record["_id"]}, {"$set": update_data})
        
        # Send Notifications
        user_email = record["personal_info"]["email"]
        user_name = record["personal_info"]["full_name"]
        
        if new_status in [UserStatus.VERIFIED_USER, UserStatus.VERIFIED_DOCTOR]:
            # Generate Activation Token (Mocking a JWT link for now)
            # In production, this would be a real frontend URL with a token
            activation_token = create_access_token({"sub": decision.target_id, "type": "activation"}, timedelta(hours=24))
            activation_link = f"http://localhost:3000/activate?token={activation_token}"
            
            # Run async background task ideally, but await for simplicity here
            await NotificationService.send_activation_email(user_email, activation_link, user_name)
            
        elif new_status == UserStatus.REJECTED:
             await NotificationService.send_rejection_notify(user_email, decision.reason, user_name)
        
        # Log Audit
        await _log_audit(
            db, admin, 
            AdminAction(f"{decision.action}_{'USER' if 'user_id' in record else 'DOCTOR'}"),
            decision.target_id,
            prev=previous_status,
            curr=new_status,
            reason=decision.reason
        )
        
    return {"status": "success", "new_state": new_status}

# --- Audit Helper ---

async def _log_audit(db, admin_id, action, target, prev=None, curr=None, reason=None, details=None, docs=[]):
    entry = AuditLogEntry(
        admin_id=admin_id,
        admin_email="local_admin@carefusion", # Mock for local
        action=action,
        target_user_id=target,
        previous_status=prev,
        new_status=curr,
        decision_reason=reason or details,
        documents_viewed=docs,
        ip_address="127.0.0.1", # Mock
        user_agent="Backend Internal",
        session_id="local_session"
    )
    await db.audit_logs.insert_one(entry.dict())
