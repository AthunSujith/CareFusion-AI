# CareFusion AI - Admin Verification System Architecture

## 🎯 System Purpose
**Convert untrusted identities into trusted system actors through cryptographically secure, auditable verification.**

---

## 1. ROLE & ACCESS MODEL

### 1.1 Role Hierarchy
```
SUPER_ADMIN
  ├── MEDICAL_VERIFIER (Doctor approvals only)
  ├── IDENTITY_VERIFIER (Patient approvals only)
  └── JUNIOR_ADMIN (View + annotate only)

DOCTOR (Verified)
  └── Access shared patient data

USER/PATIENT (Verified)
  └── Manage personal medical history

PENDING_DOCTOR
  └── Cannot log in

PENDING_USER
  └── Cannot log in

REJECTED
  └── Soft-locked, can resubmit
```

### 1.2 Access Matrix
| Role | View Queue | Approve Users | Approve Doctors | View Documents | Audit Logs |
|------|-----------|---------------|-----------------|----------------|------------|
| SUPER_ADMIN | ✅ | ✅ | ✅ | ✅ | ✅ |
| MEDICAL_VERIFIER | ✅ | ❌ | ✅ | ✅ (Doctors only) | ✅ (Own actions) |
| IDENTITY_VERIFIER | ✅ | ✅ | ❌ | ✅ (Users only) | ✅ (Own actions) |
| JUNIOR_ADMIN | ✅ | ❌ | ❌ | ✅ (Read-only) | ❌ |

---

## 2. SIGNUP & VERIFICATION FLOW

### 2.1 Patient Signup Flow
```
1. User visits /signup/patient
2. Submits:
   - Full Name
   - Email (verified via OTP)
   - Phone (verified via OTP)
   - DOB, Gender, Address
   - Government ID Type (Aadhaar/Passport/Voter ID/Driving License)
   - Government ID Number
   - Upload: ID Document (PDF/Image, max 5MB)
   
3. Backend:
   - Validates inputs
   - Strips EXIF metadata
   - Generates SHA-256 hash
   - Encrypts document with AES-256
   - Stores encrypted file in private S3/GCP bucket
   - Creates PENDING_USER record in MongoDB
   - Sends confirmation email
   
4. Status: PENDING_USER (cannot log in)

5. Admin reviews:
   - Views metadata
   - Opens encrypted document in secure viewer
   - Checks for:
     * Name mismatch
     * DOB mismatch
     * Expired ID
     * Photo quality
   
6. Admin Decision:
   A. APPROVE:
      - Status → VERIFIED_USER
      - Generate secure activation link (JWT, 24hr expiry)
      - Send email with link
      - User sets password
      - User completes medical profile
   
   B. REJECT:
      - Status → REJECTED
      - Reason logged
      - User notified
      - Can resubmit after 7 days
   
   C. REQUEST_RESUBMISSION:
      - Status → RESUBMISSION_REQUIRED
      - Specific issues flagged
      - User uploads new documents
```

### 2.2 Doctor Signup Flow
```
1. Doctor visits /signup/doctor
2. Submits:
   - Full Name
   - Email (OTP verified)
   - Phone (OTP verified)
   - DOB, Gender, Address
   - Medical Degree (MBBS/MD/MS/DNB)
   - Specialization
   - Medical Council Registration Number (NMC/State)
   - Medical Council State
   - Year of Registration
   - Hospital/Clinic Affiliation
   - Government ID (Aadhaar/Passport)
   - Upload: Government ID
   - Upload: Degree Certificate
   - Upload: Medical Council Registration Certificate
   - Upload: Hospital Employment Letter (optional)
   
3. Backend:
   - Same encryption pipeline as patients
   - Additional validation:
     * NMC API verification (if available)
     * State Medical Council format check
   
4. Status: PENDING_DOCTOR

5. Medical Verifier reviews:
   - Cross-checks NMC database
   - Verifies degree authenticity
   - Checks council registration
   - Validates specialization claims
   
6. Decision:
   A. APPROVE:
      - Status → VERIFIED_DOCTOR
      - Activation link sent
      - Doctor sets password
      - Access granted to clinical modules
   
   B. REJECT:
      - Permanent rejection if fraud detected
      - Temporary if documentation incomplete
```

---

## 3. INDIAN MEDICAL VERIFICATION IDs

### 3.1 Valid Doctor Identification
**Primary (Mandatory):**
- **National Medical Commission (NMC) Registration Number**
  - Format: `[State Code]-[Year]-[Serial Number]`
  - Example: `MH-2015-123456`
  - Verification: https://www.nmc.org.in/information-desk/indian-medical-register/

**State Medical Councils (Alternative):**
- Tamil Nadu Medical Council (TNMC)
- Maharashtra Medical Council (MMC)
- Karnataka Medical Council (KMC)
- Delhi Medical Council (DMC)
- etc.

**Supporting Documents:**
- MBBS/MD/MS Degree Certificate
- Internship Completion Certificate
- Hospital Employment Letter

### 3.2 Verification Strategy
```python
1. Extract registration number from form
2. Parse state code and year
3. Query NMC API (if available)
4. Fallback: Manual verification by Medical Verifier
5. Cross-reference with uploaded certificate
6. Flag mismatches for escalation
```

---

## 4. ENCRYPTED DOCUMENT PIPELINE

### 4.1 Architecture
```
┌─────────────┐
│   Client    │
│  (Browser)  │
└──────┬──────┘
       │ HTTPS
       ▼
┌─────────────────┐
│   FastAPI       │
│  Auth Gateway   │
└────────┬────────┘
         │
         ▼
┌──────────────────┐
│  Metadata Strip  │
│  (EXIF removal)  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  SHA-256 Hash    │
│  (Fingerprint)   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  AES-256 Encrypt │
│  (Per-doc key)   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Private Bucket  │
│  (S3/GCP/Azure)  │
└──────────────────┘

MongoDB stores:
- File reference
- Hash
- Encryption metadata
- User ID
- Upload timestamp
```

### 4.2 Encryption Implementation
```python
# Per-document encryption
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

1. Generate unique salt per document
2. Derive key from master secret + salt
3. Encrypt file with AES-256
4. Store:
   - Encrypted file → S3
   - Salt → MongoDB (encrypted field)
   - Hash → MongoDB
   - Master key → Environment vault (never in DB)
```

### 4.3 Secure Document Viewing
```
Admin clicks "View Document"
  ↓
Backend verifies admin role
  ↓
Retrieves encrypted file from S3
  ↓
Decrypts in memory (never writes to disk)
  ↓
Streams to frontend as base64
  ↓
Frontend displays in sandboxed iframe
  ↓
After 5 minutes: Session expires
  ↓
Memory wiped, no cache
```

---

## 5. ADMIN DASHBOARD UI STRUCTURE

### 5.1 Main Sections

**A. Verification Queue**
- Pending Users (sorted by risk score)
- Pending Doctors (sorted by submission date)
- Resubmission Required
- Escalated Cases

**B. Identity Review Panel**
- Applicant metadata
- Document preview (secure viewer)
- Mismatch flags
- Annotation tool
- Decision buttons

**C. Audit Log Viewer**
- All admin actions
- Filterable by admin, date, action type
- Export to CSV (encrypted)

**D. System Settings**
- Verification thresholds
- Auto-rejection rules
- Email templates

### 5.2 Risk Scoring Algorithm
```python
risk_score = 0

# Increase risk if:
if name_mismatch: risk_score += 30
if dob_mismatch: risk_score += 25
if expired_id: risk_score += 40
if duplicate_submission: risk_score += 50
if previous_rejection: risk_score += 20
if blurry_document: risk_score += 15

# High risk (>60) → Top of queue
# Medium risk (30-60) → Manual review
# Low risk (<30) → Standard queue
```

---

## 6. AUDIT LOGGING (MANDATORY)

### 6.1 What to Log
Every admin action must log:
```json
{
  "audit_id": "uuid",
  "admin_id": "ADMIN-123",
  "admin_email": "verifier@carefusion.ai",
  "action": "APPROVE_USER",
  "target_user_id": "PENDING-456",
  "previous_status": "PENDING_USER",
  "new_status": "VERIFIED_USER",
  "timestamp": "2026-02-01T13:47:00Z",
  "ip_address": "103.203.73.18",
  "user_agent": "Mozilla/5.0...",
  "decision_reason": "All documents verified",
  "documents_viewed": ["aadhaar_front.pdf", "aadhaar_back.pdf"],
  "session_id": "sess_xyz"
}
```

### 6.2 Audit Retention
- **Hot storage**: 90 days (MongoDB)
- **Cold storage**: 7 years (S3 Glacier) - Legal requirement
- **Immutable**: No deletion, only append

---

## 7. SECURITY RULES (NON-NEGOTIABLE)

### 7.1 Rate Limiting
```
Signup: 3 attempts per IP per day
Document upload: 5 per user per day
Admin login: 5 attempts per 15 minutes
```

### 7.2 Document Encryption
- **Algorithm**: AES-256-GCM
- **Key derivation**: PBKDF2 with 100,000 iterations
- **Master key**: Stored in AWS Secrets Manager / GCP Secret Manager
- **Rotation**: Every 90 days

### 7.3 Access Controls
- **Admin sessions**: 30-minute timeout
- **Document view**: 5-minute timeout
- **2FA**: Mandatory for all admins
- **IP whitelist**: Optional for super admins

### 7.4 Compliance
- **HIPAA** (if US patients)
- **DISHA** (Digital Information Security in Healthcare Act - India)
- **GDPR** (if EU patients)
- **Data localization**: Store Indian user data in India

---

## 8. DATABASE SCHEMA

### 8.1 Pending Users Collection
```javascript
{
  _id: ObjectId,
  user_id: "PENDING-USER-123",
  status: "PENDING_USER",
  personal_info: {
    full_name: "encrypted",
    email: "encrypted",
    phone: "encrypted",
    dob: "encrypted",
    gender: "encrypted",
    address: "encrypted"
  },
  identity: {
    id_type: "AADHAAR",
    id_number: "encrypted",
    id_hash: "sha256_hash"
  },
  documents: [
    {
      doc_id: "DOC-456",
      doc_type: "GOVERNMENT_ID",
      file_path: "s3://bucket/encrypted/user123_aadhaar.enc",
      hash: "sha256_hash",
      salt: "encrypted",
      uploaded_at: ISODate,
      file_size: 1234567,
      mime_type: "application/pdf"
    }
  ],
  risk_score: 15,
  submitted_at: ISODate,
  reviewed_by: null,
  reviewed_at: null,
  rejection_reason: null,
  resubmission_count: 0
}
```

### 8.2 Pending Doctors Collection
```javascript
{
  _id: ObjectId,
  doctor_id: "PENDING-DOC-789",
  status: "PENDING_DOCTOR",
  personal_info: { /* same as users */ },
  medical_credentials: {
    degree: "MBBS",
    specialization: "Cardiology",
    nmc_registration: "encrypted",
    state_council: "Maharashtra Medical Council",
    registration_year: 2015,
    hospital_affiliation: "encrypted"
  },
  documents: [
    { doc_type: "GOVERNMENT_ID", /* ... */ },
    { doc_type: "DEGREE_CERTIFICATE", /* ... */ },
    { doc_type: "MEDICAL_COUNCIL_CERT", /* ... */ },
    { doc_type: "EMPLOYMENT_LETTER", /* ... */ }
  ],
  nmc_verification_status: "PENDING",
  risk_score: 25,
  submitted_at: ISODate
}
```

### 8.3 Audit Logs Collection
```javascript
{
  _id: ObjectId,
  audit_id: "AUDIT-001",
  admin_id: "ADMIN-123",
  action: "APPROVE_DOCTOR",
  target_id: "PENDING-DOC-789",
  metadata: { /* full context */ },
  timestamp: ISODate,
  ip: "103.203.73.18",
  session_id: "sess_xyz"
}
```

---

## 9. IMPLEMENTATION PHASES

### Phase 1: Backend Foundation (Week 1)
- [ ] Encryption utilities
- [ ] Document upload endpoint
- [ ] Pending user/doctor models
- [ ] Audit logging system

### Phase 2: Admin API (Week 2)
- [ ] Admin authentication
- [ ] Verification queue endpoints
- [ ] Document decryption service
- [ ] Approval/rejection logic

### Phase 3: Admin Dashboard UI (Week 3)
- [ ] Verification queue interface
- [ ] Secure document viewer
- [ ] Decision workflow
- [ ] Audit log viewer

### Phase 4: Signup Forms (Week 4)
- [ ] Patient signup form
- [ ] Doctor signup form
- [ ] OTP verification
- [ ] Document upload UI

### Phase 5: Activation & Onboarding (Week 5)
- [ ] Email activation links
- [ ] Password setup flow
- [ ] Medical profile completion
- [ ] Welcome dashboard

---

## 10. NEXT STEPS

1. **Install encryption libraries**:
   ```bash
   pip install cryptography boto3 pymongo[encryption]
   ```

2. **Setup S3/GCP bucket** (private, no public access)

3. **Create MongoDB collections** with field-level encryption

4. **Implement encryption utilities** (`encrypt_document`, `decrypt_document`)

5. **Build admin authentication** (separate from user auth)

6. **Create verification API endpoints**

7. **Design admin dashboard UI**

---

**This is a legally defensible, security-first healthcare identity system. No shortcuts.**
