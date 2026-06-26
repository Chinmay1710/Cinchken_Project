from rest_framework import serializers
from .models import User

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    current_assignment_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'mobile_number', 'email', 'full_name', 'role', 'is_active', 'is_phone_verified', 'password', 'monthly_base_salary', 'current_assignment_name']
        read_only_fields = ['id', 'is_phone_verified']

    def get_current_assignment_name(self, obj):
        from apps.sites.models import SiteAssignment, SiteEngineerAssignment
        from django.utils import timezone
        from django.db import models
        
        if obj.role == 'SITE_ENGINEER':
            today = timezone.now().date()
            assignment = SiteEngineerAssignment.objects.filter(
                user=obj
            ).filter(
                models.Q(end_date__isnull=True) | models.Q(end_date__gte=today)
            ).select_related('site').first()
            return assignment.site.name if assignment else None
        else:
            assignment = SiteAssignment.objects.filter(
                user=obj, is_active=True
            ).select_related('site').first()
            return assignment.site.name if assignment else None

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = super().create(validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user
        
    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        user = super().update(instance, validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['mobile_number', 'email', 'full_name', 'password']
        
    def create(self, validated_data):
        user = User.objects.create_user(
            mobile_number=validated_data['mobile_number'],
            email=validated_data.get('email', ''),
            full_name=validated_data['full_name'],
            password=validated_data['password']
        )
        return user
