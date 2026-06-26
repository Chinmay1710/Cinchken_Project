from rest_framework import serializers
from .models import Material, SiteInventory, MaterialInward, MaterialConsumption, MaterialRequest
from apps.sites.serializers import SiteSerializer

class MaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Material
        fields = '__all__'

class SiteInventorySerializer(serializers.ModelSerializer):
    material_details = MaterialSerializer(source='material', read_only=True)
    site_name = serializers.CharField(source='site.name', read_only=True)
    estimated_value = serializers.SerializerMethodField()

    class Meta:
        model = SiteInventory
        fields = '__all__'
        
    def get_estimated_value(self, obj):
        # Calculate Current Quantity * Latest Unit Price
        latest_inward = MaterialInward.objects.filter(site=obj.site, material=obj.material).order_by('-date', '-created_at').first()
        if latest_inward and latest_inward.unit_price:
            return float(obj.current_quantity * latest_inward.unit_price)
        return 0.0

class MaterialInwardSerializer(serializers.ModelSerializer):
    material_name = serializers.CharField(source='material.material_name', read_only=True)
    site_name = serializers.CharField(source='site.name', read_only=True)

    class Meta:
        model = MaterialInward
        fields = '__all__'

class MaterialConsumptionSerializer(serializers.ModelSerializer):
    material_name = serializers.CharField(source='material.material_name', read_only=True)
    site_name = serializers.CharField(source='site.name', read_only=True)

    class Meta:
        model = MaterialConsumption
        fields = '__all__'

class MaterialRequestSerializer(serializers.ModelSerializer):
    material_name = serializers.CharField(source='material.material_name', read_only=True)
    site_name = serializers.CharField(source='site.name', read_only=True)
    requested_by_name = serializers.CharField(source='requested_by.full_name', read_only=True)

    class Meta:
        model = MaterialRequest
        fields = '__all__'
        read_only_fields = ['requested_by']

class StockHistorySerializer(serializers.Serializer):
    id = serializers.UUIDField()
    date = serializers.DateField()
    transaction_type = serializers.CharField() # 'INWARD' or 'CONSUMPTION'
    quantity = serializers.DecimalField(max_digits=12, decimal_places=2)
    reference = serializers.CharField(required=False, allow_blank=True) # invoice or remarks
    created_at = serializers.DateTimeField()
