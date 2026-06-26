from rest_framework import viewsets, permissions, status, parsers
from rest_framework.response import Response
from rest_framework.decorators import action
from django.core.files.storage import default_storage
from .models import Labour, LabourAttendance, LabourGroupPhoto
from .serializers import LabourSerializer, BulkLabourAttendanceSerializer, LabourAttendanceSerializer, LabourGroupPhotoSerializer
from apps.common.permissions import IsSiteEngineer, IsManager, IsAdmin

class LabourViewSet(viewsets.ModelViewSet):
    queryset = Labour.objects.all()
    serializer_class = LabourSerializer
    permission_classes = [IsAdmin | IsManager | IsSiteEngineer]

    def get_queryset(self):
        queryset = super().get_queryset()
        site = self.request.query_params.get('site')
        if site:
            queryset = queryset.filter(site_id=site)
        return queryset

    @action(detail=False, methods=['get'])
    def weekly_wages(self, request):
        site_id = request.query_params.get('site')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        if not site_id or not start_date or not end_date:
            return Response({"error": "site, start_date, and end_date are required."}, status=status.HTTP_400_BAD_REQUEST)

        labourers = Labour.objects.filter(site_id=site_id)
        
        results = []
        for labour in labourers:
            attendances = LabourAttendance.objects.filter(
                labour=labour,
                date__gte=start_date,
                date__lte=end_date
            )
            
            payable_days = 0.0
            for att in attendances:
                if att.status == 'Present':
                    payable_days += 1.0
                elif att.status == 'Half-day':
                    payable_days += 0.5
                    
            total_wage = round(payable_days * float(labour.daily_wage), 2)
            
            # Optionally only include if they have payable days, but showing 0 is good for audit
            results.append({
                "id": str(labour.id),
                "labour_code": labour.labour_code,
                "full_name": labour.full_name,
                "skill_type": labour.skill_type,
                "daily_wage": float(labour.daily_wage),
                "payable_days": payable_days,
                "total_wage": total_wage,
                "status": labour.status
            })
            
        return Response(results, status=status.HTTP_200_OK)

class LabourGroupPhotoViewSet(viewsets.ModelViewSet):
    queryset = LabourGroupPhoto.objects.all()
    serializer_class = LabourGroupPhotoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        site = self.request.query_params.get('site')
        if site:
            queryset = queryset.filter(site_id=site)
        return queryset

    def create(self, request, *args, **kwargs):
        site_id = request.data.get('site')
        if not site_id:
            return Response({"error": "site is required"}, status=status.HTTP_400_BAD_REQUEST)

        if 'photo' not in request.FILES:
            return Response({"error": "photo file is required"}, status=status.HTTP_400_BAD_REQUEST)

        photo_file = request.FILES['photo']
        try:
            filename = default_storage.save(f"labour_group_photos/{photo_file.name}", photo_file)
            photo_url = f"http://localhost:8001{default_storage.url(filename)}"
            
            from apps.sites.models import Site
            site = Site.objects.get(id=site_id)
            
            photo = LabourGroupPhoto.objects.create(
                site=site,
                photo_url=photo_url,
                uploaded_by=request.user
            )
            serializer = self.get_serializer(photo)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class LabourAttendanceViewSet(viewsets.ModelViewSet):
    queryset = LabourAttendance.objects.all()
    serializer_class = LabourAttendanceSerializer
    permission_classes = [IsAdmin | IsSiteEngineer]

    def get_queryset(self):
        queryset = super().get_queryset()
        date = self.request.query_params.get('date')
        site = self.request.query_params.get('site')
        if date:
            queryset = queryset.filter(date=date)
        if site:
            queryset = queryset.filter(site_id=site)
        return queryset

    @action(detail=False, methods=['post'])
    def bulk_mark(self, request):
        serializer = BulkLabourAttendanceSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        created_records = serializer.save()
        
        return Response({
            "message": "Labour attendance marked successfully.",
            "records_processed": len(created_records)
        }, status=status.HTTP_201_CREATED)
