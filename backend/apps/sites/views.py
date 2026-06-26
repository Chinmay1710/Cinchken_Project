from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Site, SiteAssignment, SiteEngineerAssignment, SiteAttendanceSettings, SiteDocument, SiteLevel
from .serializers import SiteSerializer, SiteAssignmentSerializer, SiteEngineerAssignmentSerializer, SiteAttendanceSettingsSerializer, SiteDocumentSerializer, SiteLevelSerializer
from apps.common.permissions import IsAdmin, IsManager

class SiteViewSet(viewsets.ModelViewSet):
    serializer_class = SiteSerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.role in ['ADMIN', 'MANAGER']:
            return Site.objects.all()
            
        # For employees and site engineers, return all active sites so they can select where they are checking in today.
        return Site.objects.filter(is_active=True)

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            self.permission_classes = [IsManager]
        else:
            self.permission_classes = [permissions.IsAuthenticated]
        return super().get_permissions()

class SiteAssignmentViewSet(viewsets.ModelViewSet):
    serializer_class = SiteAssignmentSerializer
    permission_classes = [IsManager]

    def get_queryset(self):
        queryset = SiteAssignment.objects.all()
        site_id = self.request.query_params.get('site')
        if site_id:
            queryset = queryset.filter(site_id=site_id)
        return queryset

    @action(detail=True, methods=['post'])
    def mark_past(self, request, pk=None):
        from django.utils import timezone
        assignment = self.get_object()
        assignment.is_active = False
        assignment.end_date = timezone.now().date()
        assignment.save()
        return Response({'status': 'Marked as past'})

class SiteEngineerAssignmentViewSet(viewsets.ModelViewSet):
    serializer_class = SiteEngineerAssignmentSerializer
    permission_classes = [IsManager]

    def get_queryset(self):
        queryset = SiteEngineerAssignment.objects.all()
        site_id = self.request.query_params.get('site')
        if site_id:
            queryset = queryset.filter(site_id=site_id)
        return queryset

    @action(detail=True, methods=['post'])
    def mark_past(self, request, pk=None):
        from django.utils import timezone
        assignment = self.get_object()
        assignment.end_date = timezone.now().date()
        assignment.save()
        return Response({'status': 'Marked as past'})

class SiteAttendanceSettingsViewSet(viewsets.ModelViewSet):
    serializer_class = SiteAttendanceSettingsSerializer
    permission_classes = [IsManager]
    queryset = SiteAttendanceSettings.objects.all()

class SiteDocumentViewSet(viewsets.ModelViewSet):
    serializer_class = SiteDocumentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = SiteDocument.objects.all().order_by('-created_at')
        site_id = self.request.query_params.get('site')
        if site_id:
            queryset = queryset.filter(site_id=site_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)

class SiteLevelViewSet(viewsets.ModelViewSet):
    serializer_class = SiteLevelSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = SiteLevel.objects.all()
        site_id = self.request.query_params.get('site')
        if site_id:
            queryset = queryset.filter(site_id=site_id)
        return queryset

    def get_permissions(self):
        if self.action in ['create', 'destroy']:
            self.permission_classes = [IsManager]
        else:
            self.permission_classes = [permissions.IsAuthenticated]
        return super().get_permissions()

    @action(detail=True, methods=['patch'])
    def toggle_complete(self, request, pk=None):
        from django.utils import timezone
        level = self.get_object()
        if not level.is_completed:
            level.is_completed = True
            level.completed_at = timezone.now()
            level.completed_by = request.user
        else:
            level.is_completed = False
            level.completed_at = None
            level.completed_by = None
        level.save()
        serializer = self.get_serializer(level)
        return Response(serializer.data)
