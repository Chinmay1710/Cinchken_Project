from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LeaveRequestViewSet, SalaryRecordViewSet, LeaveBalanceViewSet

router = DefaultRouter()
router.register(r'leaves', LeaveRequestViewSet, basename='leaves')
router.register(r'salaries', SalaryRecordViewSet, basename='salaries')
router.register(r'balances', LeaveBalanceViewSet, basename='balances')

urlpatterns = [
    path('', include(router.urls)),
]
