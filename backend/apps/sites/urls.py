from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SiteViewSet, SiteAssignmentViewSet, SiteEngineerAssignmentViewSet, SiteAttendanceSettingsViewSet, SiteDocumentViewSet, SiteLevelViewSet

router = DefaultRouter()
router.register(r'assignments/engineers', SiteEngineerAssignmentViewSet, basename='site-engineer-assignments')
router.register(r'assignments', SiteAssignmentViewSet, basename='site-assignments')
router.register(r'settings', SiteAttendanceSettingsViewSet, basename='site-settings')
router.register(r'documents', SiteDocumentViewSet, basename='site-documents')
router.register(r'levels', SiteLevelViewSet, basename='site-levels')
router.register(r'', SiteViewSet, basename='sites')

urlpatterns = [
    path('', include(router.urls)),
]
