from django.contrib import admin
from .models import GPSLog

@admin.register(GPSLog)
class GPSLogAdmin(admin.ModelAdmin):
    list_display = ('employee', 'site', 'latitude', 'longitude', 'timestamp')
    list_filter = ('timestamp', 'site')
    search_fields = ('employee__full_name',)
