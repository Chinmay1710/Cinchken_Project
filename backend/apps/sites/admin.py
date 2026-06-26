from django.contrib import admin
from .models import Site, SiteAssignment

@admin.register(Site)
class SiteAdmin(admin.ModelAdmin):
    list_display = ('name', 'geofence_radius_meters', 'attendance_cutoff_time', 'is_active')
    search_fields = ('name', 'address')
    list_filter = ('is_active',)

@admin.register(SiteAssignment)
class SiteAssignmentAdmin(admin.ModelAdmin):
    list_display = ('user', 'site', 'assigned_at')
    search_fields = ('user__full_name', 'site__name')
