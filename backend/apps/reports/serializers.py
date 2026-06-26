from rest_framework import serializers
from .models import DailySiteReport, SiteReportImage, DPRWorkReport, DPRManpower, DPRMaterial, DPREquipment, DPRExpense, DPRPlanning

class SiteReportImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteReportImage
        fields = ['id', 'image', 'uploaded_at']

class DPRWorkReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = DPRWorkReport
        exclude = ['report']

class DPRManpowerSerializer(serializers.ModelSerializer):
    class Meta:
        model = DPRManpower
        exclude = ['report']

class DPRMaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = DPRMaterial
        exclude = ['report']

class DPREquipmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = DPREquipment
        exclude = ['report']

class DPRExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = DPRExpense
        exclude = ['report']

class DPRPlanningSerializer(serializers.ModelSerializer):
    class Meta:
        model = DPRPlanning
        exclude = ['report']

class DailySiteReportSerializer(serializers.ModelSerializer):
    images = SiteReportImageSerializer(many=True, read_only=True)
    work_reports = DPRWorkReportSerializer(many=True, read_only=True)
    manpower_details = DPRManpowerSerializer(many=True, read_only=True)
    material_details = DPRMaterialSerializer(many=True, read_only=True)
    equipment_details = DPREquipmentSerializer(many=True, read_only=True)
    expense_details = DPRExpenseSerializer(many=True, read_only=True)
    planning_details = DPRPlanningSerializer(many=True, read_only=True)
    site_name = serializers.CharField(source='site.name', read_only=True)
    submitted_by_name = serializers.CharField(source='submitted_by.full_name', read_only=True)
    
    class Meta:
        model = DailySiteReport
        fields = ['id', 'site', 'site_name', 'submitted_by', 'submitted_by_name', 'report_date', 'work_summary', 'progress_percentage', 'sync_id', 'images', 
                  'work_reports', 'manpower_details', 'material_details', 'equipment_details', 'expense_details', 'planning_details']
        read_only_fields = ['submitted_by']

class DailySiteReportCreateSerializer(serializers.ModelSerializer):
    work_reports = DPRWorkReportSerializer(many=True, required=False)
    manpower_details = DPRManpowerSerializer(many=True, required=False)
    material_details = DPRMaterialSerializer(many=True, required=False)
    equipment_details = DPREquipmentSerializer(many=True, required=False)
    expense_details = DPRExpenseSerializer(many=True, required=False)
    planning_details = DPRPlanningSerializer(many=True, required=False)

    class Meta:
        model = DailySiteReport
        fields = ['id', 'site', 'report_date', 'work_summary', 'progress_percentage', 'sync_id',
                  'work_reports', 'manpower_details', 'material_details', 'equipment_details', 'expense_details', 'planning_details']
        
    def create(self, validated_data):
        work_reports_data = validated_data.pop('work_reports', [])
        manpower_data = validated_data.pop('manpower_details', [])
        material_data = validated_data.pop('material_details', [])
        equipment_data = validated_data.pop('equipment_details', [])
        expense_data = validated_data.pop('expense_details', [])
        planning_data = validated_data.pop('planning_details', [])

        user = self.context['request'].user
        validated_data['submitted_by'] = user
        report = super().create(validated_data)

        # Create nested items
        for item in work_reports_data:
            DPRWorkReport.objects.create(report=report, **item)
        for item in manpower_data:
            DPRManpower.objects.create(report=report, **item)
        for item in material_data:
            DPRMaterial.objects.create(report=report, **item)
        for item in equipment_data:
            DPREquipment.objects.create(report=report, **item)
        for item in expense_data:
            DPRExpense.objects.create(report=report, **item)
        for item in planning_data:
            DPRPlanning.objects.create(report=report, **item)

        return report
