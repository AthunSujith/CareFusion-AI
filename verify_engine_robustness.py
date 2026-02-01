import requests
import asyncio
import time
import os

BASE_URL = "http://localhost:8000/api/v2/ai"
USER_ID = "SW-928"

async def test_module1_concurrent():
    print("Starting concurrent requests test...")
    
    async def make_req(name, text):
        start = time.time()
        print(f"[{name}] Sending...")
        resp = requests.post(f"{BASE_URL}/module1/analyze", data={"userId": USER_ID, "textInput": text})
        duration = time.time() - start
        print(f"[{name}] Received in {duration:.2f}s Status: {resp.status_code}")
        return resp

    # Two simultaneous requests
    tasks = [
        make_req("Req A", "I have a headache."),
        make_req("Req B", "My throat hurts.")
    ]
    
    results = await asyncio.gather(*tasks)
    return results

def test_module1_long_text():
    print("Starting long text test...")
    long_text = "Patient complains of " + "headache and fever. " * 50
    start = time.time()
    resp = requests.post(f"{BASE_URL}/module1/analyze", data={"userId": USER_ID, "textInput": long_text})
    print(f"Long text test finished in {time.time() - start:.2f}s Status: {resp.status_code}")
    return resp

def test_module1_empty():
    print("Starting empty input test...")
    resp = requests.post(f"{BASE_URL}/module1/analyze", data={"userId": USER_ID, "textInput": ""})
    print(f"Empty input status: {resp.status_code} (Expected 500 or 400 with detail)")
    return resp

if __name__ == "__main__":
    # Ensure backend is running!
    try:
        test_module1_empty()
        test_module1_long_text()
        asyncio.run(test_module1_concurrent())
    except Exception as e:
        print(f"Test failed: {e}")
