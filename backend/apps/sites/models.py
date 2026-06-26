from django.contrib.gis.db import models
from apps.common.models import BaseModel
from apps.users.models import User
import uuid
import os

def upload_site_document_path(instance, filename):
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    return os.path.join('site_documents/', filename)

def upload_report_image_path(instance, filename):
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    return os.path.join('report_images/', filename)

class Site(BaseModel):
    name = models.CharField(max_length=255)
    address = models.TextField()
    location = models.PointField(srid=4326, help_text="GPS coordinates (longitude, latitude)")
    geofence_radius_meters = models.IntegerField(default=50)
    attendance_cutoff_time = models.TimeField()
    start_date = models.DateField(null=True, blank=True)
    target_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'Site'
        verbose_name_plural = 'Sites'
        indexes = [
            models.Index(fields=['name']),
        ]

    def __str__(self):
        return f"{self.name} - {self.address[:20]}"

class SiteAssignment(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='site_assignments')
    site = models.ForeignKey(Site, on_delete=models.CASCADE, related_name='assigned_users')
    assigned_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    end_date = models.DateField(null=True, blank=True)

    class Meta:
        verbose_name = 'Site Assignment'
        verbose_name_plural = 'Site Assignments'
        constraints = [
            models.UniqueConstraint(fields=['user', 'site'], name='unique_user_site_assignment')
        ]

    def __str__(self):
        return f"{self.user.full_name} -> {self.site.name}"

class SiteEngineerAssignment(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='site_engineer_assignments')
    site = models.ForeignKey(Site, on_delete=models.CASCADE, related_name='assigned_engineers')
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name = 'Site Engineer Assignment'
        verbose_name_plural = 'Site Engineer Assignments'

    def __str__(self):
        return f"Eng: {self.user.full_name} -> {self.site.name}"

class SiteAttendanceSettings(BaseModel):
    site = models.OneToOneField(Site, on_delete=models.CASCADE, related_name='attendance_settings')
    attendance_radius = models.IntegerField(default=50, help_text="Radius in meters")
    cutoff_time = models.TimeField(default='09:30:00')

    class Meta:
        verbose_name = 'Site Attendance Setting'
        verbose_name_plural = 'Site Attendance Settings'

    def __str__(self):
        return f"Settings: {self.site.name}"

class SiteDocument(BaseModel):
    DOCUMENT_TYPES = (
        ('Agreement', 'Agreement'),
        ('Drawings', 'Drawings'),
        ('Approvals', 'Approvals'),
        ('Blueprints', 'Blueprints'),
    )
    site = models.ForeignKey(Site, on_delete=models.CASCADE, related_name='documents')
    file = models.FileField(upload_to=upload_site_document_path)
    document_type = models.CharField(max_length=50, choices=DOCUMENT_TYPES)
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='uploaded_documents')

    class Meta:
        verbose_name = 'Site Document'
        verbose_name_plural = 'Site Documents'

    def __str__(self):
        return f"{self.document_type} - {self.site.name}"

class SiteLevel(BaseModel):
    site = models.ForeignKey(Site, on_delete=models.CASCADE, related_name='levels')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    target_date = models.DateField(null=True, blank=True)
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_levels')
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    completed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='completed_levels')

    class Meta:
        verbose_name = 'Site Level'
        verbose_name_plural = 'Site Levels'
        ordering = ['created_at']

    def __str__(self):
        return f"{self.name} - {self.site.name}"
