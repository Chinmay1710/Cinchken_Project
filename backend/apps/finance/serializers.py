from rest_framework import serializers
from .models import PayrollRecord, SiteExpense
from apps.users.serializers import UserSerializer

class SiteExpenseSerializer(serializers.ModelSerializer):
    site_name = serializers.CharField(source='site.name', read_only=True)
    logged_by_name = serializers.CharField(source='logged_by.full_name', read_only=True)

    class Meta:
        model = SiteExpense
        fields = '__all__'
        read_only_fields = ['logged_by']

class PayrollSerializer(serializers.ModelSerializer):
    employee_details = UserSerializer(source='employee', read_only=True)
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    department = serializers.CharField(source='employee.department', read_only=True)
    designation = serializers.CharField(source='employee.designation', read_only=True)

    class Meta:
        model = PayrollRecord
        fields = '__all__'
        read_only_fields = ('net_salary',)

    def update(self, instance, validated_data):
        # Admin can update deductions, recalculate net_salary
        deductions = validated_data.get('deductions', instance.deductions)
        instance.deductions = deductions
        instance.net_salary = instance.base_salary - deductions
        instance.status = validated_data.get('status', instance.status)
        instance.save()
        return instance
