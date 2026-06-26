from rest_framework import viewsets
from .models import AuditLog
from .serializers import AuditLogSerializer
from apps.common.permissions import IsAdmin

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all().order_by('-created_at')
    serializer_class = AuditLogSerializer
    permission_classes = [IsAdmin]
