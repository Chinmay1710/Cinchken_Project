from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Sum, Q
from django.utils import timezone
from .models import Material, SiteInventory, MaterialInward, MaterialConsumption, MaterialRequest
from .serializers import (
    MaterialSerializer, SiteInventorySerializer, MaterialInwardSerializer,
    MaterialConsumptionSerializer, MaterialRequestSerializer, StockHistorySerializer
)
from apps.common.permissions import IsAdmin, IsManager, IsSiteEngineer
from apps.sites.models import SiteEngineerAssignment, SiteAssignment

class BaseInventoryViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        # Apply site query parameter filtering
        site_id = self.request.query_params.get('site')
        if site_id:
            queryset = queryset.filter(site_id=site_id)
        
        # Super Admins and Admins see all
        if user.role == 'ADMIN' or user.is_superuser:
            return queryset
            
        if user.role == 'MANAGER':
            return queryset
            
        if user.role == 'SITE_ENGINEER':
            assigned_site_ids = SiteEngineerAssignment.objects.filter(user=user).values_list('site_id', flat=True)
            return queryset.filter(site_id__in=assigned_site_ids)
            
        return queryset

class MaterialViewSet(viewsets.ModelViewSet):
    queryset = Material.objects.all()
    serializer_class = MaterialSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsAdmin()]
        return [permissions.IsAuthenticated()]

class SiteInventoryViewSet(BaseInventoryViewSet):
    queryset = SiteInventory.objects.all()
    serializer_class = SiteInventorySerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'])
    def stock_history(self, request):
        site_id = request.query_params.get('site')
        material_id = request.query_params.get('material')
        
        if not site_id or not material_id:
            return Response({"error": "Both site and material parameters are required."}, status=400)
            
        inwards = MaterialInward.objects.filter(site_id=site_id, material_id=material_id)
        consumptions = MaterialConsumption.objects.filter(site_id=site_id, material_id=material_id)
        
        history = []
        for inv in inwards:
            history.append({
                'id': inv.id,
                'date': inv.date,
                'transaction_type': 'INWARD',
                'quantity': inv.quantity,
                'reference': inv.invoice_number or inv.vendor_name,
                'created_at': inv.created_at
            })
            
        for con in consumptions:
            history.append({
                'id': con.id,
                'date': con.date,
                'transaction_type': 'CONSUMPTION',
                'quantity': con.quantity_used,
                'reference': con.remarks or con.used_by,
                'created_at': con.created_at
            })
            
        # Sort by date descending, then created_at descending
        history.sort(key=lambda x: (x['date'], x['created_at']), reverse=True)
        
        # Calculate balance iteratively (this is simpler if we sort ascending first)
        history.sort(key=lambda x: (x['date'], x['created_at']))
        balance = 0
        for item in history:
            if item['transaction_type'] == 'INWARD':
                balance += item['quantity']
            else:
                balance -= item['quantity']
            item['balance'] = balance
            
        # Re-sort descending for the UI
        history.sort(key=lambda x: (x['date'], x['created_at']), reverse=True)
        
        return Response(history)

class MaterialInwardViewSet(BaseInventoryViewSet):
    queryset = MaterialInward.objects.all().order_by('-date', '-created_at')
    serializer_class = MaterialInwardSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsSiteEngineer()]
        return [permissions.IsAuthenticated()]

class MaterialConsumptionViewSet(BaseInventoryViewSet):
    queryset = MaterialConsumption.objects.all().order_by('-date', '-created_at')
    serializer_class = MaterialConsumptionSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsSiteEngineer()]
        return [permissions.IsAuthenticated()]

class MaterialRequestViewSet(BaseInventoryViewSet):
    queryset = MaterialRequest.objects.all().order_by('-created_at')
    serializer_class = MaterialRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(requested_by=self.request.user)
        
    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        if request.user.role not in ['ADMIN', 'MANAGER'] and not request.user.is_superuser:
            return Response({"error": "Permission denied. Only Admin or Manager can approve requests."}, status=status.HTTP_403_FORBIDDEN)
            
        req = self.get_object()
        new_status = request.data.get('status')
        if new_status not in dict(MaterialRequest.STATUS_CHOICES):
            return Response({"error": "Invalid status."}, status=400)
            
        req.status = new_status
        req.save()
        return Response(self.get_serializer(req).data)

class InventoryDashboardViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        site_id = request.query_params.get('site')
        user = request.user
        
        # Base querysets
        inventory_qs = SiteInventory.objects.all()
        inward_qs = MaterialInward.objects.all()
        consumption_qs = MaterialConsumption.objects.all()
        
        if site_id:
            inventory_qs = inventory_qs.filter(site_id=site_id)
            inward_qs = inward_qs.filter(site_id=site_id)
            consumption_qs = consumption_qs.filter(site_id=site_id)
        elif user.role == 'SITE_ENGINEER':
            assigned_site_ids = SiteEngineerAssignment.objects.filter(user=user).values_list('site_id', flat=True)
            inventory_qs = inventory_qs.filter(site_id__in=assigned_site_ids)
            inward_qs = inward_qs.filter(site_id__in=assigned_site_ids)
            consumption_qs = consumption_qs.filter(site_id__in=assigned_site_ids)

        # 1. Total Materials (types of material available)
        total_materials = inventory_qs.values('material').distinct().count()
        
        # 2. Low Stock Items
        low_stock_count = 0
        low_stock_alerts = []
        for inv in inventory_qs.select_related('material', 'site'):
            if inv.current_quantity < inv.material.minimum_stock:
                low_stock_count += 1
                low_stock_alerts.append({
                    'material_name': inv.material.material_name,
                    'site_name': inv.site.name,
                    'current_quantity': float(inv.current_quantity),
                    'minimum_stock': float(inv.material.minimum_stock)
                })
                
        # 3. Total Inventory Value
        total_value = 0.0
        # Calculate dynamic value
        for inv in inventory_qs:
            latest_inward = MaterialInward.objects.filter(site=inv.site_id, material=inv.material_id).order_by('-date', '-created_at').first()
            if latest_inward and latest_inward.unit_price:
                total_value += float(inv.current_quantity * latest_inward.unit_price)

        # 4. Today's Consumption
        today = timezone.localdate()
        today_consumption = consumption_qs.filter(date=today).count()
        
        return Response({
            'total_materials': total_materials,
            'low_stock_count': low_stock_count,
            'total_value': total_value,
            'today_consumption': today_consumption,
            'low_stock_alerts': low_stock_alerts
        })
