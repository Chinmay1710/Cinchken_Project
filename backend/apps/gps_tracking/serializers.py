from rest_framework import serializers
from .models import GPSLog

class GPSLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = GPSLog
        fields = ['id', 'site', 'latitude', 'longitude', 'timestamp', 'sync_id']

class BulkGPSLogSerializer(serializers.Serializer):
    logs = GPSLogSerializer(many=True)

    def create(self, validated_data):
        logs_data = validated_data['logs']
        employee = self.context['request'].user
        
        created_logs = []
        for log_data in logs_data:
            sync_id = log_data.get('sync_id')
            if sync_id and GPSLog.objects.filter(sync_id=sync_id).exists():
                continue
                
            log = GPSLog.objects.create(
                employee=employee,
                site=log_data.get('site'),
                latitude=log_data['latitude'],
                longitude=log_data['longitude'],
                timestamp=log_data['timestamp'],
                sync_id=sync_id
            )
            created_logs.append(log)
            
        return created_logs
