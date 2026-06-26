from django.test import TestCase
from django.contrib.gis.geos import Point
from apps.users.models import User
from apps.sites.models import Site
from .models import EmployeeAttendance
from .services import AttendanceService
from django.utils import timezone
import datetime
import uuid

class AttendanceServiceTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(mobile_number='1234567890', password='password', full_name='Test User')
        self.site = Site.objects.create(
            name='Test Site',
            location=Point(77.1025, 28.7041, srid=4326), # Delhi Long, Lat
            geofence_radius_meters=50,
            attendance_cutoff_time=datetime.time(9, 0)
        )
        
    def test_within_geofence_on_time(self):
        attendance = EmployeeAttendance.objects.create(
            employee=self.user,
            site=self.site,
            work_date=timezone.now().date(),
            check_in_time=timezone.make_aware(datetime.datetime.combine(timezone.now().date(), datetime.time(8, 30))),
            check_in_location=Point(77.1025, 28.7041, srid=4326), # Exact same spot
            sync_id=uuid.uuid4()
        )
        success, status = AttendanceService.validate_check_in(attendance.id)
        self.assertTrue(success)
        self.assertEqual(status, 'Present')
        
    def test_outside_geofence(self):
        attendance = EmployeeAttendance.objects.create(
            employee=self.user,
            site=self.site,
            work_date=timezone.now().date(),
            check_in_time=timezone.now(),
            check_in_location=Point(77.1050, 28.7050, srid=4326), # 300+ meters away
            sync_id=uuid.uuid4()
        )
        success, status = AttendanceService.validate_check_in(attendance.id)
        self.assertFalse(success)
        self.assertEqual(status, 'Rejected')
        
    def test_late_check_in(self):
        attendance = EmployeeAttendance.objects.create(
            employee=self.user,
            site=self.site,
            work_date=timezone.now().date(),
            check_in_time=timezone.make_aware(datetime.datetime.combine(timezone.now().date(), datetime.time(9, 30))),
            check_in_location=Point(77.1025, 28.7041, srid=4326), # Exact same spot
            sync_id=uuid.uuid4()
        )
        success, status = AttendanceService.validate_check_in(attendance.id)
        self.assertTrue(success)
        self.assertEqual(status, 'Late')
