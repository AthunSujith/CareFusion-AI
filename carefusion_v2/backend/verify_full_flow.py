import requests
import os

BASE_URL = "http://localhost:8000"

def test_api_root():
    try:
        resp = requests.get(f"{BASE_URL}/")
        print(f"[*] API Root: {resp.status_code} - {resp.json()}")
        return True
    except Exception as e:
        print(f"[!] API Root Failed: {e}")
        return False

def test_admin_login():
    url = f"{BASE_URL}/api/v2/admin/auth/login"
    # This matches the x-www-form-urlencoded format needed
    data = {"username": "admin", "password": "CareFusion2026!"}
    
    try:
        resp = requests.post(url, data=data)
        if resp.status_code == 200:
            print(f"[*] Admin Login Success: Token received")
            return resp.json()["access_token"]
        else:
            print(f"[!] Admin Login Failed: {resp.status_code} - {resp.text}")
            return None
    except Exception as e:
        print(f"[!] Login Request Error: {e}")
        return None

def test_upload_document():
    url = f"{BASE_URL}/api/v2/signup/upload-document"
    
    # Create dummy PDF content
    files = {
        'file': ('test_id.pdf', b'%PDF-1.4 dummy content', 'application/pdf')
    }
    data = {
        'user_id': 'TEST-USER-001',
        'doc_type': 'GOVERNMENT_ID' # Using correct enum
    }
    
    try:
        resp = requests.post(url, files=files, data=data)
        if resp.status_code == 200:
            print(f"[*] Upload Success: {resp.json()}")
            return True
        else:
            print(f"[!] Upload Failed: {resp.status_code} - {resp.text}")
            return False
    except Exception as e:
        print(f"[!] Upload Request Error: {e}")
        return False

if __name__ == "__main__":
    print("--- starting diagnostics ---")
    if test_api_root():
        token = test_admin_login()
        test_upload_document()
    print("--- diagnostics complete ---")
