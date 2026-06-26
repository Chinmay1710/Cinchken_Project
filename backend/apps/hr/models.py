from django.db import models
from apps.common.models import BaseModel
from apps.users.models import User

class LeaveRequest(BaseModel):
    STATUS_CHOICES = (
        ('Pending', 'Pending'),
        ('Approved', 'Approved'),
        ('Rejected', 'Rejected')
    )
    TYPE_CHOICES = (
        ('Annual', 'Annual'),
        ('Sick', 'Sick'),
        ('Unpaid', 'Unpaid')
    )

    employee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='leave_requests')
    leave_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='Annual')
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_leaves')

    class Meta:
        verbose_name = 'Leave Request'
        verbose_name_plural = 'Leave Requests'
        indexes = [
            models.Index(fields=['employee', 'status']),
        ]

    def __str__(self):
        return f"Leave: {self.employee.full_name} ({self.start_date} to {self.end_date}) - {self.status}"

class LeaveBalance(BaseModel):
    employee = models.OneToOneField(User, on_delete=models.CASCADE, related_name='leave_balance')
    annual_leaves_total = models.PositiveIntegerField(default=15)
    sick_leaves_total = models.PositiveIntegerField(default=10)
    annual_leaves_used = models.PositiveIntegerField(default=0)
    sick_leaves_used = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = 'Leave Balance'
        verbose_name_plural = 'Leave Balances'

    def __str__(self):
        return f"Balances for {self.employee.full_name}"

class SalaryRecord(BaseModel):
    employee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='salary_records')
    month_year = models.CharField(max_length=7, help_text="Format: YYYY-MM")
    present_days = models.DecimalField(max_digits=5, decimal_places=1)
    calculated_salary = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, default='Pending')

    class Meta:
        verbose_name = 'Salary Record'
        verbose_name_plural = 'Salary Records'
        constraints = [
            models.UniqueConstraint(fields=['employee', 'month_year'], name='unique_employee_salary_per_month')
        ]
        indexes = [
            models.Index(fields=['employee', 'month_year']),
        ]

    def __str__(self):
        return f"Salary: {self.employee.full_name} - {self.month_year}"
