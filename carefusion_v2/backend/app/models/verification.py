"""
CareFusion AI - Verification Models
Database models for admin verification system
"""

from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List, Literal
from datetime import datetime
from enum import Enum

# Enums
class UserStatus(str, Enum):
    PENDING_USER = "PENDING_USER"
    PENDING_DOCTOR = "PENDING_DOCTOR"
    VERIFIED_USER = "VERIFIED_USER"
    VERIFIED_DOCTOR = "VERIFIED_DOCTOR"
    REJECTED = "REJECTED"
    RESUBMISSION_REQUIRED = "RESUBMISSION_REQUIRED"
    SUSPENDED = "SUSPENDED"

class IDType(str, Enum):
    AADHAAR = "AADHAAR"
    PASSPORT = "PASSPORT"
    VOTER_ID = "VOTER_ID"
    DRIVING_LICENSE = "DRIVING_LICENSE"

class DocumentType(str, Enum):
    GOVERNMENT_ID = "GOVERNMENT_ID"
    DEGREE_CERTIFICATE = "DEGREE_CERTIFICATE"
    MEDICAL_COUNCIL_CERT = "MEDICAL_COUNCIL_CERT"
    EMPLOYMENT_LETTER = "EMPLOYMENT_LETTER"
    HOSPITAL_ID = "HOSPITAL_ID"

class AdminAction(str, Enum):
    APPROVE_USER = "APPROVE_USER"
    APPROVE_DOCTOR = "APPROVE_DOCTOR"
    REJECT_USER = "REJECT_USER"
    REJECT_DOCTOR = "REJECT_DOCTOR"
    REQUEST_RESUBMISSION = "REQUEST_RESUBMISSION"
    VIEW_DOCUMENT = "VIEW_DOCUMENT"
    ESCALATE = "ESCALATE"
    SUSPEND_USER = "SUSPEND_USER"

class MedicalDegree(str, Enum):
    MBBS = "MBBS"
    MD = "MD"
    MS = "MS"
    DNB = "DNB"
    BDS = "BDS"
    MDS = "MDS"
    BAMS = "BAMS"
    BHMS = "BHMS"

# Document Model
class DocumentMetadata(BaseModel):
    doc_id: str
    doc_type: DocumentType
    file_path: str  # S3/GCP path to encrypted file
    hash: str  # SHA-256 hash
    salt: str  # Base64-encoded salt for decryption
    nonce: str  # Base64-encoded nonce for AES-GCM
    uploaded_at: datetime
    file_size: int
    mime_type: str
    original_filename: str

# Personal Info (Encrypted in DB)
class PersonalInfo(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    dob: str  # YYYY-MM-DD
    gender: Literal["Male", "Female", "Other"]
    address: str
    city: str
    state: str
    pincode: str

# Identity Info
class IdentityInfo(BaseModel):
    id_type: IDType
    id_number: str  # Encrypted in DB
    id_hash: str  # SHA-256 for duplicate detection

# Medical Credentials (for doctors)
class MedicalCredentials(BaseModel):
    degree: MedicalDegree
    specialization: str
    nmc_registration: str  # National Medical Commission number
    state_council: str  # e.g., "Maharashtra Medical Council"
    registration_year: int
    hospital_affiliation: Optional[str] = None
    clinic_name: Optional[str] = None

# Pending User Signup
class PendingUserSignup(BaseModel):
    user_id: str = Field(default_factory=lambda: f"PENDING-USER-{datetime.now().strftime('%Y%m%d%H%M%S')}")
    status: UserStatus = UserStatus.PENDING_USER
    personal_info: PersonalInfo
    identity: IdentityInfo
    documents: List[DocumentMetadata] = []
    risk_score: int = 0
    submitted_at: datetime = Field(default_factory=datetime.utcnow)
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    resubmission_count: int = 0
    activation_token: Optional[str] = None
    activation_expires: Optional[datetime] = None

# Pending Doctor Signup
class PendingDoctorSignup(BaseModel):
    doctor_id: str = Field(default_factory=lambda: f"PENDING-DOC-{datetime.now().strftime('%Y%m%d%H%M%S')}")
    status: UserStatus = UserStatus.PENDING_DOCTOR
    personal_info: PersonalInfo
    identity: IdentityInfo
    medical_credentials: MedicalCredentials
    documents: List[DocumentMetadata] = []
    nmc_verification_status: Literal["PENDING", "VERIFIED", "FAILED"] = "PENDING"
    risk_score: int = 0
    submitted_at: datetime = Field(default_factory=datetime.utcnow)
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    resubmission_count: int = 0
    activation_token: Optional[str] = None
    activation_expires: Optional[datetime] = None

# Audit Log Entry
class AuditLogEntry(BaseModel):
    audit_id: str = Field(default_factory=lambda: f"AUDIT-{datetime.now().strftime('%Y%m%d%H%M%S%f')}")
    admin_id: str
    admin_email: str
    action: AdminAction
    target_user_id: str
    previous_status: Optional[UserStatus] = None
    new_status: Optional[UserStatus] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    ip_address: str
    user_agent: str
    decision_reason: Optional[str] = None
    documents_viewed: List[str] = []
    session_id: str
    metadata: dict = {}

# Admin Decision Request
class AdminDecision(BaseModel):
    target_id: str  # PENDING-USER-XXX or PENDING-DOC-XXX
    action: Literal["APPROVE", "REJECT", "REQUEST_RESUBMISSION", "ESCALATE"]
    reason: Optional[str] = None
    notes: Optional[str] = None

# Risk Flags
class RiskFlags(BaseModel):
    name_mismatch: bool = False
    dob_mismatch: bool = False
    expired_id: bool = False
    duplicate_submission: bool = False
    previous_rejection: bool = False
    blurry_document: bool = False
    suspicious_pattern: bool = False

# Verification Queue Item (for admin dashboard)
class VerificationQueueItem(BaseModel):
    user_id: str
    user_type: Literal["USER", "DOCTOR"]
    full_name: str
    email: str
    submitted_at: datetime
    risk_score: int
    risk_flags: RiskFlags
    document_count: int
    status: UserStatus
    resubmission_count: int

# Document Upload Request
class DocumentUploadRequest(BaseModel):
    user_id: str
    doc_type: DocumentType
    
# NMC Verification Response (mock for now)
class NMCVerificationResponse(BaseModel):
    registration_number: str
    is_valid: bool
    doctor_name: Optional[str] = None
    registration_date: Optional[str] = None
    state_council: Optional[str] = None
    status: Literal["Active", "Suspended", "Revoked", "Not Found"]
    message: str
