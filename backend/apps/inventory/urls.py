from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    MaterialViewSet, SiteInventoryViewSet, MaterialInwardViewSet,
    MaterialConsumptionViewSet, MaterialRequestViewSet, InventoryDashboardViewSet
)

router = DefaultRouter()
router.register(r'materials', MaterialViewSet, basename='material')
router.register(r'site-inventory', SiteInventoryViewSet, basename='siteinventory')
router.register(r'inwards', MaterialInwardViewSet, basename='materialinward')
router.register(r'consumptions', MaterialConsumptionViewSet, basename='materialconsumption')
router.register(r'requests', MaterialRequestViewSet, basename='materialrequest')
router.register(r'dashboard', InventoryDashboardViewSet, basename='inventorydashboard')

urlpatterns = [
    path('', include(router.urls)),
]
