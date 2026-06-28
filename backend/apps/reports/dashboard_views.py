from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from apps.users.models import User
from apps.sites.models import Site
from apps.labour.models import Labour, LabourAttendance
from apps.attendance.models import EmployeeAttendance

class DashboardStatsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        date_str = request.query_params.get('date')
        if date_str:
            from datetime import datetime
            try:
                target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                target_date = timezone.now().date()
        else:
            target_date = timezone.now().date()
            
        site_id = request.query_params.get('site')
        
        # User/Employee Stats
        if site_id:
            from django.db.models import Q
            total_employees_qs = User.objects.filter(
                Q(site_engineer_assignments__site_id=site_id) | Q(site_assignments__site_id=site_id),
                is_active=True
            ).distinct()
        else:
            total_employees_qs = User.objects.filter(is_active=True)
            
        total_employees = total_employees_qs.count()
        
        att_qs = EmployeeAttendance.objects.filter(work_date=target_date, status__in=['Present', 'Late', 'Half-day'])
        if site_id:
            att_qs = att_qs.filter(site_id=site_id)
        present_employees = att_qs.count()
        absent_employees = total_employees - present_employees
        late_arrivals = att_qs.filter(status='Late').count()
        
        # Calculate real Salary Expense
        from django.db.models import Sum
        salary_sum = total_employees_qs.aggregate(Sum('monthly_base_salary'))['monthly_base_salary__sum'] or 0
        salary_sum = float(salary_sum)
        if salary_sum >= 10000000:
            formatted_salary = f"₹{salary_sum/10000000:.2f}Cr"
        elif salary_sum >= 100000:
            formatted_salary = f"₹{salary_sum/100000:.2f}L"
        elif salary_sum >= 1000:
            formatted_salary = f"₹{salary_sum/1000:.2f}k"
        else:
            formatted_salary = f"₹{int(salary_sum)}"
        
        # Site Stats
        active_sites = 1 if site_id else Site.objects.filter(is_active=True).count()
        
        # Labour Stats
        labour_qs = Labour.objects.filter(status='Active')
        labour_att_qs = LabourAttendance.objects.filter(date=target_date, status='Present')
        if site_id:
            labour_qs = labour_qs.filter(site_id=site_id)
            labour_att_qs = labour_att_qs.filter(site_id=site_id)
            
        total_labour = labour_qs.count()
        labour_present = labour_att_qs.count()
        
        from django.db.models import Count
        # Labour Stats group by skill
        labour_stats = list(labour_qs.values('skill_type').annotate(count=Count('id')))

        # Projects
        from apps.sites.models import SiteEngineerAssignment
        from apps.reports.models import DailySiteReport
        from django.db.models import Q
        projects = []
        site_qs = Site.objects.filter(id=site_id) if site_id else Site.objects.all()
        for site in site_qs[:5]:
            latest_report = DailySiteReport.objects.filter(site=site).order_by('-report_date').first()
            progress = latest_report.progress_percentage if latest_report else 0
            
            engineer_assignment = SiteEngineerAssignment.objects.filter(
                site=site
            ).filter(
                Q(end_date__isnull=True) | Q(end_date__gte=target_date)
            ).select_related('user').first()
            
            engineer_name = engineer_assignment.user.full_name if engineer_assignment else 'Unassigned'
            status_text = 'Active' if site.is_active else 'Inactive'
            
            projects.append({
                'id': str(site.id),
                'name': site.name,
                'progress': progress,
                'engineer': engineer_name,
                'status': status_text,
                'is_active': site.is_active
            })

        # Recent activities (Using AuditLog)
        from apps.audit_logs.models import AuditLog
        activities = []
        for log in AuditLog.objects.select_related('user').order_by('-created_at')[:10]:
            user_name = log.user.full_name if log.user else "System"
            action_map = {'CREATE': 'Created', 'UPDATE': 'Updated', 'DELETE': 'Deleted', 'APPROVE': 'Approved'}
            action_str = action_map.get(log.action, log.action)
            
            # Map module to icon type
            icon_type = 'default'
            if 'site' in log.module.lower(): icon_type = 'info'
            elif 'labour' in log.module.lower() or 'user' in log.module.lower(): icon_type = 'success'
            elif 'attendance' in log.module.lower(): icon_type = 'warning'
            
            activities.append({
                'id': str(log.id),
                'title': f"{action_str} {log.module}",
                'description': f"{user_name} performed {action_str.lower()} action on {log.module} record.",
                'type': icon_type,
                'timestamp': log.created_at.isoformat()
            })

        # Attendance Trends (Last 7 days)
        from datetime import timedelta
        attendance_trends = []
        for i in range(6, -1, -1):
            d = target_date - timedelta(days=i)
            present_count = LabourAttendance.objects.filter(date=d, status='Present').count()
            denom = max(present_count, total_labour, 1)
            percent = int((present_count / denom) * 100)
            attendance_trends.append({
                'date': d.isoformat(),
                'day': d.strftime('%a'),
                'percentage': percent
            })

        return Response({
            'total_employees': total_employees,
            'present_employees': present_employees,
            'absent_employees': absent_employees,
            'late_arrivals': late_arrivals,
            'active_sites': active_sites,
            'total_labour': total_labour,
            'labour_present': labour_present,
            'pending_leaves': 0,
            'monthly_salary_expense': formatted_salary,
            'labour_stats': labour_stats,
            'projects': projects,
            'activities': activities,
            'attendance_trends': attendance_trends
        })
