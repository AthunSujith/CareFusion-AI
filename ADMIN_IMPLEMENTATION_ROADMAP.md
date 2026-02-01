# CareFusion AI - Admin Verification System Implementation Roadmap

## 📋 Current Status: Phase 1 Complete ✅

### ✅ Completed
- [x] Architecture blueprint (`ADMIN_SYSTEM_ARCHITECTURE.md`)
- [x] Encryption utilities (`app/core/encryption.py`)
  - AES-256-GCM encryption
  - Per-document key derivation (PBKDF2)
  - SHA-256 hashing
  - Metadata stripping framework
- [x] Verification models (`app/models/verification.py`)
  - Pending user/doctor models
  - Document metadata
  - Audit log structure
  - Risk scoring framework

---

## 🚀 Implementation Phases

### **Phase 2: Backend API & Database** (Next)
**Estimated Time: 3-4 days**

#### 2.1 Database Setup
- [ ] Create MongoDB collections:
  - `pending_users`
  - `pending_doctors`
  - `verified_users`
  - `verified_doctors`
  - `audit_logs`
  - `admin_users`
- [ ] Enable field-level encryption for sensitive data
- [ ] Create indexes for performance:
  - `status` + `submitted_at`
  - `risk_score` (descending)
  - `email` (unique)
  - `id_hash` (duplicate detection)

#### 2.2 Document Storage
- [ ] Setup S3/GCP bucket (private, no public access)
- [ ] Configure bucket lifecycle policies
- [ ] Implement upload service:
  - `upload_encrypted_document()`
  - `retrieve_encrypted_document()`
  - `delete_document()`

#### 2.3 Verification API Endpoints
Create `/api/v2/admin/` router:

```python
POST   /admin/auth/login          # Admin login (separate from user auth)
POST   /admin/auth/logout         # Admin logout
GET    /admin/auth/verify         # Verify admin session

GET    /admin/queue/users         # Get pending users
GET    /admin/queue/doctors       # Get pending doctors
GET    /admin/queue/item/{id}     # Get detailed item

POST   /admin/document/view       # Decrypt & stream document
POST   /admin/decision            # Approve/reject/escalate

GET    /admin/audit/logs          # Get audit logs
GET    /admin/audit/export        # Export audit logs (CSV)

GET    /admin/stats               # Dashboard statistics
```

#### 2.4 Risk Scoring Engine
- [ ] Implement `calculate_risk_score()`
- [ ] Name mismatch detection (fuzzy matching)
- [ ] DOB validation
- [ ] ID expiry check
- [ ] Duplicate submission detection
- [ ] Document quality assessment (blurriness)

#### 2.5 Audit Logging Service
- [ ] `log_admin_action()` utility
- [ ] Automatic logging middleware
- [ ] IP + User-Agent capture
- [ ] Session tracking

---

### **Phase 3: Signup Forms & Document Upload** (After Phase 2)
**Estimated Time: 3-4 days**

#### 3.1 Patient Signup API
```python
POST /api/v2/signup/patient
- Validate inputs
- Send OTP to email/phone
- Verify OTP
- Encrypt & upload documents
- Create PENDING_USER record
- Send confirmation email
```

#### 3.2 Doctor Signup API
```python
POST /api/v2/signup/doctor
- Same as patient + medical credentials
- NMC verification (if API available)
- Create PENDING_DOCTOR record
```

#### 3.3 Document Upload Endpoint
```python
POST /api/v2/signup/upload-document
- Strip metadata
- Compute hash
- Encrypt with AES-256-GCM
- Upload to S3
- Return document ID
```

#### 3.4 Frontend Signup Forms
- [ ] Patient signup form (React)
  - Personal details
  - OTP verification
  - Document upload (drag & drop)
  - Progress indicator
- [ ] Doctor signup form
  - Medical credentials
  - NMC registration input
  - Multiple document uploads
- [ ] Form validation (Zod/Yup)
- [ ] File type/size validation
- [ ] Upload progress bar

---

### **Phase 4: Admin Dashboard UI** (After Phase 3)
**Estimated Time: 4-5 days**

#### 4.1 Admin Login Page
- [ ] Separate admin login route (`/admin/login`)
- [ ] 2FA support (TOTP)
- [ ] Session management
- [ ] Role-based redirect

#### 4.2 Verification Queue Interface
- [ ] Pending users table
  - Sort by risk score
  - Filter by status
  - Search by name/email
- [ ] Pending doctors table
- [ ] Risk score badges (High/Medium/Low)
- [ ] Quick actions (View, Approve, Reject)

#### 4.3 Identity Review Panel
- [ ] Applicant details sidebar
- [ ] Document list
- [ ] Secure document viewer (iframe sandbox)
- [ ] Mismatch flags display
- [ ] Annotation tool
- [ ] Decision buttons with confirmation modals

#### 4.4 Secure Document Viewer
- [ ] Decrypt document on backend
- [ ] Stream as base64
- [ ] Display in sandboxed iframe
- [ ] 5-minute session timeout
- [ ] No download/print options
- [ ] Watermark with admin ID

#### 4.5 Audit Log Viewer
- [ ] Filterable table
- [ ] Date range picker
- [ ] Admin filter
- [ ] Action type filter
- [ ] Export to CSV

#### 4.6 Dashboard Statistics
- [ ] Total pending users/doctors
- [ ] Approvals today/week/month
- [ ] Rejections today/week/month
- [ ] Average review time
- [ ] High-risk queue count

---

### **Phase 5: Activation & Onboarding** (After Phase 4)
**Estimated Time: 2-3 days**

#### 5.1 Activation Email Service
- [ ] Generate JWT activation token (24hr expiry)
- [ ] Send email with secure link
- [ ] Email templates:
  - User activation
  - Doctor activation
  - Rejection notification
  - Resubmission request

#### 5.2 Activation Flow
```python
GET /activate/{token}
- Verify token
- Check expiry
- Redirect to password setup
```

#### 5.3 Password Setup Page
- [ ] Secure password input
- [ ] Password strength meter
- [ ] Confirmation field
- [ ] Submit → create user account

#### 5.4 Medical Profile Completion (Users)
- [ ] Medical history form
- [ ] Current medications
- [ ] Allergies
- [ ] Emergency contact
- [ ] Blood type, height, weight

#### 5.5 Welcome Dashboard
- [ ] First-time user tour
- [ ] Feature highlights
- [ ] Quick actions

---

### **Phase 6: Security Hardening** (Ongoing)
**Estimated Time: 2-3 days**

#### 6.1 Rate Limiting
- [ ] Signup: 3/day per IP
- [ ] Document upload: 5/day per user
- [ ] Admin login: 5 attempts/15min
- [ ] API endpoints: 100 req/min

#### 6.2 Input Validation
- [ ] Sanitize all inputs
- [ ] File type whitelist (PDF, JPG, PNG only)
- [ ] File size limits (5MB max)
- [ ] Email/phone format validation
- [ ] SQL injection prevention
- [ ] XSS prevention

#### 6.3 Session Security
- [ ] HTTP-only cookies
- [ ] Secure flag (HTTPS only)
- [ ] SameSite=Strict
- [ ] CSRF tokens
- [ ] Session timeout (30min for admin)

#### 6.4 Compliance
- [ ] GDPR consent checkboxes
- [ ] Privacy policy display
- [ ] Terms of service
- [ ] Data retention policy
- [ ] Right to deletion workflow

---

## 📦 Required Dependencies

### Backend (Python)
```bash
pip install cryptography boto3 pymongo[encryption] python-jose[cryptography] python-multipart pillow pypdf2 phonenumbers email-validator
```

### Frontend (React)
```bash
npm install react-dropzone zod react-hook-form @tanstack/react-table date-fns lucide-react
```

---

## 🔐 Environment Variables Needed

```env
# Encryption
DOCUMENT_ENCRYPTION_KEY=<base64-encoded-256-bit-key>

# S3/GCP Storage
AWS_ACCESS_KEY_ID=<your-key>
AWS_SECRET_ACCESS_KEY=<your-secret>
AWS_BUCKET_NAME=carefusion-encrypted-docs
AWS_REGION=ap-south-1

# MongoDB
MONGODB_ENCRYPTION_KEY=<base64-key>

# Admin Auth
ADMIN_JWT_SECRET=<random-secret>
ADMIN_SESSION_TIMEOUT=1800

# Email (for activation links)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<email>
SMTP_PASSWORD=<app-password>
FROM_EMAIL=noreply@carefusion.ai

# NMC API (if available)
NMC_API_KEY=<key>
NMC_API_URL=https://www.nmc.org.in/api/verify
```

---

## 🧪 Testing Checklist

### Unit Tests
- [ ] Encryption/decryption
- [ ] Hash verification
- [ ] Risk score calculation
- [ ] Document validation

### Integration Tests
- [ ] Signup flow (user)
- [ ] Signup flow (doctor)
- [ ] Admin approval flow
- [ ] Admin rejection flow
- [ ] Document upload/retrieval
- [ ] Audit logging

### Security Tests
- [ ] Attempt to access encrypted files directly
- [ ] Attempt to bypass admin auth
- [ ] SQL injection attempts
- [ ] XSS attempts
- [ ] CSRF attempts
- [ ] Rate limit bypass attempts

### E2E Tests
- [ ] Full user journey (signup → approval → login)
- [ ] Full doctor journey
- [ ] Admin workflow (login → review → approve)

---

## 📊 Success Metrics

### Performance
- Document upload: < 5 seconds
- Document decryption: < 2 seconds
- Admin queue load: < 1 second
- Audit log query: < 500ms

### Security
- Zero data breaches
- 100% document encryption
- 100% audit log coverage
- Zero unauthorized access

### User Experience
- Signup completion rate: > 80%
- Admin approval time: < 24 hours
- User activation rate: > 90%

---

## 🚨 Critical Reminders

1. **NEVER** store unencrypted documents
2. **ALWAYS** log admin actions
3. **NEVER** allow direct file downloads
4. **ALWAYS** verify NMC registration for doctors
5. **NEVER** skip rate limiting
6. **ALWAYS** use HTTPS in production
7. **NEVER** expose master encryption key
8. **ALWAYS** implement session timeouts

---

## 📞 Next Steps

**Immediate (Today):**
1. Generate master encryption key
2. Setup S3/GCP bucket
3. Create MongoDB collections
4. Install dependencies

**This Week:**
1. Complete Phase 2 (Backend API)
2. Test encryption pipeline
3. Implement risk scoring

**Next Week:**
1. Build signup forms
2. Implement document upload
3. Start admin dashboard UI

---

**This is a production-grade healthcare identity system. Every shortcut is a security vulnerability.**
