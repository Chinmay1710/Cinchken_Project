from celery import shared_task
from .services import AttendanceService
from .models import EmployeeAttendance

@shared_task
def process_attendance_check_in(attendance_id):
    """
    Background task to validate GPS and cutoff rules for a check-in.
    Image upload is assumed to be handled synchronously in the view before this task
    or via a direct stream to Cloudinary to avoid passing large binaries into Celery.
    """
    try:
        attendance = EmployeeAttendance.objects.get(id=attendance_id)
        
        # Validate GPS and status
        success, status = AttendanceService.validate_check_in(attendance.id)
        
        # Future: Trigger notification here
        # send_push_notification_task.delay(attendance.employee_id, f"Attendance marked: {status}")
        
        return f"Processed {attendance_id}: {status}"
    except EmployeeAttendance.DoesNotExist:
        return f"Error: Attendance {attendance_id} not found."
