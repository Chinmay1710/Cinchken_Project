from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from apps.common.models import BaseModel

class UserManager(BaseUserManager):
    def create_user(self, mobile_number, password=None, **extra_fields):
        if not mobile_number:
            raise ValueError('The Mobile Number must be set')
        user = self.model(mobile_number=mobile_number, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, mobile_number, password, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'ADMIN')
        return self.create_user(mobile_number, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin, BaseModel):
    ROLE_CHOICES = (
        ('ADMIN', 'Admin'),
        ('MANAGER', 'Manager'),
        ('SITE_ENGINEER', 'Site Engineer'),
        ('EMPLOYEE', 'Employee'),
    )

    DEPARTMENT_CHOICES = (
        ('Civil', 'Civil'),
        ('Electrical', 'Electrical'),
        ('Mechanical', 'Mechanical'),
        ('Safety', 'Safety'),
        ('Quality', 'Quality'),
        ('HR', 'HR'),
        ('Accounts', 'Accounts'),
        ('Administration', 'Administration'),
    )

    DESIGNATION_CHOICES = (
        ('Site Engineer', 'Site Engineer'),
        ('Project Manager', 'Project Manager'),
        ('Supervisor', 'Supervisor'),
        ('Civil Engineer', 'Civil Engineer'),
        ('Electrical Engineer', 'Electrical Engineer'),
        ('HR Executive', 'HR Executive'),
        ('Accountant', 'Accountant'),
    )

    mobile_number = models.CharField(max_length=15, unique=True, db_index=True)
    email = models.EmailField(unique=True, null=True, blank=True)
    full_name = models.CharField(max_length=255)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='EMPLOYEE', db_index=True)
    department = models.CharField(max_length=50, choices=DEPARTMENT_CHOICES, null=True, blank=True)
    designation = models.CharField(max_length=50, choices=DESIGNATION_CHOICES, null=True, blank=True)
    
    # Financials
    monthly_base_salary = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    bank_account_number = models.CharField(max_length=50, null=True, blank=True)
    ifsc_code = models.CharField(max_length=20, null=True, blank=True)
    
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    
    # Future-ready fields for OTP
    otp_secret = models.CharField(max_length=32, blank=True, null=True)
    is_phone_verified = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = 'mobile_number'
    REQUIRED_FIELDS = ['full_name']

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['mobile_number', 'role']),
        ]

    def __str__(self):
        return f"{self.full_name} ({self.mobile_number}) - {self.role}"
