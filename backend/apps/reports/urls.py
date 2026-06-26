from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DailySiteReportViewSet
from .dashboard_views import DashboardStatsAPIView

router = DefaultRouter()
router.register(r'daily', DailySiteReportViewSet, basename='daily-reports')

urlpatterns = [
    path('dashboard-stats/', DashboardStatsAPIView.as_view(), name='dashboard-stats'),
    path('', include(router.urls)),
]
