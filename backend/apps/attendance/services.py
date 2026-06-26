from django.contrib.gis.geos import Point
from django.utils import timezone
from apps.sites.models import Site
from .models import EmployeeAttendance
import math

class AttendanceService:
    @staticmethod
    def haversine(lon1, lat1, lon2, lat2):
        R = 6371000  # radius of Earth in meters
        phi_1 = math.radians(lat1)
        phi_2 = math.radians(lat2)
        delta_phi = math.radians(lat2 - lat1)
        delta_lambda = math.radians(lon2 - lon1)
        a = math.sin(delta_phi / 2.0) ** 2 + math.cos(phi_1) * math.cos(phi_2) * math.sin(delta_lambda / 2.0) ** 2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c

    @staticmethod
    def validate_check_in(attendance_id):
        attendance = EmployeeAttendance.objects.select_related('site').get(id=attendance_id)
        site = attendance.site
        
        # 1. Geofence Check (PostGIS coordinates)
        dist_meters = AttendanceService.haversine(
            attendance.check_in_location.x, attendance.check_in_location.y,
            site.location.x, site.location.y
        )
        
        if dist_meters > site.geofence_radius_meters:
            attendance.status = 'Rejected'
            attendance.remarks = f'Outside geofence. Distance: {dist_meters:.2f}m'
            attendance.save()
            return False, attendance.status
            
        # 2. Cutoff Time Validation
        local_time = timezone.localtime(attendance.check_in_time).time()
        if local_time > site.attendance_cutoff_time:
            attendance.status = 'Late'
            attendance.remarks = 'Checked in late.'
        else:
            attendance.status = 'Present'
            attendance.remarks = 'On time.'
            
        attendance.save()
        return True, attendance.status
