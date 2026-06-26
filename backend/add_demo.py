import os
import django
import sys
from datetime import date
import uuid

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ck_infra_erp.settings')
django.setup()

from apps.users.models import User
from apps.attendance.models import EmployeeAttendance
from apps.sites.models import Site
from apps.sites.models import SiteEngineerAssignment
from apps.finance.models import PayrollRecord
from django.contrib.gis.geos import Point

def run():
    print("Creating Demo Engineer...")
    
    # 1. Ensure a site exists
    site = Site.objects.first()
    if not site:
        site = Site.objects.create(
            name="Demo Site Alpha",
            location=Point(72.8777, 19.0760),
            status="Active",
            budget=100000
        )
    
    # 2. Create the demo user
    user, created = User.objects.get_or_create(
        email='demo_engineer@ckinfra.com',
        defaults={
            'mobile_number': '9998887776',
            'full_name': 'Demo Engineer',
            'role': 'SITE_ENGINEER',
            'monthly_base_salary': 50000.00,
            'is_active': True,
        }
    )
    if created:
        user.set_password('password123')
        user.save()
        print(f"Created user {user.full_name}")
    else:
        user.monthly_base_salary = 50000.00
        user.save()
        print(f"User {user.full_name} already exists. Updated salary to 50k.")

    # Assign site
    SiteEngineerAssignment.objects.get_or_create(
        site=site,
        user=user,
        defaults={'start_date': date.today()}
    )

    # 3. Create dummy attendance for this month (June 2026)
    current_year = 2026
    current_month = 6
    
    added_attendance = 0
    for day in range(1, 16):
        work_date = date(current_year, current_month, day)
        if work_date.weekday() != 6: # Not Sunday
            _, att_created = EmployeeAttendance.objects.get_or_create(
                employee=user,
                work_date=work_date,
                defaults={
                    'site': site,
                    'check_in_time': f"2026-06-{day:02d}T09:00:00Z",
                    'check_in_location': Point(72.8777, 19.0760),
                    'status': 'Present',
                    'sync_id': uuid.uuid4()
                }
            )
            if att_created:
                added_attendance += 1
            
    print(f"Added {added_attendance} days of attendance.")

    # 4. Generate Payroll manually to see the output of the new formula
    from calendar import monthrange
    total_days = monthrange(current_year, current_month)[1]
    sundays_in_month = sum(1 for d in range(1, total_days + 1) if date(current_year, current_month, d).weekday() == 6)
    
    present_count = EmployeeAttendance.objects.filter(
        employee=user, 
        work_date__month=current_month, 
        work_date__year=current_year, 
        status='Present'
    ).count()

    paid_days = present_count + sundays_in_month
    if paid_days > total_days: paid_days = total_days

    net_salary = float(user.monthly_base_salary) * (paid_days / total_days)
    print(f"--- SALARY CALCULATION FOR DEMO ENGINEER ---")
    print(f"Base Salary: ₹{user.monthly_base_salary}")
    print(f"Total Days in Month: {total_days}")
    print(f"Sundays in Month: {sundays_in_month}")
    print(f"Present Days: {present_count}")
    print(f"Paid Days (Present + Sundays): {paid_days}")
    print(f"Calculated Net Salary: ₹{round(net_salary, 2)}")
    print(f"Formula Output: [{paid_days}/{total_days}] * {user.monthly_base_salary} = {round(net_salary, 2)}")

run()
