from django.contrib import admin
from .models import Labour, LabourAttendance

@admin.register(Labour)
class LabourAdmin(admin.ModelAdmin):
    list_display = ('labour_code', 'full_name', 'skill_type', 'daily_wage', 'status')
    search_fields = ('labour_code', 'full_name', 'mobile_number')
    list_filter = ('skill_type', 'status')

@admin.register(LabourAttendance)
class LabourAttendanceAdmin(admin.ModelAdmin):
    list_display = ('labour', 'site', 'date', 'status', 'marked_by_engineer')
    list_filter = ('date', 'status', 'site')
    search_fields = ('labour__full_name', 'labour__labour_code')
