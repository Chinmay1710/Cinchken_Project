from django.db import models
from apps.common.models import BaseModel
from apps.users.models import User
from apps.sites.models import Site

class Labour(BaseModel):
    SKILL_CHOICES = (
        ('Mason', 'Mason'),
        ('Carpenter', 'Carpenter'),
        ('Electrician', 'Electrician'),
        ('Plumber', 'Plumber'),
        ('Helper', 'Helper'),
        ('Painter', 'Painter'),
        ('Others', 'Others')
    )
    STATUS_CHOICES = (
        ('Active', 'Active'),
        ('Inactive', 'Inactive')
    )
    
    labour_code = models.CharField(max_length=50, unique=True, db_index=True)
    full_name = models.CharField(max_length=255)
    mobile_number = models.CharField(max_length=15, null=True, blank=True)
    skill_type = models.CharField(max_length=50, choices=SKILL_CHOICES, db_index=True)
    daily_wage = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Active')
    site = models.ForeignKey(Site, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_labours')

    class Meta:
        verbose_name = 'Labour'
        verbose_name_plural = 'Labours'
        indexes = [
            models.Index(fields=['labour_code']),
            models.Index(fields=['skill_type']),
        ]

    def __str__(self):
        return f"[{self.labour_code}] {self.full_name} - {self.skill_type}"

class LabourAttendance(BaseModel):
    STATUS_CHOICES = (
        ('Present', 'Present'),
        ('Absent', 'Absent'),
        ('Half-day', 'Half-day')
    )

    labour = models.ForeignKey(Labour, on_delete=models.CASCADE, related_name='attendances')
    site = models.ForeignKey(Site, on_delete=models.CASCADE, related_name='labour_attendances')
    date = models.DateField(db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    marked_by_engineer = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='marked_labour_attendances')
    remarks = models.TextField(blank=True, null=True)
    sync_id = models.UUIDField(unique=True, help_text="Idempotency key for offline sync")

    class Meta:
        verbose_name = 'Labour Attendance'
        verbose_name_plural = 'Labour Attendances'
        constraints = [
            models.UniqueConstraint(fields=['labour', 'date'], name='unique_labour_attendance_per_day')
        ]
        indexes = [
            models.Index(fields=['labour', 'date']),
            models.Index(fields=['site', 'date']),
            models.Index(fields=['sync_id']),
        ]

    def __str__(self):
        return f"{self.labour.full_name} - {self.date} - {self.status}"

class LabourGroupPhoto(BaseModel):
    site = models.ForeignKey(Site, on_delete=models.CASCADE, related_name='labour_group_photos')
    photo_url = models.URLField()
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='uploaded_group_photos')

    class Meta:
        verbose_name = 'Labour Group Photo'
        verbose_name_plural = 'Labour Group Photos'
        ordering = ['-created_at']

    def __str__(self):
        return f"Photo at {self.site.name} by {self.uploaded_by.full_name if self.uploaded_by else 'Unknown'}"
