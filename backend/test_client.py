import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ck_infra_erp.settings')
django.setup()

from django.test import Client
from apps.users.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from apps.sites.models import Site

site = Site.objects.filter(name__icontains='CP Block A').first()
admin = User.objects.filter(role='ADMIN').first()
token = str(RefreshToken.for_user(admin).access_token)

client = Client()
r = client.get(f'/api/v1/inventory/site-inventory/?site={site.id}', HTTP_AUTHORIZATION=f'Bearer {token}')
print(r.json())
