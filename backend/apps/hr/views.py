from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import LeaveRequest, SalaryRecord, LeaveBalance
from .serializers import LeaveRequestSerializer, SalaryRecordSerializer, LeaveBalanceSerializer
from apps.common.permissions import IsManager, IsAdmin

class LeaveRequestViewSet(viewsets.ModelViewSet):
    serializer_class = LeaveRequestSerializer
    
    def get_queryset(self):
        user = self.request.user
        queryset = LeaveRequest.objects.all().order_by('-created_at')
        if user.role not in ['ADMIN', 'MANAGER']:
            return queryset.filter(employee=user)
            
        employee_id = self.request.query_params.get('employee')
        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)
            
        return queryset

    def perform_create(self, serializer):
        from rest_framework.exceptions import ValidationError
        from apps.users.models import User
        
        employee = self.request.user
        if self.request.user.role in ['ADMIN', 'MANAGER'] and 'employee' in self.request.data:
            try:
                employee = User.objects.get(id=self.request.data['employee'])
            except User.DoesNotExist:
                pass
                
        start_date = serializer.validated_data.get('start_date')
        end_date = serializer.validated_data.get('end_date')
        
        overlapping = LeaveRequest.objects.filter(
            employee=employee,
            status__in=['Pending', 'Approved'],
            start_date__lte=end_date,
            end_date__gte=start_date
        )
        if overlapping.exists():
            raise ValidationError({"detail": "A leave request already exists for these dates."})
            
        serializer.save(employee=employee)

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin | IsManager])
    def approve(self, request, pk=None):
        leave = self.get_object()
        if leave.status != 'Pending':
            return Response({'error': 'Leave is not pending'}, status=400)
            
        leave.status = 'Approved'
        leave.approved_by = request.user
        leave.save()
        
        # Deduct from balance
        try:
            balance = leave.employee.leave_balance
            days = (leave.end_date - leave.start_date).days + 1
            if leave.leave_type == 'Annual':
                balance.annual_leaves_used += days
            elif leave.leave_type == 'Sick':
                balance.sick_leaves_used += days
            balance.save()
        except Exception as e:
            print("Error updating leave balance:", e)

        return Response({'status': 'Leave approved'})

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin | IsManager])
    def reject(self, request, pk=None):
        leave = self.get_object()
        leave.status = 'Rejected'
        leave.approved_by = request.user
        leave.save()
        return Response({'status': 'Leave rejected'})

class SalaryRecordViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = SalaryRecordSerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.role in ['ADMIN', 'MANAGER']:
            return SalaryRecord.objects.all()
        return SalaryRecord.objects.filter(employee=user)

class LeaveBalanceViewSet(viewsets.ModelViewSet):
    serializer_class = LeaveBalanceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role in ['ADMIN', 'MANAGER']:
            return LeaveBalance.objects.all()
        return LeaveBalance.objects.filter(employee=user)
