import requests

url = "http://localhost:8001/api/v1"

# Login to get token
login_data = {"mobile_number": "9999999999", "password": "admin123"}
response = requests.post(f"{url}/auth/login/", json=login_data)
token = response.json()["access"]
headers = {"Authorization": f"Bearer {token}"}

# Get current labourers
res = requests.get(f"{url}/labour/", headers=headers)
print("Before:", len(res.json().get("results", [])))

# Add new labourer
new_labour = {
    "labour_code": "LAB-TEST-123",
    "full_name": "Test Labourer",
    "mobile_number": "1234567890",
    "skill_type": "Mason",
    "daily_wage": "500.00",
    "status": "Active"
}
post_res = requests.post(f"{url}/labour/", json=new_labour, headers=headers)
print("POST Response:", post_res.status_code, post_res.json())

# Get labourers again
res = requests.get(f"{url}/labour/", headers=headers)
print("After:", len(res.json().get("results", [])))
