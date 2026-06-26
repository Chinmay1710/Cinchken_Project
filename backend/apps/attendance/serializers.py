from rest_framework import serializers
from .models import EmployeeAttendance
from django.contrib.gis.geos import Point
from django.utils import timezone

class EmployeeAttendanceSerializer(serializers.ModelSerializer):
    longitude = serializers.FloatField(write_only=True, required=False)
    latitude = serializers.FloatField(write_only=True, required=False)
    
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    site_name = serializers.CharField(source='site.name', read_only=True)
    lat = serializers.SerializerMethodField(read_only=True)
    lng = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = EmployeeAttendance
        fields = ['id', 'site', 'work_date', 'check_in_time', 'longitude', 'latitude', 'selfie_image', 'status', 'sync_id', 'employee_name', 'site_name', 'lat', 'lng']
        read_only_fields = ['id', 'status', 'selfie_image', 'work_date', 'check_in_time', 'lat', 'lng']
        
    def get_lat(self, obj):
        return obj.check_in_location.y if obj.check_in_location else None
        
    def get_lng(self, obj):
        return obj.check_in_location.x if obj.check_in_location else None

    def create(self, validated_data):
        lon = validated_data.pop('longitude', 0.0)
        lat = validated_data.pop('latitude', 0.0)
        validated_data['check_in_location'] = Point(lon, lat, srid=4326)
        
        if 'check_in_time' not in validated_data:
            validated_data['check_in_time'] = timezone.now()
        if 'work_date' not in validated_data:
            validated_data['work_date'] = timezone.now().date()
        
        return super().create(validated_data)
