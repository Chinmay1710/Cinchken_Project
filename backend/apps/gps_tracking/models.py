from django.db import models
from apps.common.models import BaseModel
from apps.users.models import User
from apps.sites.models import Site

class GPSLog(BaseModel):
    employee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='gps_logs')
    site = models.ForeignKey(Site, on_delete=models.SET_NULL, null=True, blank=True, related_name='gps_logs')
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    timestamp = models.DateTimeField(db_index=True)
    sync_id = models.UUIDField(unique=True, help_text="Idempotency key for offline sync")

    class Meta:
        verbose_name = 'GPS Log'
        verbose_name_plural = 'GPS Logs'
        indexes = [
            models.Index(fields=['employee', 'timestamp']),
            models.Index(fields=['sync_id']),
        ]

    def __str__(self):
        return f"GPS: {self.employee.full_name} at {self.timestamp}"
