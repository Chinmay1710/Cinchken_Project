from django.contrib import admin
from .models import AuditLog

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('module', 'action', 'record_id', 'user', 'created_at')
    list_filter = ('action', 'module', 'created_at')
    search_fields = ('record_id', 'user__full_name')
    readonly_fields = ('module', 'action', 'record_id', 'user', 'old_data', 'new_data', 'ip_address')
