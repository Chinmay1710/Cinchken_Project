import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from apps.inventory.models import SiteInventory
from apps.sites.models import Site

site = Site.objects.first()
print(f"Site ID: {site.id}")
qs = SiteInventory.objects.filter(site_id=site.id)
print(f"Filtered count: {qs.count()}")
print(f"Total count: {SiteInventory.objects.count()}")

