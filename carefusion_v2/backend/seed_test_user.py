import requests

BASE_URL = "http://localhost:8000"

def test_signup_submission():
    # 1. Upload Doc
    upload_url = f"{BASE_URL}/api/v2/signup/upload-document"
    files = {'file': ('aadhaar_front.jpg', b'fake_image_content', 'image/jpeg')}
    data = {'user_id': 'TEST-USER-REAL', 'doc_type': 'GOVERNMENT_ID'}
    
    print("[*] Uploading Document...")
    resp = requests.post(upload_url, files=files, data=data)
    if resp.status_code != 200:
        print(f"[!] Upload Failed: {resp.text}")
        return
        
    doc_metadata = resp.json()
    print(f"[*] Document Uploaded: {doc_metadata['doc_id']}")
    
    # 2. Submit Signup
    signup_url = f"{BASE_URL}/api/v2/signup/patient"
    payload = {
        "user_id": "TEST-USER-REAL",
        "password": "StrongPassword123!",
        "personal_info": {
            "full_name": "Rohan Sharma",
            "email": "rohan.sharma@example.com",
            "phone": "+919876543210",
            "dob": "1990-01-01",
            "address": "123 MG Road, Bangalore",
            "gender": "Male",
            "city": "Bangalore",
            "state": "Karnataka",
            "pincode": "560001"
        },
        "identity": {
            "id_type": "AADHAAR",
            "id_number": "XXXX-XXXX-1234",
            "id_hash": "dummy_hash_123"
        },
        "documents": [doc_metadata]
    }
    
    print("[*] Submitting Signup Application...")
    resp = requests.post(signup_url, json=payload)
    
    if resp.status_code == 200:
        print(f"[*] Signup Success: {resp.json()}")
    else:
        print(f"[!] Signup Failed: {resp.text}")

if __name__ == "__main__":
    test_signup_submission()
