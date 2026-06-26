from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import User
from .serializers import UserSerializer, RegisterSerializer
from apps.common.permissions import IsAdmin

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'destroy']:
            self.permission_classes = [IsAdmin]
        else:
            self.permission_classes = [permissions.IsAuthenticated]
        return super().get_permissions()

    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def profile(self, request, pk=None):
        user = self.get_object()
        serializer = self.get_serializer(user)
        data = serializer.data

        # 1. Site Assignments
        from apps.sites.models import SiteAssignment, SiteEngineerAssignment
        from django.utils import timezone
        
        sites_data = []
        
        # Regular worker assignments
        worker_assignments = SiteAssignment.objects.filter(user=user).select_related('site')
        for a in worker_assignments:
            sites_data.append({
                'id': a.site.id,
                'assignment_id': a.id,
                'type': 'WORKER',
                'name': a.site.name,
                'address': a.site.address,
                'is_active': a.is_active
            })
            
        # Engineer assignments
        engineer_assignments = SiteEngineerAssignment.objects.filter(user=user).select_related('site')
        for a in engineer_assignments:
            is_active = a.end_date is None or a.end_date >= timezone.now().date()
            sites_data.append({
                'id': a.site.id,
                'assignment_id': a.id,
                'type': 'ENGINEER',
                'name': a.site.name,
                'address': a.site.address,
                'is_active': is_active
            })
            
        data['site_assignments'] = sites_data

        # 2. Attendance Stats (Current Month)
        from django.utils import timezone
        import datetime
        from calendar import monthrange
        from apps.attendance.models import EmployeeAttendance
        from apps.hr.models import LeaveRequest

        now = timezone.now()
        year, month = now.year, now.month
        total_days = monthrange(year, month)[1]
        
        attendances = EmployeeAttendance.objects.filter(employee=user, work_date__month=month, work_date__year=year)
        daily_status = {}
        for att in attendances:
            score = 0
            if att.status == 'Present': score = 3
            elif att.status == 'Late': score = 2
            elif att.status == 'Half-day': score = 1
            
            curr_score = 0
            if att.work_date in daily_status:
                curr_status = daily_status[att.work_date]
                if curr_status == 'Present': curr_score = 3
                elif curr_status == 'Late': curr_score = 2
                elif curr_status == 'Half-day': curr_score = 1
                
            if score > curr_score:
                daily_status[att.work_date] = att.status

        # Add Approved Sick leaves as 'Present'
        month_start = datetime.date(year, month, 1)
        month_end = datetime.date(year, month, total_days)
        sick_leaves = LeaveRequest.objects.filter(
            employee=user,
            leave_type='Sick',
            status='Approved',
            start_date__lte=month_end,
            end_date__gte=month_start
        )
        
        for leave in sick_leaves:
            curr_date = leave.start_date
            while curr_date <= leave.end_date:
                if curr_date.month == month and curr_date.year == year:
                    curr_score = 0
                    if curr_date in daily_status:
                        curr_status = daily_status[curr_date]
                        if curr_status == 'Present': curr_score = 3
                        elif curr_status == 'Late': curr_score = 2
                        elif curr_status == 'Half-day': curr_score = 1
                    if 3 > curr_score:
                        daily_status[curr_date] = 'Present'
                curr_date += datetime.timedelta(days=1)

        present_count = 0.0
        attendance_log = []
        for date_obj, status_val in daily_status.items():
            if status_val == 'Present':
                present_count += 1.0
            elif status_val == 'Half-day':
                present_count += 0.5
            elif status_val == 'Late':
                present_count += 1.0
            
            attendance_log.append({
                'date': date_obj.isoformat(),
                'status': status_val
            })
        
        data['attendance_stats'] = {
            'month': month,
            'year': year,
            'present_days': present_count,
            'total_days_in_month': total_days,
            'rate_percentage': round((present_count / total_days) * 100, 1) if total_days else 0,
            'log': attendance_log
        }

        # 3. Latest Salary Payout
        from apps.finance.models import PayrollRecord
        latest_payroll = PayrollRecord.objects.filter(employee=user).order_by('-year', '-month').first()
        if latest_payroll:
            data['latest_payroll'] = {
                'month': latest_payroll.month,
                'year': latest_payroll.year,
                'net_salary': float(latest_payroll.net_salary),
                'status': latest_payroll.status
            }
        else:
            data['latest_payroll'] = None

        # 4. Leave Balance
        from apps.hr.models import LeaveBalance
        try:
            balance = LeaveBalance.objects.get(employee=user)
            data['leave_balance'] = {
                'annual_leaves_total': balance.annual_leaves_total,
                'sick_leaves_total': balance.sick_leaves_total,
                'annual_leaves_used': balance.annual_leaves_used,
                'sick_leaves_used': balance.sick_leaves_used,
            }
        except LeaveBalance.DoesNotExist:
            data['leave_balance'] = None

        return Response(data)

    @action(detail=True, methods=['post'], url_path='update_leave_balance')
    def update_leave_balance(self, request, pk=None):
        if request.user.role not in ['ADMIN', 'MANAGER']:
            return Response({'detail': 'Not permitted.'}, status=status.HTTP_403_FORBIDDEN)
        
        user = self.get_object()
        from apps.hr.models import LeaveBalance
        balance, _ = LeaveBalance.objects.get_or_create(employee=user)
        
        annual_total = request.data.get('annual_leaves_total')
        sick_total = request.data.get('sick_leaves_total')
        
        if annual_total is not None:
            balance.annual_leaves_total = int(annual_total)
        if sick_total is not None:
            balance.sick_leaves_total = int(sick_total)
            
        balance.save()
        return Response({'status': 'Leave balance updated'})
