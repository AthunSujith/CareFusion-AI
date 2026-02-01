
import os
import sys
import base64
from pathlib import Path
from dotenv import load_dotenv

# Add project root to path
sys.path.append(os.path.join(os.getcwd(), 'carefusion_v2', 'backend'))

from app.services.document_storage import LocalDocumentStorage
from app.models.verification import DocumentType
from app.core.config import get_settings

def run_comprehensive_test():
    # Load environment
    env_path = Path("carefusion_v2/backend/.env")
    load_dotenv(env_path)
    
    print("==================================================")
    print("   CareFusion AI - Encryption Edge Case Test")
    print("==================================================")
    
    storage = LocalDocumentStorage()
    user_id = "TEST-VERIFY-QUICK"
    
    # 1. Define test files (Simulated content)
    test_cases = [
        {
            "name": "government_id.pdf",
            "content": b"%PDF-1.4\n" + b"A" * 1024 + b"\n%%EOF", # Simple PDF structure
            "mime": "application/pdf"
        },
        {
            "name": "avatar.png",
            "content": b"\x89PNG\r\n\x1a\n" + b"B" * 512 + b"\x00\x00\x00\x00IEND\xaeB`\x82", # Simple PNG pattern
            "mime": "image/png"
        },
        {
            "name": "scan.jpg",
            "content": b"\xff\xd8\xff\xe0\x00\x10JFIF" + b"C" * 2048 + b"\xff\xd9", # Simple JPEG pattern
            "mime": "image/jpeg"
        }
    ]
    
    results = []
    
    for case in test_cases:
        print(f"\n[*] Testing: {case['name']} ({case['mime']})")
        
        # Upload (Encrypt)
        try:
            metadata = storage.upload_document(
                user_id=user_id,
                doc_type=DocumentType.GOVERNMENT_ID,
                file_data=case['content'],
                original_filename=case['name'],
                mime_type=case['mime']
            )
            print(f"    [+] Encrypted and stored at: {metadata.file_path}")
            
            # Retrieve (Decrypt)
            decrypted_content = storage.retrieve_document(metadata)
            
            # Verify
            if decrypted_content == case['content']:
                print(f"    [✅] Decryption successful! Content matches exactly.")
                results.append(True)
            else:
                print(f"    [❌] Decryption FAILED! Content mismatch.")
                results.append(False)
                
        except Exception as e:
            print(f"    [❌] Error during test: {e}")
            results.append(False)

    print("\n" + "="*50)
    if all(results):
        print("🎉 ALL EDGE CASES PASSED! Encryption is format-agnostic.")
    else:
        print("⚠️ SOME TESTS FAILED. Check logs.")
    print("="*50)

if __name__ == "__main__":
    run_comprehensive_test()
