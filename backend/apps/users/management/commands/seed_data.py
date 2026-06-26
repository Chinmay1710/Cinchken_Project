from django.core.management.base import BaseCommand
from django.contrib.gis.geos import Point
from apps.users.models import User
from apps.sites.models import Site, SiteAssignment
from apps.labour.models import Labour
from apps.inventory.models import Material, MaterialInward, MaterialConsumption
import datetime
from django.utils import timezone

class Command(BaseCommand):
    help = 'Seeds the database with initial demo data'

    def handle(self, *args, **kwargs):
        self.stdout.write("Seeding database...")

        # 1. Create Admin
        admin, _ = User.objects.get_or_create(
            mobile_number='9999999999',
            defaults={
                'full_name': 'Super Admin',
                'role': 'ADMIN',
                'is_staff': True,
                'is_superuser': True,
                'is_active': True,
            }
        )
        admin.set_password('admin123')
        admin.save()
        self.stdout.write(self.style.SUCCESS('Admin user created (9999999999 / admin123)'))

        # 2. Create Site Engineer
        engineer, _ = User.objects.get_or_create(
            mobile_number='8888888888',
            defaults={
                'full_name': 'Demo Engineer',
                'role': 'SITE_ENGINEER',
                'is_active': True,
            }
        )
        engineer.set_password('engineer123')
        engineer.save()
        self.stdout.write(self.style.SUCCESS('Site Engineer created (8888888888 / engineer123)'))

        # 3. Create Demo Site (Connaught Place, Delhi)
        site, _ = Site.objects.get_or_create(
            name='CP Block A Renovation',
            defaults={
                'address': 'Connaught Place, New Delhi, 110001',
                'location': Point(77.216721, 28.631451, srid=4326),
                'geofence_radius_meters': 100,
                'attendance_cutoff_time': datetime.time(9, 30),
            }
        )
        self.stdout.write(self.style.SUCCESS('Demo Site created'))

        # 4. Assign Engineer to Site
        SiteAssignment.objects.get_or_create(user=engineer, site=site)

        # 5. Create Labourers
        for i in range(1, 6):
            Labour.objects.get_or_create(
                labour_code=f'L-{1000+i}',
                defaults={
                    'full_name': f'Demo Labour {i}',
                    'mobile_number': f'777777777{i}',
                    'skill_type': 'Mason' if i % 2 == 0 else 'Helper',
                    'daily_wage': 600.00 if i % 2 == 0 else 400.00,
                    'status': 'Active'
                }
            )
        self.stdout.write(self.style.SUCCESS('5 Demo Labours created'))

        # 6. Create Demo Materials
        m1, _ = Material.objects.get_or_create(
            material_code='CEM-001',
            defaults={'material_name': 'Portland Cement', 'category': 'Building Material', 'unit': 'Bags', 'minimum_stock': 50}
        )
        m2, _ = Material.objects.get_or_create(
            material_code='STE-001',
            defaults={'material_name': 'TMT Steel Bars 12mm', 'category': 'Steel', 'unit': 'Tons', 'minimum_stock': 10}
        )
        m3, _ = Material.objects.get_or_create(
            material_code='SND-001',
            defaults={'material_name': 'River Sand', 'category': 'Building Material', 'unit': 'Tons', 'minimum_stock': 20}
        )
        self.stdout.write(self.style.SUCCESS('3 Demo Materials created'))

        # 7. Add Material Inwards
        today = timezone.localdate()
        MaterialInward.objects.get_or_create(
            site=site, material=m1, date=today,
            defaults={'quantity': 500, 'unit_price': 350, 'vendor_name': 'UltraTech', 'invoice_number': 'INV-001'}
        )
        MaterialInward.objects.get_or_create(
            site=site, material=m2, date=today,
            defaults={'quantity': 50, 'unit_price': 65000, 'vendor_name': 'Tata Steel', 'invoice_number': 'INV-002'}
        )
        self.stdout.write(self.style.SUCCESS('Demo Material Inwards created'))

        # 8. Add Material Consumptions
        MaterialConsumption.objects.get_or_create(
            site=site, material=m1, date=today,
            defaults={'quantity_used': 20, 'used_by': 'Demo Engineer', 'remarks': 'Foundation Work'}
        )
        self.stdout.write(self.style.SUCCESS('Demo Material Consumptions created'))

        self.stdout.write(self.style.SUCCESS('Database successfully seeded!'))
