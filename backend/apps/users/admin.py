from django.contrib import admin
from .models import User

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('mobile_number', 'full_name', 'role', 'is_active')
    search_fields = ('mobile_number', 'full_name', 'email')
    list_filter = ('role', 'is_active')
