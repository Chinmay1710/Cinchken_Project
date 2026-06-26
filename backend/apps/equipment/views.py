from rest_framework import viewsets, permissions
from .models import Equipment, EquipmentLog, DieselLog
from .serializers import EquipmentSerializer, EquipmentLogSerializer, DieselLogSerializer

class EquipmentViewSet(viewsets.ModelViewSet):
    queryset = Equipment.objects.all().order_by('name')
    serializer_class = EquipmentSerializer
    permission_classes = [permissions.IsAuthenticated]

class EquipmentLogViewSet(viewsets.ModelViewSet):
    serializer_class = EquipmentLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = EquipmentLog.objects.all().order_by('-date', '-created_at')
        site_id = self.request.query_params.get('site')
        date = self.request.query_params.get('date')
        if site_id:
            queryset = queryset.filter(site_id=site_id)
        if date:
            queryset = queryset.filter(date=date)
        return queryset

    def perform_create(self, serializer):
        serializer.save(logged_by=self.request.user)

class DieselLogViewSet(viewsets.ModelViewSet):
    queryset = DieselLog.objects.all().order_by('-date', '-created_at')
    serializer_class = DieselLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        site_id = self.request.query_params.get('site', None)
        date = self.request.query_params.get('date', None)
        if site_id:
            queryset = queryset.filter(site_id=site_id)
        if date:
            queryset = queryset.filter(date=date)
        return queryset

    def perform_create(self, serializer):
        serializer.save(logged_by=self.request.user)
