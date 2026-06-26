from django.db import models
from apps.common.models import BaseModel
from apps.users.models import User

class Notification(BaseModel):
    NOTIFICATION_TYPES = (
        ('PUSH', 'Push Notification'),
        ('SMS', 'SMS'),
        ('WHATSAPP', 'WhatsApp'),
        ('EMAIL', 'Email'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    notification_type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES, default='PUSH')
    is_read = models.BooleanField(default=False)

    class Meta:
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'
        indexes = [
            models.Index(fields=['user', 'is_read']),
        ]

    def __str__(self):
        return f"To {self.user.full_name}: {self.title} [{self.notification_type}]"
