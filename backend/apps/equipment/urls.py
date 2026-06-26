from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EquipmentViewSet, EquipmentLogViewSet, DieselLogViewSet

router = DefaultRouter()
router.register(r'list', EquipmentViewSet, basename='equipment')
router.register(r'logs', EquipmentLogViewSet, basename='equipment-logs')
router.register(r'diesel-logs', DieselLogViewSet, basename='diesel-logs')

urlpatterns = [
    path('', include(router.urls)),
]
