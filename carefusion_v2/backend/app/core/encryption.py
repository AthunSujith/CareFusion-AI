"""
CareFusion AI - Document Encryption Utilities
AES-256-GCM encryption for medical and identity documents
"""

import os
import hashlib
import base64
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.backends import default_backend
from typing import Tuple

class DocumentEncryption:
    """
    Handles encryption/decryption of sensitive medical documents.
    Uses AES-256-GCM with per-document keys derived from master secret.
    """
    
    def __init__(self, master_key: str):
        """
        Initialize with master encryption key.
        
        Args:
            master_key: Base64-encoded 256-bit master key from environment
        """
        self.master_key = base64.b64decode(master_key)
        if len(self.master_key) != 32:
            raise ValueError("Master key must be 256 bits (32 bytes)")
    
    def generate_salt(self) -> bytes:
        """Generate cryptographically secure random salt"""
        return os.urandom(16)
    
    def derive_key(self, salt: bytes) -> bytes:
        """
        Derive document-specific encryption key from master key + salt.
        Uses PBKDF2 with 100,000 iterations for key stretching.
        
        Args:
            salt: 16-byte random salt
            
        Returns:
            32-byte derived key
        """
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
            backend=default_backend()
        )
        return kdf.derive(self.master_key)
    
    def encrypt_document(self, file_data: bytes) -> Tuple[bytes, bytes, bytes]:
        """
        Encrypt document with AES-256-GCM.
        
        Args:
            file_data: Raw document bytes
            
        Returns:
            Tuple of (encrypted_data, salt, nonce)
        """
        # Generate unique salt and nonce
        salt = self.generate_salt()
        nonce = os.urandom(12)  # 96-bit nonce for GCM
        
        # Derive document-specific key
        key = self.derive_key(salt)
        
        # Encrypt with AES-GCM
        aesgcm = AESGCM(key)
        encrypted_data = aesgcm.encrypt(nonce, file_data, None)
        
        return encrypted_data, salt, nonce
    
    def decrypt_document(self, encrypted_data: bytes, salt: bytes, nonce: bytes) -> bytes:
        """
        Decrypt document with AES-256-GCM.
        
        Args:
            encrypted_data: Encrypted document bytes
            salt: Salt used during encryption
            nonce: Nonce used during encryption
            
        Returns:
            Decrypted document bytes
        """
        # Derive same key using stored salt
        key = self.derive_key(salt)
        
        # Decrypt
        aesgcm = AESGCM(key)
        decrypted_data = aesgcm.decrypt(nonce, encrypted_data, None)
        
        return decrypted_data
    
    @staticmethod
    def compute_hash(file_data: bytes) -> str:
        """
        Compute SHA-256 hash of document for integrity verification.
        
        Args:
            file_data: Raw document bytes
            
        Returns:
            Hex-encoded SHA-256 hash
        """
        return hashlib.sha256(file_data).hexdigest()
    
    @staticmethod
    def strip_metadata(file_path: str) -> bytes:
        """
        Strip EXIF and other metadata from images/PDFs.
        For now, just reads the file. Full implementation would use:
        - PIL for images
        - PyPDF2 for PDFs
        
        Args:
            file_path: Path to file
            
        Returns:
            File bytes with metadata stripped
        """
        with open(file_path, 'rb') as f:
            data = f.read()
        
        # TODO: Implement actual metadata stripping
        # For images: Use PIL to remove EXIF
        # For PDFs: Use PyPDF2 to remove metadata
        
        return data


def generate_master_key() -> str:
    """
    Generate a new 256-bit master encryption key.
    This should be run ONCE and stored securely in environment/vault.
    
    Returns:
        Base64-encoded master key
    """
    key = AESGCM.generate_key(bit_length=256)
    return base64.b64encode(key).decode('utf-8')


# Example usage
if __name__ == "__main__":
    # Generate master key (do this ONCE, store in .env)
    master_key = generate_master_key()
    print(f"Generated Master Key (STORE SECURELY):\n{master_key}\n")
    
    # Example encryption/decryption
    encryptor = DocumentEncryption(master_key)
    
    # Simulate document
    original_doc = b"SENSITIVE MEDICAL RECORD: Patient ID 12345, Diagnosis: ..."
    
    # Encrypt
    encrypted, salt, nonce = encryptor.encrypt_document(original_doc)
    doc_hash = DocumentEncryption.compute_hash(original_doc)
    
    print(f"Original size: {len(original_doc)} bytes")
    print(f"Encrypted size: {len(encrypted)} bytes")
    print(f"Document hash: {doc_hash}")
    print(f"Salt (base64): {base64.b64encode(salt).decode()}")
    print(f"Nonce (base64): {base64.b64encode(nonce).decode()}\n")
    
    # Decrypt
    decrypted = encryptor.decrypt_document(encrypted, salt, nonce)
    
    print(f"Decryption successful: {decrypted == original_doc}")
    print(f"Decrypted content: {decrypted.decode()}")
