import requests
import json
import os
import sys

# Add current dir to path so we can import app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app import create_app
from flask_jwt_extended import create_access_token

app = create_app()
with app.app_context():
    token = create_access_token(identity="test_user")

url = "http://127.0.0.1:8000/predict/"
headers = {"Authorization": f"Bearer {token}"}

data = {
    "mode": "combined",
    "age": 25,
    "stress_level": "Medium",
    "diet": "Average",
    "sleep_hours": 7,
    "scalp_condition": "Normal",
    "heredity": "false"
}

from PIL import Image
img = Image.new('RGB', (224, 224), color = 'red')
img.save('valid_dummy.jpg')

try:
    with open('valid_dummy.jpg', 'rb') as f:
        files = {'photos': ('valid_dummy.jpg', f, 'image/jpeg')}
        response = requests.post(url, headers=headers, data=data, files=files)
        print("Status Code:", response.status_code)
        print("Response JSON:")
        import json
        print(json.dumps(response.json(), indent=2))
except Exception as e:
    print("Error:", e)
