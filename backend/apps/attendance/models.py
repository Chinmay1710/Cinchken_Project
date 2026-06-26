from django.contrib.gis.db import models
from apps.common.models import BaseModel
from apps.users.models import User
from apps.sites.models import Site

class EmployeeAttendance(BaseModel):
    STATUS_CHOICES = (
        ('Present', 'Present'),
        ('Absent', 'Absent'),
        ('Late', 'Late'),
        ('Half-day', 'Half-day'),
        ('Pending', 'Pending'),
        ('Rejected', 'Rejected')
    )
    
    employee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='attendances')
    site = models.ForeignKey(Site, on_delete=models.CASCADE, related_name='attendances')
    work_date = models.DateField(db_index=True)
    check_in_time = models.DateTimeField()
    
    check_in_location = models.PointField(srid=4326, help_text="GPS coordinates (longitude, latitude)")
    
    selfie_image = models.URLField(blank=True, null=True)
    selfie_verified = models.BooleanField(default=True)
    face_match_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    sync_id = models.UUIDField(unique=True, help_text="Idempotency key for offline sync")
    remarks = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name = 'Employee Attendance'
        verbose_name_plural = 'Employee Attendances'
        constraints = [
            models.UniqueConstraint(fields=['employee', 'work_date', 'site'], name='unique_employee_attendance_per_site_per_day')
        ]
        indexes = [
            models.Index(fields=['employee', 'work_date']),
            models.Index(fields=['site', 'work_date']),
            models.Index(fields=['sync_id']),
        ]
        ordering = ['-work_date', '-check_in_time']

    def __str__(self):
        return f"{self.employee.full_name} - {self.work_date} - {self.status}"
