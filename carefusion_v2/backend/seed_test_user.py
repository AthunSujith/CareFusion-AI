import requests
import datetime
import os

BASE_URL = "http://localhost:8000"

def test_real_files_signup():
    user_id = f"PENDING-USER-REAL-{datetime.datetime.now().strftime('%M%S')}"
    
    # User's provided paths
    image_path = r"C:\Users\athun\OneDrive\Pictures\Screenshots 1\Screenshot 2026-02-01 150859.png"
    pdf_path = r"C:\CareFusion-AI\External_knowledger\USMLE Step 2 Ck Psychiatry, Epidemiolgy, & Ethics Lecture Notes [Shared By Ussama Maqbool]-1.pdf"
    
    # Files to test
    real_files = []
    
    if os.path.exists(image_path):
        with open(image_path, "rb") as f:
            real_files.append(('verification_shot.png', f.read(), 'image/png'))
    else:
        print(f"[!] Image not found: {image_path}")
        
    if os.path.exists(pdf_path):
        with open(pdf_path, "rb") as f:
            real_files.append(('usmle_notes.pdf', f.read(), 'application/pdf'))
    else:
        print(f"[!] PDF not found: {pdf_path}")

    if not real_files:
        print("[!] No real files found. Using fallback dummy.")
        real_files.append(('fallback.pdf', b'%PDF-1.4 dummy', 'application/pdf'))
    
    uploaded_metadatas = []
    
    for filename, content, mime in real_files:
        print(f"[*] Uploading {filename}...")
        upload_url = f"{BASE_URL}/api/v2/signup/upload-document"
        files = {'file': (filename, content, mime)}
        data = {'user_id': user_id, 'doc_type': 'GOVERNMENT_ID'}
        
        resp = requests.post(upload_url, files=files, data=data)
        if resp.status_code == 200:
            uploaded_metadatas.append(resp.json())
            print(f"    [+] Uploaded: {filename}")
        else:
            print(f"    [!] Failed {filename}: {resp.text}")

    # Submit Signup
    signup_url = f"{BASE_URL}/api/v2/signup/patient"
    payload = {
        "user_id": user_id,
        "password": "StrongPassword123!",
        "personal_info": {
            "full_name": "Multi Doc Tester",
            "email": f"multi.doc{datetime.datetime.now().strftime('%M%S')}@example.com",
            "phone": f"+91777{datetime.datetime.now().strftime('%M%S')}",
            "dob": "1990-01-01",
            "address": "123 Beta Street",
            "gender": "Other",
            "city": "TestCity",
            "state": "TestState",
            "pincode": "000000"
        },
        "identity": {
            "id_type": "PASSPORT",
            "id_number": "MULTI-12345",
            "id_hash": "dummy_hash"
        },
        "documents": uploaded_metadatas
    }
    
    print("[*] Submitting Signup with multiple documents...")
    resp = requests.post(signup_url, json=payload)
    if resp.status_code == 200:
        print(f"[*] Success! Reference ID: {user_id}")
    else:
        print(f"[!] Failed: {resp.text}")

if __name__ == "__main__":
    test_real_files_signup()
