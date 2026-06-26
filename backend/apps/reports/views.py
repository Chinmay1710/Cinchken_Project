from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import DailySiteReport, SiteReportImage
from .serializers import DailySiteReportSerializer, DailySiteReportCreateSerializer
from apps.common.permissions import IsSiteEngineer, IsManager, IsAdmin
import cloudinary.uploader
import logging

logger = logging.getLogger(__name__)

class DailySiteReportViewSet(viewsets.ModelViewSet):
    queryset = DailySiteReport.objects.all().order_by('-report_date')
    permission_classes = [IsAdmin | IsManager | IsSiteEngineer]

    def get_serializer_class(self):
        if self.action == 'create':
            return DailySiteReportCreateSerializer
        return DailySiteReportSerializer
        
    def get_queryset(self):
        queryset = super().get_queryset()
        site_id = self.request.query_params.get('site')
        if site_id:
            queryset = queryset.filter(site_id=site_id)

        user = self.request.user
        if user.role == 'ADMIN':
            return queryset
        elif user.role == 'MANAGER':
            return queryset
        else:
            return queryset.filter(submitted_by=user)

    @action(detail=False, methods=['get'])
    def prefill(self, request):
        site_id = request.query_params.get('site')
        date_str = request.query_params.get('date')
        if not site_id or not date_str:
            return Response({"error": "site and date are required"}, status=status.HTTP_400_BAD_REQUEST)

        # Manpower
        from apps.attendance.models import EmployeeAttendance
        attendances = EmployeeAttendance.objects.filter(site_id=site_id, work_date=date_str, status='Present').select_related('employee')
        manpower = [{"name_of_labour": a.employee.full_name, "category": a.employee.role} for a in attendances]

        # Materials
        from apps.inventory.models import MaterialInward, MaterialConsumption
        inwards = MaterialInward.objects.filter(site_id=site_id, date=date_str).select_related('material')
        consumptions = MaterialConsumption.objects.filter(site_id=site_id, date=date_str).select_related('material')
        
        materials = []
        for inv in inwards:
            materials.append({
                "description": inv.material.material_name,
                "supplier_name": inv.vendor_name,
                "challan_no": inv.invoice_number or "",
                "unit": inv.material.unit,
                "quantity": float(inv.quantity),
                "amount": float(inv.quantity * inv.unit_price),
            })
        for cons in consumptions:
            materials.append({
                "description": f"Consumed: {cons.material.material_name}",
                "supplier_name": "-",
                "challan_no": "-",
                "unit": cons.material.unit,
                "quantity": float(cons.quantity_used),
                "amount": 0,
            })

        # Equipments
        from apps.equipment.models import EquipmentLog
        equipment_logs = EquipmentLog.objects.filter(site_id=site_id, date=date_str).select_related('equipment')
        equipments = [{
            "machine_supplier_name": f"{log.equipment.name} / {log.equipment.supplier_name or ''}",
            "start_time": log.start_time,
            "end_time": log.end_time,
            "total_hours": float(log.total_hours),
            "remarks": log.remarks or ""
        } for log in equipment_logs]

        # Expenses
        from apps.finance.models import SiteExpense
        expenses_logs = SiteExpense.objects.filter(site_id=site_id, date=date_str)
        expenses = [{
            "amount_received": float(exp.amount_received),
            "particulars": exp.particulars,
            "expense_amount": float(exp.expense_amount),
            "closing_balance": float(exp.closing_balance)
        } for exp in expenses_logs]

        return Response({
            "manpower_details": manpower,
            "material_details": materials,
            "equipment_details": equipments,
            "expense_details": expenses,
            "work_reports": [],
            "planning_details": []
        })

    def create(self, request, *args, **kwargs):
        sync_id = request.data.get('sync_id')
        if sync_id and DailySiteReport.objects.filter(sync_id=sync_id).exists():
            return Response({"message": "Already synced."}, status=status.HTTP_200_OK)

        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        report = serializer.save()
        
        # Process images
        if 'images' in request.FILES:
            images = request.FILES.getlist('images')
            for image in images:
                try:
                    upload_data = cloudinary.uploader.upload(image, folder="ck_erp/site_reports")
                    SiteReportImage.objects.create(
                        report=report,
                        image_url=upload_data.get('secure_url')
                    )
                except Exception as e:
                    logger.error(f"Cloudinary upload failed for report {report.id}: {str(e)}")

        return Response({
            "message": "Site report uploaded successfully.",
            "sync_id": report.sync_id
        }, status=status.HTTP_201_CREATED)
