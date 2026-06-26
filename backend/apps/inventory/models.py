from django.db import models
from apps.common.models import BaseModel
from apps.sites.models import Site
from django.conf import settings

class Material(BaseModel):
    material_code = models.CharField(max_length=50, unique=True, db_index=True)
    material_name = models.CharField(max_length=200, db_index=True)
    category = models.CharField(max_length=100)
    unit = models.CharField(max_length=50) # e.g., kg, liters, bags, pieces
    minimum_stock = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)

    def __str__(self):
        return f"{self.material_name} ({self.material_code})"

class SiteInventory(BaseModel):
    site = models.ForeignKey(Site, on_delete=models.CASCADE, related_name='inventories')
    material = models.ForeignKey(Material, on_delete=models.CASCADE, related_name='site_inventories')
    current_quantity = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)

    class Meta:
        unique_together = ('site', 'material')

    def __str__(self):
        return f"{self.site.name} - {self.material.material_name}: {self.current_quantity}"

class MaterialInward(BaseModel):
    site = models.ForeignKey(Site, on_delete=models.CASCADE, related_name='material_inwards')
    material = models.ForeignKey(Material, on_delete=models.CASCADE, related_name='inwards')
    quantity = models.DecimalField(max_digits=12, decimal_places=2)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    vendor_name = models.CharField(max_length=200)
    invoice_number = models.CharField(max_length=100, blank=True, null=True)
    vehicle_number = models.CharField(max_length=50, blank=True, null=True)
    date = models.DateField(db_index=True)

    def __str__(self):
        return f"Inward: {self.material.material_name} - {self.quantity} to {self.site.name}"

    def save(self, *args, **kwargs):
        is_new = self._state.adding
        old_quantity = 0
        if not is_new:
            old_record = MaterialInward.objects.get(pk=self.pk)
            old_quantity = old_record.quantity

        super().save(*args, **kwargs)

        from decimal import Decimal
        inventory, _ = SiteInventory.objects.get_or_create(site=self.site, material=self.material)
        current_qty = Decimal(str(inventory.current_quantity or 0))
        qty = Decimal(str(self.quantity or 0))
        old_qty = Decimal(str(old_quantity or 0))

        if is_new:
            inventory.current_quantity = current_qty + qty
        else:
            inventory.current_quantity = current_qty - old_qty + qty
        inventory.save()

    def delete(self, *args, **kwargs):
        from decimal import Decimal
        inventory = SiteInventory.objects.filter(site=self.site, material=self.material).first()
        if inventory:
            current_qty = Decimal(str(inventory.current_quantity or 0))
            qty = Decimal(str(self.quantity or 0))
            inventory.current_quantity = current_qty - qty
            inventory.save()
        super().delete(*args, **kwargs)


class MaterialConsumption(BaseModel):
    site = models.ForeignKey(Site, on_delete=models.CASCADE, related_name='material_consumptions')
    material = models.ForeignKey(Material, on_delete=models.CASCADE, related_name='consumptions')
    quantity_used = models.DecimalField(max_digits=12, decimal_places=2)
    used_by = models.CharField(max_length=200, blank=True, null=True)
    remarks = models.TextField(blank=True, null=True)
    date = models.DateField(db_index=True)

    def __str__(self):
        return f"Consumption: {self.material.material_name} - {self.quantity_used} from {self.site.name}"

    def save(self, *args, **kwargs):
        is_new = self._state.adding
        old_quantity = 0
        if not is_new:
            old_record = MaterialConsumption.objects.get(pk=self.pk)
            old_quantity = old_record.quantity_used

        super().save(*args, **kwargs)

        from decimal import Decimal
        inventory, _ = SiteInventory.objects.get_or_create(site=self.site, material=self.material)
        current_qty = Decimal(str(inventory.current_quantity or 0))
        qty_used = Decimal(str(self.quantity_used or 0))
        old_qty = Decimal(str(old_quantity or 0))

        if is_new:
            inventory.current_quantity = current_qty - qty_used
        else:
            inventory.current_quantity = current_qty + old_qty - qty_used
        inventory.save()

    def delete(self, *args, **kwargs):
        from decimal import Decimal
        inventory = SiteInventory.objects.filter(site=self.site, material=self.material).first()
        if inventory:
            current_qty = Decimal(str(inventory.current_quantity or 0))
            qty_used = Decimal(str(self.quantity_used or 0))
            inventory.current_quantity = current_qty + qty_used
            inventory.save()
        super().delete(*args, **kwargs)


class MaterialRequest(BaseModel):
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Approved', 'Approved'),
        ('Rejected', 'Rejected'),
        ('Delivered', 'Delivered'),
    ]

    site = models.ForeignKey(Site, on_delete=models.CASCADE, related_name='material_requests')
    material = models.ForeignKey(Material, on_delete=models.CASCADE, related_name='requests')
    quantity_required = models.DecimalField(max_digits=12, decimal_places=2)
    reason = models.TextField(blank=True, null=True)
    requested_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='initiated_requests')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')

    def __str__(self):
        return f"Request: {self.material.material_name} ({self.quantity_required}) for {self.site.name} - {self.status}"
