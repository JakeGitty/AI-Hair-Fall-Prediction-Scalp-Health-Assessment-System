import requests

base_url = "http://127.0.0.1:8000"

def test_api():
    print("Testing Login to get token...")
    login_data = {
        "username": "test@example.com",
        "password": "password123"
    }
    r = requests.post(f"{base_url}/login", data=login_data)
    
    if r.status_code == 200:
        token = r.json().get("access_token")
        
        print("\nTesting Predict with Photo...")
        headers = {"Authorization": f"Bearer {token}"}
        
        # Create a dummy image file
        with open('dummy.jpg', 'wb') as f:
            f.write(b'fake image data')
            
        predict_data = {
            "age": "25",
            "stress_level": "Medium",
            "diet": "Average",
            "sleep_hours": "7.0",
            "scalp_condition": "Normal",
            "heredity": "false"
        }
        with open('dummy.jpg', 'rb') as f:
            files = {'photo': ('dummy.jpg', f, 'image/jpeg')}
            r = requests.post(f"{base_url}/predict/", data=predict_data, files=files, headers=headers)
        
        print("Predict Response:", r.status_code, r.text)
    else:
        print("Login failed:", r.status_code, r.text)

if __name__ == "__main__":
    test_api()
