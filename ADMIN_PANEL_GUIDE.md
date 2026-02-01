# 🛡️ CareFusion AI - Admin Verification System Guide

The Admin Verification System is now live! This secure panel allows designated administrators to verify patient and doctor identities, review encrypted documents, and manage access to the platform.

## 🚀 Getting Started

### 1. Access the Admin Panel
Navigate to the Admin Login page:
👉 **[http://localhost:5173/admin/login](http://localhost:5173/admin/login)**

### 2. Login Credentials
Use the following secure credentials (for development/demo):
- **Admin ID**: `admin`
- **Secure Token**: `CareFusion2026!`

> ⚠️ **Note**: In a production environment, these credentials would be disabled in favor of individual admin accounts with MFA.

---

## 📋 Features & Workflow

### 1. Verification Queue
- **View Pending Requests**: See a list of all patients and doctors waiting for approval.
- **Risk Scoring**: Risk scores (0-100) are automatically calculated based on metadata analysis. High scores (>60) are flagged in red.
- **Filtering**: Toggle between "Patients" and "Doctors" lists.

### 2. Secure Document Review
- Click on any applicant to open the **Review Modal**.
- **Encrypted Viewing**: Click "View Encrypted" on any document. The backend checks your session, decrypts the file in memory using AES-256-GCM, and streams it directly to your browser.
- **Zero-Footprint**: Decrypted files are *never* saved to disk.

### 3. Decision Making
- **Approve**: Activates the user account.
  - Sends an activation email with a secure link (simulated in logs).
  - Updates status to `VERIFIED_USER` / `VERIFIED_DOCTOR`.
- **Reject**: Denies access.
  - Sends a rejection email with the reason provided.
  - Updates status to `REJECTED`.
- **Audit Logging**: Every view and decision is logged immutably.

---

## 🛠️ Testing the System

A test user has been seeded for you to verify the workflow:
- **Name**: John Doe Test
- **ID**: `PENDING-USER-...`
- **Documents**: Contains a dummy encrypted PDF.

1. Login as Admin.
2. Click on "John Doe Test" in the queue.
3. Review details and click "View Encrypted" on the ID document.
4. Enter a note (e.g., "ID verified, minimal risk") and click **Approve**.
5. Check the backend console/logs to see the "Email Sent" simulation.

---

## 🔒 Security Architecture
- **Encryption**: AES-256-GCM (Master Key + Per-File Salt/Nonce).
- **Storage**: Local encrypted file system (simulating secure cloud bucket).
- **Authentication**: JWT-based Admin Sessions with role checks.
- **Audit Trails**: MongoDB `audit_logs` collection tracks all administrative actions.

---
*CareFusion Security Team*
