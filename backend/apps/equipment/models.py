from django.db import models
from apps.common.models import BaseModel
from apps.sites.models import Site
from django.conf import settings

class Equipment(BaseModel):
    name = models.CharField(max_length=255)
    supplier_name = models.CharField(max_length=255, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'Equipment'
        verbose_name_plural = 'Equipments'

    def __str__(self):
        return f"{self.name} - {self.supplier_name}"

class EquipmentLog(BaseModel):
    site = models.ForeignKey(Site, on_delete=models.CASCADE, related_name='equipment_logs')
    equipment = models.ForeignKey(Equipment, on_delete=models.CASCADE, related_name='logs')
    date = models.DateField(db_index=True)
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    total_hours = models.DecimalField(max_digits=5, decimal_places=2, help_text="Total hours worked")
    remarks = models.CharField(max_length=500, blank=True, null=True)
    logged_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)

    class Meta:
        verbose_name = 'Equipment Log'
        verbose_name_plural = 'Equipment Logs'
        indexes = [
            models.Index(fields=['site', 'date']),
        ]

    def __str__(self):
        return f"{self.equipment.name} at {self.site.name} on {self.date}"

class DieselLog(BaseModel):
    site = models.ForeignKey(Site, on_delete=models.CASCADE, related_name='diesel_logs')
    equipment = models.ForeignKey(Equipment, on_delete=models.CASCADE, related_name='diesel_logs')
    date = models.DateField(db_index=True)
    liters_consumed = models.DecimalField(max_digits=10, decimal_places=2)
    slip_number = models.CharField(max_length=100, blank=True, null=True)
    issued_by = models.CharField(max_length=200, blank=True, null=True)
    logged_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)

    class Meta:
        verbose_name = 'Diesel Log'
        verbose_name_plural = 'Diesel Logs'
        indexes = [
            models.Index(fields=['site', 'date']),
        ]

    def __str__(self):
        return f"{self.liters_consumed}L for {self.equipment.name} on {self.date}"
