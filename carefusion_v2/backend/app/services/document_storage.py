"""
CareFusion AI - Local Document Storage Service
Encrypted document storage on local filesystem (no cloud dependency)
"""

import os
import base64
import shutil
from pathlib import Path
from typing import Tuple, Optional
from app.core.encryption import DocumentEncryption
from app.models.verification import DocumentMetadata, DocumentType
from datetime import datetime

from app.core.config import get_settings

class LocalDocumentStorage:
    """
    Manages encrypted document storage on local filesystem.
    Documents stored in: C:/CareFusion-AI/data/encrypted_documents/
    """
    
    def __init__(self, base_path: Optional[str] = None):
        settings = get_settings()
        self.base_path = Path(base_path or settings.ENCRYPTED_DOCUMENTS_PATH)
        self.base_path.mkdir(parents=True, exist_ok=True)
        
        # Get encryption key from settings
        master_key = settings.DOCUMENT_ENCRYPTION_KEY
        if not master_key:
            raise ValueError("DOCUMENT_ENCRYPTION_KEY not set in environment")
        
        self.encryptor = DocumentEncryption(master_key)
    
    def _get_user_directory(self, user_id: str) -> Path:
        """Get user-specific directory for document storage"""
        user_dir = self.base_path / user_id
        user_dir.mkdir(parents=True, exist_ok=True)
        return user_dir
    
    def upload_document(
        self,
        user_id: str,
        doc_type: DocumentType,
        file_data: bytes,
        original_filename: str,
        mime_type: str
    ) -> DocumentMetadata:
        """
        Encrypt and store document locally.
        
        Args:
            user_id: User ID (PENDING-USER-XXX or PENDING-DOC-XXX)
            doc_type: Type of document
            file_data: Raw file bytes
            original_filename: Original filename
            mime_type: MIME type
            
        Returns:
            DocumentMetadata with storage details
        """
        # Generate document ID
        doc_id = f"DOC-{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
        
        # Compute hash before encryption
        doc_hash = self.encryptor.compute_hash(file_data)
        
        # Encrypt document
        encrypted_data, salt, nonce = self.encryptor.encrypt_document(file_data)
        
        # Determine storage path
        user_dir = self._get_user_directory(user_id)
        encrypted_filename = f"{doc_id}.enc"
        file_path = user_dir / encrypted_filename
        
        # Write encrypted file
        with open(file_path, 'wb') as f:
            f.write(encrypted_data)
        
        # Create metadata
        metadata = DocumentMetadata(
            doc_id=doc_id,
            doc_type=doc_type,
            file_path=str(file_path),
            hash=doc_hash,
            salt=base64.b64encode(salt).decode('utf-8'),
            nonce=base64.b64encode(nonce).decode('utf-8'),
            uploaded_at=datetime.utcnow(),
            file_size=len(file_data),
            mime_type=mime_type,
            original_filename=original_filename
        )
        
        return metadata
    
    def retrieve_document(self, metadata: DocumentMetadata) -> bytes:
        """
        Decrypt and retrieve document.
        
        Args:
            metadata: Document metadata from database
            
        Returns:
            Decrypted document bytes
        """
        # Read encrypted file
        with open(metadata.file_path, 'rb') as f:
            encrypted_data = f.read()
        
        # Decode salt and nonce
        salt = base64.b64decode(metadata.salt)
        nonce = base64.b64decode(metadata.nonce)
        
        # Decrypt
        decrypted_data = self.encryptor.decrypt_document(encrypted_data, salt, nonce)
        
        # Verify hash
        computed_hash = self.encryptor.compute_hash(decrypted_data)
        if computed_hash != metadata.hash:
            raise ValueError("Document integrity check failed - possible tampering")
        
        return decrypted_data
    
    def delete_document(self, metadata: DocumentMetadata) -> bool:
        """
        Delete encrypted document from storage.
        
        Args:
            metadata: Document metadata
            
        Returns:
            True if deleted successfully
        """
        try:
            if os.path.exists(metadata.file_path):
                os.remove(metadata.file_path)
            return True
        except Exception as e:
            print(f"Error deleting document: {e}")
            return False
    
    def get_user_documents(self, user_id: str) -> list:
        """
        List all encrypted documents for a user.
        
        Args:
            user_id: User ID
            
        Returns:
            List of document filenames
        """
        user_dir = self._get_user_directory(user_id)
        if not user_dir.exists():
            return []
        
        return [f.name for f in user_dir.iterdir() if f.is_file() and f.suffix == '.enc']
    
    def cleanup_user_documents(self, user_id: str) -> bool:
        """
        Delete all documents for a user (e.g., after rejection).
        
        Args:
            user_id: User ID
            
        Returns:
            True if cleanup successful
        """
        try:
            user_dir = self._get_user_directory(user_id)
            if user_dir.exists():
                shutil.rmtree(user_dir)
            return True
        except Exception as e:
            print(f"Error cleaning up user documents: {e}")
            return False


# Utility functions
def validate_file_type(filename: str, mime_type: str) -> bool:
    """
    Validate file type is allowed.
    
    Args:
        filename: Original filename
        mime_type: MIME type
        
    Returns:
        True if valid
    """
    allowed_extensions = {'.pdf', '.jpg', '.jpeg', '.png'}
    allowed_mimes = {
        'application/pdf',
        'image/jpeg',
        'image/png'
    }
    
    ext = Path(filename).suffix.lower()
    return ext in allowed_extensions and mime_type in allowed_mimes


def validate_file_size(file_data: bytes, max_size_mb: int = 5) -> bool:
    """
    Validate file size.
    
    Args:
        file_data: File bytes
        max_size_mb: Maximum size in MB
        
    Returns:
        True if valid
    """
    max_bytes = max_size_mb * 1024 * 1024
    return len(file_data) <= max_bytes


# Example usage
if __name__ == "__main__":
    # This would normally come from environment
    os.environ["DOCUMENT_ENCRYPTION_KEY"] = DocumentEncryption.generate_master_key()
    
    storage = LocalDocumentStorage()
    
    # Simulate document upload
    test_doc = b"SENSITIVE MEDICAL RECORD - Patient Aadhaar: 1234-5678-9012"
    
    metadata = storage.upload_document(
        user_id="PENDING-USER-20260201",
        doc_type=DocumentType.GOVERNMENT_ID,
        file_data=test_doc,
        original_filename="aadhaar.pdf",
        mime_type="application/pdf"
    )
    
    print(f"✅ Document uploaded: {metadata.doc_id}")
    print(f"   Path: {metadata.file_path}")
    print(f"   Hash: {metadata.hash}")
    print(f"   Size: {metadata.file_size} bytes")
    
    # Retrieve and verify
    retrieved = storage.retrieve_document(metadata)
    print(f"\n✅ Document retrieved and verified")
    print(f"   Match: {retrieved == test_doc}")
    
    # List user documents
    docs = storage.get_user_documents("PENDING-USER-20260201")
    print(f"\n✅ User has {len(docs)} documents")
