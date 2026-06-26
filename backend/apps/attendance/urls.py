from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EmployeeAttendanceViewSet

router = DefaultRouter()
router.register(r'check-in', EmployeeAttendanceViewSet, basename='attendance')

urlpatterns = [
    path('', include(router.urls)),
]
