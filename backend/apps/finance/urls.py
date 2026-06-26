from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PayrollViewSet, SiteExpenseViewSet

router = DefaultRouter()
router.register(r'payroll', PayrollViewSet, basename='payroll')
router.register(r'site-expenses', SiteExpenseViewSet, basename='site-expenses')

urlpatterns = [
    path('', include(router.urls)),
]
