from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LabourViewSet, LabourAttendanceViewSet, LabourGroupPhotoViewSet

router = DefaultRouter()
router.register(r'group-photos', LabourGroupPhotoViewSet, basename='labour-group-photos')
router.register(r'attendance', LabourAttendanceViewSet, basename='labour-attendance')
router.register(r'', LabourViewSet, basename='labour')

urlpatterns = [
    path('', include(router.urls)),
]
