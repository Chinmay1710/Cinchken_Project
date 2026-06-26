from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from .models import GPSLog
from .serializers import BulkGPSLogSerializer
from apps.common.permissions import IsEmployee

class GPSLogViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request):
        serializer = BulkGPSLogSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        created_logs = serializer.save()
        
        return Response({
            "message": f"{len(created_logs)} GPS logs synced successfully."
        }, status=status.HTTP_201_CREATED)
