from rest_framework import serializers
from .models import Equipment, EquipmentLog, DieselLog

class EquipmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Equipment
        fields = '__all__'

class EquipmentLogSerializer(serializers.ModelSerializer):
    equipment_name = serializers.CharField(source='equipment.name', read_only=True)
    site_name = serializers.CharField(source='site.name', read_only=True)
    
    class Meta:
        model = EquipmentLog
        fields = '__all__'
        read_only_fields = ['logged_by']

    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['logged_by'] = user
        return super().create(validated_data)

class DieselLogSerializer(serializers.ModelSerializer):
    site_name = serializers.CharField(source='site.name', read_only=True)
    equipment_name = serializers.CharField(source='equipment.name', read_only=True)
    logged_by_name = serializers.CharField(source='logged_by.get_full_name', read_only=True)

    class Meta:
        model = DieselLog
        fields = ['id', 'site', 'site_name', 'equipment', 'equipment_name', 'date', 
                  'liters_consumed', 'slip_number', 'issued_by', 'logged_by', 'logged_by_name', 
                  'created_at', 'updated_at']
        read_only_fields = ['logged_by']

    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['logged_by'] = user
        return super().create(validated_data)
