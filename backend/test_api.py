import requests
import json

base_url = "http://127.0.0.1:8000"

def test_api():
    print("Testing Registration...")
    reg_data = {
        "full_name": "Test User",
        "email": "test@example.com",
        "password": "password123"
    }
    r = requests.post(f"{base_url}/register", json=reg_data)
    print("Register Response:", r.status_code, r.text)

    print("\nTesting Login...")
    login_data = {
        "username": "test@example.com",
        "password": "password123"
    }
    r = requests.post(f"{base_url}/login", data=login_data)
    print("Login Response:", r.status_code, r.text)
    
    if r.status_code == 200:
        token = r.json().get("access_token")
        
        print("\nTesting Predict...")
        headers = {"Authorization": f"Bearer {token}"}
        predict_data = {
            "age": 25,
            "stress_level": "Medium",
            "diet": "Average",
            "sleep_hours": 7.0,
            "scalp_condition": "Normal",
            "heredity": False
        }
        r = requests.post(f"{base_url}/predict/", json=predict_data, headers=headers)
        print("Predict Response:", r.status_code, r.text)

if __name__ == "__main__":
    test_api()
