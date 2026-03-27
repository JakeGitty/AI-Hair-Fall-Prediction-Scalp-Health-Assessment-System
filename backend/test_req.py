import requests
import os
import io

BASE_URL = 'http://127.0.0.1:8000'

import time
email = f"test_{int(time.time())}@test.com"
# 1. Register or login to get token
requests.post(f"{BASE_URL}/register", json={
    "email": email,
    "password": "password123",
    "full_name": "Test User"
})

resp = requests.post(f"{BASE_URL}/login", data={
    "username": email,
    "password": "password123"
})
print(f"Login Response: {resp.status_code}, {resp.text}")
if resp.status_code != 200:
    exit(1)
token = resp.json().get('access_token')
headers = {'Authorization': f'Bearer {token}'}

# Data
data = {
    'age': 25,
    'stress_level': 'Medium',
    'diet': 'Average',
    'sleep_hours': 7,
    'scalp_condition': 'Normal',
    'heredity': 'false'
}

# 2. Test without photo
print("Testing WITHOUT photo...")
r1 = requests.post(f"{BASE_URL}/predict/", headers=headers, data=data)
print(f"Status: {r1.status_code}, Response: {r1.text}")

# 3. Test with photo
print("\nTesting WITH photo...")
files = {'photo': ('dummy.jpg', io.BytesIO(b'dummy image content'), 'image/jpeg')}
r2 = requests.post(f"{BASE_URL}/predict/", headers=headers, data=data, files=files)
print(f"Status: {r2.status_code}, Response: {r2.text}")
