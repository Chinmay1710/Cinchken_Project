from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from calendar import monthrange
import datetime

from .models import PayrollRecord, SiteExpense
from .serializers import PayrollSerializer, SiteExpenseSerializer
from rest_framework import permissions
from apps.users.models import User
from apps.attendance.models import EmployeeAttendance
from apps.hr.models import LeaveRequest
from datetime import timedelta

class SiteExpenseViewSet(viewsets.ModelViewSet):
    serializer_class = SiteExpenseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = SiteExpense.objects.all().order_by('-date', '-created_at')
        site_id = self.request.query_params.get('site')
        date = self.request.query_params.get('date')
        if site_id:
            queryset = queryset.filter(site_id=site_id)
        if date:
            queryset = queryset.filter(date=date)
        return queryset

    def perform_create(self, serializer):
        serializer.save(logged_by=self.request.user)

class PayrollViewSet(viewsets.ModelViewSet):
    queryset = PayrollRecord.objects.select_related('employee').all()
    serializer_class = PayrollSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        month = self.request.query_params.get('month')
        year = self.request.query_params.get('year')
        employee_id = self.request.query_params.get('employee_id')
        
        if month:
            queryset = queryset.filter(month=month)
        if year:
            queryset = queryset.filter(year=year)
        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)
            
        return queryset

    @action(detail=False, methods=['post'])
    def generate_payroll(self, request):
        month = request.data.get('month')
        year = request.data.get('year')

        if not month or not year:
            return Response({"error": "month and year are required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            month = int(month)
            year = int(year)
        except ValueError:
            return Response({"error": "month and year must be integers"}, status=status.HTTP_400_BAD_REQUEST)

        total_days = monthrange(year, month)[1]
        
        # Calculate number of Sundays in the month
        sundays_in_month = sum(1 for day in range(1, total_days + 1) if datetime.date(year, month, day).weekday() == 6)

        # Get all users with a base salary
        users = User.objects.filter(is_active=True, monthly_base_salary__isnull=False)

        records_created_or_updated = 0

        with transaction.atomic():
            for user in users:
                base_salary = user.monthly_base_salary
                if not base_salary or base_salary <= 0:
                    continue

                daily_wage = float(base_salary) / total_days

                attendances = EmployeeAttendance.objects.filter(
                    employee=user,
                    work_date__month=month,
                    work_date__year=year
                )

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
                        curr_date += timedelta(days=1)

                present_count = 0.0
                late_count = 0.0
                half_day_count = 0.0

                for att_status in daily_status.values():
                    if att_status == 'Present':
                        present_count += 1.0
                    elif att_status == 'Half-day':
                        present_count += 0.5
                        half_day_count += 1.0
                    elif att_status == 'Late':
                        present_count += 1.0
                        late_count += 1.0

                # Formula: [ ( Working days (selfie/present) + Sunday ) / total month days ] * salary amount
                paid_days = present_count + sundays_in_month
                
                # Cap paid_days at total_days to prevent paying more than base salary
                if paid_days > total_days:
                    paid_days = total_days
                    
                net_salary = float(base_salary) * (paid_days / total_days)
                
                # Calculate deductions based on new net salary
                default_deductions = float(base_salary) - net_salary
                
                default_deductions = round(default_deductions, 2)
                net_salary = round(net_salary, 2)

                try:
                    record = PayrollRecord.objects.get(employee=user, month=month, year=year)
                    created = False
                except PayrollRecord.DoesNotExist:
                    record = PayrollRecord(employee=user, month=month, year=year)
                    created = True

                if record.status != 'Paid':
                    record.total_days = total_days
                    record.present_days = present_count
                    record.base_salary = base_salary
                    record.deductions = default_deductions
                    record.net_salary = net_salary
                    if created:
                        record.status = 'Calculated'
                    record.save()
                    records_created_or_updated += 1

        return Response({"message": f"Generated payroll for {records_created_or_updated} employees."}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def process_payments(self, request):
        month = request.data.get('month')
        year = request.data.get('year')

        if not month or not year:
            return Response({"error": "month and year are required"}, status=status.HTTP_400_BAD_REQUEST)

        records = PayrollRecord.objects.filter(month=month, year=year, status__in=['Calculated', 'Review Required'])
        updated_count = records.update(status='Paid')

        return Response({"message": f"Marked {updated_count} payroll records as Paid."}, status=status.HTTP_200_OK)
