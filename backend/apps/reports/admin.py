from django.contrib import admin
from .models import DailySiteReport, SiteReportImage

class SiteReportImageInline(admin.TabularInline):
    model = SiteReportImage
    extra = 1

@admin.register(DailySiteReport)
class DailySiteReportAdmin(admin.ModelAdmin):
    list_display = ('site', 'report_date', 'submitted_by')
    list_filter = ('report_date', 'site')
    search_fields = ('site__name', 'submitted_by__full_name')
    inlines = [SiteReportImageInline]
