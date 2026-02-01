
import os
import sys
import asyncio
from datetime import datetime, timedelta
from pathlib import Path
from dotenv import load_dotenv

# Add project root to path
sys.path.append(os.path.join(os.getcwd(), 'carefusion_v2', 'backend'))

from app.core.database import get_db, connect_to_mongo
from app.models.verification import AuditLogEntry, AdminAction

async def seed_audit_logs():
    # Load env from backend dir
    env_path = Path("carefusion_v2/backend/.env")
    load_dotenv(env_path)
    
    # Initialize DB connection
    await connect_to_mongo()
    
    print("[*] Seeding sample audit logs...")
    
    db = get_db()
    
    sample_logs = [
        AuditLogEntry(
            admin_id="admin",
            admin_email="local_admin@carefusion",
            action=AdminAction.VIEW_DOCUMENT,
            target_user_id="PENDING-USER-REAL-5617",
            decision_reason="Verified identity document clarity",
            ip_address="127.0.0.1",
            user_agent="Mozilla/5.0",
            session_id="session_1"
        ),
        AuditLogEntry(
            admin_id="admin",
            admin_email="local_admin@carefusion",
            action=AdminAction("APPROVE_USER"),
            target_user_id="PENDING-USER-9988",
            previous_status="PENDING_USER",
            new_status="VERIFIED_USER",
            decision_reason="All documents valid and background check passed",
            ip_address="127.0.0.1",
            user_agent="Mozilla/5.0",
            session_id="session_2"
        )
    ]
    
    for log in sample_logs:
        await db.audit_logs.insert_one(log.dict())
        
    print(f"[+] Successfully seeded {len(sample_logs)} audit logs.")

if __name__ == "__main__":
    asyncio.run(seed_audit_logs())
