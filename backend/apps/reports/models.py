from django.db import models
from apps.common.models import BaseModel
from apps.users.models import User
from apps.sites.models import Site

class DailySiteReport(BaseModel):
    site = models.ForeignKey(Site, on_delete=models.CASCADE, related_name='reports')
    submitted_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='submitted_reports')
    report_date = models.DateField(db_index=True)
    work_summary = models.TextField()
    labour_count = models.IntegerField(default=0)
    material_used = models.TextField(blank=True, null=True)
    issues_faced = models.TextField(blank=True, null=True)
    progress_percentage = models.IntegerField(default=0, help_text="0-100")
    sync_id = models.UUIDField(unique=True, help_text="Idempotency key for offline sync")

    class Meta:
        verbose_name = 'Daily Site Report'
        verbose_name_plural = 'Daily Site Reports'
        constraints = [
            models.UniqueConstraint(fields=['site', 'report_date'], name='unique_site_report_per_day')
        ]
        indexes = [
            models.Index(fields=['site', 'report_date']),
            models.Index(fields=['sync_id']),
        ]

    def __str__(self):
        return f"Report: {self.site.name} - {self.report_date}"

class SiteReportImage(BaseModel):
    report = models.ForeignKey(DailySiteReport, related_name='images', on_delete=models.CASCADE)
    image = models.ImageField(upload_to='report_images/', null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Site Report Image'
        verbose_name_plural = 'Site Report Images'

    def __str__(self):
        return f"Image for {self.report}"

class DPRWorkReport(models.Model):
    report = models.ForeignKey(DailySiteReport, related_name='work_reports', on_delete=models.CASCADE)
    nature_of_work = models.CharField(max_length=500)
    nos = models.IntegerField(default=0, null=True, blank=True)
    length = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    width = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    height = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)

class DPRManpower(models.Model):
    report = models.ForeignKey(DailySiteReport, related_name='manpower_details', on_delete=models.CASCADE)
    name_of_labour = models.CharField(max_length=255)
    category = models.CharField(max_length=100) # Labour, Helper, Carpenter, Mason

class DPRMaterial(models.Model):
    report = models.ForeignKey(DailySiteReport, related_name='material_details', on_delete=models.CASCADE)
    description = models.CharField(max_length=500)
    supplier_name = models.CharField(max_length=255, null=True, blank=True)
    challan_no = models.CharField(max_length=100, null=True, blank=True)
    unit = models.CharField(max_length=50)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)

class DPREquipment(models.Model):
    report = models.ForeignKey(DailySiteReport, related_name='equipment_details', on_delete=models.CASCADE)
    machine_supplier_name = models.CharField(max_length=255)
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    total_hours = models.DecimalField(max_digits=5, decimal_places=2)
    remarks = models.CharField(max_length=500, null=True, blank=True)

class DPRExpense(models.Model):
    report = models.ForeignKey(DailySiteReport, related_name='expense_details', on_delete=models.CASCADE)
    amount_received = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    particulars = models.CharField(max_length=500)
    expense_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    closing_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)

class DPRPlanning(models.Model):
    report = models.ForeignKey(DailySiteReport, related_name='planning_details', on_delete=models.CASCADE)
    plan_activity = models.CharField(max_length=500)
    requirements = models.CharField(max_length=500, null=True, blank=True)
