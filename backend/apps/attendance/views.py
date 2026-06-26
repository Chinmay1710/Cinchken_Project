from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import EmployeeAttendance
from .serializers import EmployeeAttendanceSerializer
from .tasks import process_attendance_check_in
from django.core.files.storage import default_storage
import os
import logging

logger = logging.getLogger(__name__)

class EmployeeAttendanceViewSet(viewsets.ModelViewSet):
    queryset = EmployeeAttendance.objects.all()
    serializer_class = EmployeeAttendanceSerializer

    def get_queryset(self):
        queryset = EmployeeAttendance.objects.all()
        
        # Apply site filter if provided
        site_id = self.request.query_params.get('site')
        if site_id:
            queryset = queryset.filter(site_id=site_id)
            
        if getattr(self.request.user, 'role', '') in ['ADMIN', 'MANAGER']:
            return queryset
            
        return queryset.filter(employee=self.request.user)

    @action(detail=False, methods=['get'], url_path='active-site')
    def active_site(self, request):
        if request.user.role in ['ADMIN', 'MANAGER']:
            return Response({"active_site": None, "unrestricted": True}, status=status.HTTP_200_OK)
            
        from django.utils import timezone
        today = timezone.now().date()
        today_attendances = EmployeeAttendance.objects.filter(
            employee=request.user, 
            work_date=today,
            status__in=['Present', 'Late', 'Half-day']
        ).order_by('-check_in_time')
        
        latest_attendance = today_attendances.first()
        
        if latest_attendance:
            checked_in_sites = []
            seen = set()
            for att in today_attendances:
                if att.site.id not in seen:
                    checked_in_sites.append({"id": str(att.site.id), "name": att.site.name})
                    seen.add(att.site.id)

            return Response({
                "active_site": {
                    "id": str(latest_attendance.site.id),
                    "name": latest_attendance.site.name
                },
                "assigned_sites": checked_in_sites,
                "unrestricted": False
            }, status=status.HTTP_200_OK)
            
        return Response({"active_site": None, "unrestricted": False}, status=status.HTTP_200_OK)

    def create(self, request, *args, **kwargs):
        # Allow idempotent sync
        sync_id = request.data.get('sync_id')
        if sync_id and EmployeeAttendance.objects.filter(sync_id=sync_id).exists():
            return Response({"message": "Already synced."}, status=status.HTTP_200_OK)

        from django.utils import timezone
        is_admin = getattr(request.user, 'role', '') in ['ADMIN', 'MANAGER']
        
        target_user = request.user
        if is_admin and 'employee_id' in request.data:
            target_user = User.objects.get(id=request.data['employee_id'])
            
        today = request.data.get('work_date', timezone.now().date()) if is_admin else timezone.now().date()
        site_id = request.data.get('site')
        
        # Allow checking in to multiple sites in a day. Only block if checking into the exact SAME site again today.
        existing = EmployeeAttendance.objects.filter(employee=target_user, work_date=today, site_id=site_id).first()
        if existing:
            if is_admin:
                existing.delete()
            elif existing.status == 'Rejected':
                existing.delete()
            else:
                return Response({"detail": "You have already checked in today at this site."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        if is_admin and request.data.get('is_manual'):
            attendance = serializer.save(employee=target_user, status=request.data.get('status', 'Present'), work_date=today)
            return Response({"message": "Attendance manually marked.", "status": attendance.status}, status=status.HTTP_201_CREATED)
        
        # Save record as Pending
        attendance = serializer.save(employee=target_user, work_date=today)
        
        # Process image upload to local storage
        if 'selfie_image' in request.FILES:
            try:
                image_file = request.FILES['selfie_image']
                filename = default_storage.save(f"selfies/{image_file.name}", image_file)
                attendance.selfie_image = f"http://localhost:8001{default_storage.url(filename)}"
                attendance.save()
            except Exception as e:
                logger.error(f"Local upload failed: {str(e)}")
        
        # Offload distance checking and status calculation to Celery
        process_attendance_check_in.delay(attendance.id)
        
        return Response({
            "message": "Attendance check-in received and is being processed.",
            "sync_id": attendance.sync_id,
            "status": "Pending"
        }, status=status.HTTP_202_ACCEPTED)
