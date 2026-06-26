from rest_framework import serializers
from rest_framework import serializers
from .models import Labour, LabourAttendance, LabourGroupPhoto

class LabourSerializer(serializers.ModelSerializer):
    class Meta:
        model = Labour
        fields = '__all__'

class LabourAttendanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = LabourAttendance
        fields = ['id', 'labour', 'site', 'date', 'status', 'marked_by_engineer', 'remarks', 'sync_id']
        read_only_fields = ['marked_by_engineer']

class LabourGroupPhotoSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.full_name', read_only=True)
    site_name = serializers.CharField(source='site.name', read_only=True)

    class Meta:
        model = LabourGroupPhoto
        fields = ['id', 'site', 'site_name', 'photo_url', 'uploaded_by', 'uploaded_by_name', 'created_at']
        read_only_fields = ['uploaded_by']

class BulkLabourAttendanceItemSerializer(serializers.Serializer):
    labour = serializers.PrimaryKeyRelatedField(queryset=Labour.objects.all())
    status = serializers.ChoiceField(choices=LabourAttendance.STATUS_CHOICES)
    remarks = serializers.CharField(required=False, allow_blank=True)
    sync_id = serializers.UUIDField(required=False)

class BulkLabourAttendanceSerializer(serializers.Serializer):
    site = serializers.UUIDField()
    date = serializers.DateField()
    attendances = BulkLabourAttendanceItemSerializer(many=True)

    def create(self, validated_data):
        site_id = validated_data['site']
        date = validated_data['date']
        attendances_data = validated_data['attendances']
        
        engineer = self.context['request'].user
        created_records = []
        
        for data in attendances_data:
            # Idempotency check via sync_id handled in view or here
            sync_id = data.get('sync_id')
            if sync_id and LabourAttendance.objects.filter(sync_id=sync_id).exists():
                continue
                
            record, created = LabourAttendance.objects.update_or_create(
                labour=data['labour'],
                date=date,
                defaults={
                    'site_id': site_id,
                    'status': data['status'],
                    'remarks': data.get('remarks', ''),
                    'marked_by_engineer': engineer,
                    'sync_id': sync_id
                }
            )
            created_records.append(record)
            
        return created_records
