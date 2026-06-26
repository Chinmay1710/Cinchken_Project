from django.contrib import admin
from .models import EmployeeAttendance

@admin.register(EmployeeAttendance)
class EmployeeAttendanceAdmin(admin.ModelAdmin):
    list_display = ('employee', 'site', 'work_date', 'check_in_time', 'status', 'selfie_verified')
    list_filter = ('work_date', 'status', 'selfie_verified', 'site')
    search_fields = ('employee__full_name', 'employee__mobile_number')
