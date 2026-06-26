from rest_framework import serializers
from django.contrib.gis.geos import Point
from .models import Site, SiteAssignment, SiteEngineerAssignment, SiteAttendanceSettings, SiteDocument, SiteLevel
from apps.reports.models import DailySiteReport

class SiteSerializer(serializers.ModelSerializer):
    longitude = serializers.FloatField(required=False)
    latitude = serializers.FloatField(required=False)

    class Meta:
        model = Site
        fields = ['id', 'name', 'address', 'longitude', 'latitude', 'geofence_radius_meters', 'attendance_cutoff_time', 'start_date', 'target_date', 'is_active']
        
    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if instance.location:
            ret['longitude'] = instance.location.x
            ret['latitude'] = instance.location.y
        return ret
        
    def create(self, validated_data):
        longitude = validated_data.pop('longitude')
        latitude = validated_data.pop('latitude')
        validated_data['location'] = Point(longitude, latitude, srid=4326)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if 'longitude' in validated_data and 'latitude' in validated_data:
            longitude = validated_data.pop('longitude')
            latitude = validated_data.pop('latitude')
            instance.location = Point(longitude, latitude, srid=4326)
        return super().update(instance, validated_data)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.location:
            data['longitude'] = instance.location.x
            data['latitude'] = instance.location.y
            
        # Get completion percentage from the latest report
        latest_report = DailySiteReport.objects.filter(site_id=instance.id).order_by('-report_date').first()
        data['completion_percentage'] = latest_report.progress_percentage if latest_report else 0
        
        # Team counts
        data['engineers_count'] = instance.assigned_engineers.count()
        data['labour_count'] = instance.assigned_users.count()
        
        return data

class SiteAssignmentSerializer(serializers.ModelSerializer):
    site = SiteSerializer(read_only=True)
    site_id = serializers.UUIDField(write_only=True, required=False)
    
    class Meta:
        model = SiteAssignment
        fields = ['id', 'user', 'site', 'site_id', 'assigned_at']

class SiteEngineerAssignmentSerializer(serializers.ModelSerializer):
    user_full_name = serializers.CharField(source='user.full_name', read_only=True)
    site_name = serializers.CharField(source='site.name', read_only=True)
    
    class Meta:
        model = SiteEngineerAssignment
        fields = '__all__'

class SiteAttendanceSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteAttendanceSettings
        fields = '__all__'

class SiteDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteDocument
        fields = '__all__'

class SiteLevelSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.CharField(source='assigned_to.full_name', read_only=True)

    class Meta:
        model = SiteLevel
        fields = '__all__'
