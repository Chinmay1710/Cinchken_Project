import os
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "ck_infra_erp.settings")
django.setup()
from apps.users.models import User
from apps.inventory.views import SiteInventoryViewSet
from rest_framework.test import APIRequestFactory

factory = APIRequestFactory()
request = factory.get('/api/v1/inventory/site-inventory/?site=88319fed-d211-40d1-8886-905256ce8bc2')
admin = User.objects.filter(role='ADMIN').first()
from rest_framework.request import Request
drf_request = Request(request)
drf_request.user = admin

view = SiteInventoryViewSet()
view.request = drf_request
view.format_kwarg = None
qs = view.get_queryset()
print('Filtered Queryset Count:', qs.count())

request_all = factory.get('/api/v1/inventory/site-inventory/')
drf_request_all = Request(request_all)
drf_request_all.user = admin
view.request = drf_request_all
qs_all = view.get_queryset()
print('Unfiltered Queryset Count:', qs_all.count())
