from django.contrib import admin
from .models import LeaveRequest, SalaryRecord

@admin.register(LeaveRequest)
class LeaveRequestAdmin(admin.ModelAdmin):
    list_display = ('employee', 'start_date', 'end_date', 'status', 'approved_by')
    list_filter = ('status', 'start_date')
    search_fields = ('employee__full_name',)

@admin.register(SalaryRecord)
class SalaryRecordAdmin(admin.ModelAdmin):
    list_display = ('employee', 'month_year', 'calculated_salary', 'status')
    list_filter = ('status', 'month_year')
    search_fields = ('employee__full_name',)
