from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import GPSLogViewSet

router = DefaultRouter()
router.register(r'gps-log', GPSLogViewSet, basename='gps-log')

urlpatterns = [
    path('', include(router.urls)),
]
