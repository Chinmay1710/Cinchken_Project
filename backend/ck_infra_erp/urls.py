from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

schema_view = get_schema_view(
    openapi.Info(
        title="CK Infra ERP API",
        default_version='v1',
        description="API documentation for CK Infra ERP Management System",
        contact=openapi.Contact(email="admin@ckinfra.com"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Swagger Docs
    path('api/docs/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('api/redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    
    # API Endpoints
    path('api/v1/auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/v1/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/v1/users/', include('apps.users.urls')),
    path('api/v1/sites/', include('apps.sites.urls')),
    path('api/v1/attendance/', include('apps.attendance.urls')),
    path('api/v1/labour/', include('apps.labour.urls')),
    path('api/v1/reports/', include('apps.reports.urls')),
    path('api/v1/hr/', include('apps.hr.urls')),
    path('api/v1/tracking/', include('apps.gps_tracking.urls')),
    path('api/v1/notifications/', include('apps.notifications.urls')),
    path('api/v1/audit/', include('apps.audit_logs.urls')),
    path('api/v1/inventory/', include('apps.inventory.urls')),
    path('api/v1/finance/', include('apps.finance.urls')),
    path('api/v1/equipment/', include('apps.equipment.urls')),
]

# Serve media files (Temporary fix for Render so uploaded images are visible)
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
