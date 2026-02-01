import asyncio
from app.core.database import connect_to_mongo, close_mongo_connection, get_db
from app.models.verification import PendingUserSignup, PersonalInfo, IdentityInfo, UserStatus, DocumentMetadata, DocumentType
from datetime import datetime
import uuid

async def seed_pending_user():
    await connect_to_mongo()
    db = get_db()
    
    # Check if we already have this user
    existing = await db.pending_users.find_one({"personal_info.email": "john.test@example.com"})
    if existing:
        print("Test user already exists.")
        await close_mongo_connection()
        return

    # Create dummy user
    user = PendingUserSignup(
        user_id=f"PENDING-USER-{uuid.uuid4().hex[:8].upper()}",
        status=UserStatus.PENDING_USER,
        personal_info=PersonalInfo(
            full_name="John Doe Test",
            email="john.test@example.com",
            phone="+919876543210",
            dob="1990-01-01",
            gender="Male",
            address="123 Gandhi Road",
            city="Mumbai",
            state="Maharashtra",
            pincode="400001"
        ),
        identity=IdentityInfo(
            id_type="AADHAAR",
            id_number="ENCRYPTED_1234_5678", # Mock encrypted
            id_hash="dummy_hash_123"
        ),
        documents=[
            DocumentMetadata(
                doc_id=f"DOC-{uuid.uuid4().hex[:8]}",
                doc_type=DocumentType.GOVERNMENT_ID,
                file_path="C:/CareFusion-AI/data/encrypted_documents/dummy.enc",
                hash="dummy_hash",
                salt="dummy_salt",
                nonce="dummy_nonce",
                uploaded_at=datetime.utcnow(),
                file_size=1024,
                mime_type="application/pdf",
                original_filename="aadhaar_front.pdf"
            )
        ],
        risk_score=10
    )
    
    await db.pending_users.insert_one(user.dict())
    print(f"✅ Seeding Complete: Created pending user {user.user_id}")
    
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(seed_pending_user())
