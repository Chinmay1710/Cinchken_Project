from django.db import models
from apps.common.models import BaseModel
from apps.users.models import User

class AuditLog(BaseModel):
    ACTION_CHOICES = (
        ('CREATE', 'Create'),
        ('UPDATE', 'Update'),
        ('DELETE', 'Delete'),
        ('APPROVE', 'Approve')
    )

    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='audit_logs')
    action = models.CharField(max_length=50, choices=ACTION_CHOICES, db_index=True)
    module = models.CharField(max_length=50, db_index=True)
    record_id = models.CharField(max_length=255, db_index=True)
    old_data = models.JSONField(null=True, blank=True)
    new_data = models.JSONField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        verbose_name = 'Audit Log'
        verbose_name_plural = 'Audit Logs'
        indexes = [
            models.Index(fields=['module', 'record_id']),
            models.Index(fields=['user', 'action']),
        ]

    def __str__(self):
        user_name = self.user.full_name if self.user else "System"
        return f"{self.action} on {self.module} ({self.record_id}) by {user_name}"
