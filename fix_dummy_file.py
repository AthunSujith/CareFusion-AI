
import os
import sys
from pathlib import Path

# Add project root to path
sys.path.append(os.path.join(os.getcwd(), 'carefusion_v2', 'backend'))

from app.core.encryption import DocumentEncryption
from app.core.config import get_settings
from dotenv import load_dotenv

def fix_dummy_file():
    # Load env from backend dir
    env_path = Path("carefusion_v2/backend/.env")
    load_dotenv(env_path)

    print("[*] Fixing missing dummy.enc file...")
    
    settings = get_settings()
    master_key = settings.DOCUMENT_ENCRYPTION_KEY
    if not master_key:
        print("[!] No Master Key found!")
        return

    encryptor = DocumentEncryption(master_key)
    
    # Path where the error says it is missing
    target_dir = Path("C:/CareFusion-AI/data/encrypted_documents")
    target_dir.mkdir(parents=True, exist_ok=True)
    
    target_file = target_dir / "dummy.enc"
    
    # Content to encrypt
    dummy_pdf_content = b"%PDF-1.5 DUMMY CONTENT FOR TESTING"
    
    # Encrypt it properly so decryption works
    encrypted_data, salt, nonce = encryptor.encrypt_document(dummy_pdf_content)
    
    # Write to disk
    with open(target_file, "wb") as f:
        f.write(encrypted_data)
        
    print(f"[+] Successfully created valid encrypted file at: {target_file}")
    print("[*] You can now view 'John Doe' documents without crashing.")

if __name__ == "__main__":
    fix_dummy_file()
