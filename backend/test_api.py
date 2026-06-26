import os
import django
import requests

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from apps.users.models import User
from rest_framework_simplejwt.tokens import RefreshToken

admin = User.objects.filter(role='ADMIN').first()
token = str(RefreshToken.for_user(admin).access_token)
headers = {'Authorization': f'Bearer {token}'}

# test unfiltered
r = requests.get('http://localhost:8000/api/v1/inventory/site-inventory/', headers=headers)
data = r.json()
all_results = data.get('results', data)
print(f"All items: {len(all_results)}")

# test filtered
from apps.sites.models import Site
site = Site.objects.first()
r2 = requests.get(f'http://localhost:8000/api/v1/inventory/site-inventory/?site={site.id}', headers=headers)
data2 = r2.json()
filtered_results = data2.get('results', data2)
print(f"Filtered to site {site.id}: {len(filtered_results)}")

