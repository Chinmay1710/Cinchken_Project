import requests, json

url = "http://localhost:8001/api/v1"

# Login
login_data = {"mobile_number": "9999999999", "password": "admin123"}
response = requests.post(f"{url}/auth/login/", json=login_data)
token = response.json()["access"]
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

# Get first site
res = requests.get(f"{url}/sites/", headers=headers)
site_id = res.json()["results"][0]["id"]

# Get first labour
res = requests.get(f"{url}/labour/", headers=headers)
labour_id = res.json()["results"][0]["id"]

# Prepare bulk mark payload
import uuid
payload = {
    "site": site_id,
    "date": "2026-06-19",
    "attendances": [
        {
            "labour": labour_id,
            "status": "Present",
            "sync_id": str(uuid.uuid4())
        }
    ]
}

res = requests.post(f"{url}/labour-attendance/bulk_mark/", headers=headers, json=payload)
print(res.status_code)
print(res.text)

