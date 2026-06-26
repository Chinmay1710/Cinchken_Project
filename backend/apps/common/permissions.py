from rest_framework import permissions

class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        print(f"IsAdmin check for user: {request.user}, role: {getattr(request.user, 'role', None)}, action: {getattr(view, 'action', None)}")
        return bool(request.user and request.user.is_authenticated and request.user.role == 'ADMIN')

class IsManager(permissions.BasePermission):
    def has_permission(self, request, view):
        print(f"IsManager check for user: {request.user}, role: {getattr(request.user, 'role', None)}")
        return bool(request.user and request.user.is_authenticated and request.user.role in ['ADMIN', 'MANAGER'])

class IsSiteEngineer(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in ['ADMIN', 'MANAGER', 'SITE_ENGINEER'])

class IsEmployee(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)
