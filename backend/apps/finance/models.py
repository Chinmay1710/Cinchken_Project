from django.db import models
from apps.common.models import BaseModel
from django.conf import settings

class PayrollRecord(BaseModel):
    STATUS_CHOICES = (
        ('Calculated', 'Calculated'),
        ('Review Required', 'Review Required'),
        ('Paid', 'Paid'),
    )

    employee = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='payrolls')
    month = models.IntegerField()
    year = models.IntegerField()
    total_days = models.IntegerField()
    present_days = models.FloatField()
    base_salary = models.DecimalField(max_digits=12, decimal_places=2)
    deductions = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    net_salary = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Calculated')

    class Meta:
        verbose_name = 'Payroll Record'
        verbose_name_plural = 'Payroll Records'
        unique_together = ('employee', 'month', 'year')
        indexes = [
            models.Index(fields=['month', 'year']),
        ]

    def __str__(self):
        return f"Payroll {self.employee.full_name} - {self.month}/{self.year}"

class SiteExpense(BaseModel):
    from apps.sites.models import Site
    site = models.ForeignKey(Site, on_delete=models.CASCADE, related_name='expenses')
    date = models.DateField(db_index=True)
    amount_received = models.DecimalField(max_digits=12, decimal_places=2, default=0, help_text="Amount received for petty cash / expenses")
    particulars = models.CharField(max_length=500, help_text="Amount Received by / Expenses Particulars")
    expense_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    closing_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    logged_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)

    class Meta:
        verbose_name = 'Site Expense'
        verbose_name_plural = 'Site Expenses'
        indexes = [
            models.Index(fields=['site', 'date']),
        ]

    def __str__(self):
        return f"Expense {self.site.name} - {self.date} - {self.expense_amount}"
