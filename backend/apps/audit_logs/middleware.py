import json
import logging
from django.utils.deprecation import MiddlewareMixin
from .models import AuditLog

logger = logging.getLogger(__name__)

class AuditLogMiddleware(MiddlewareMixin):
    def process_request(self, request):
        if request.method in ['POST', 'PUT', 'PATCH', 'DELETE']:
            request._body_copy = request.body

    def process_response(self, request, response):
        if request.method in ['POST', 'PUT', 'PATCH', 'DELETE']:
            # Determine Action
            action_map = {
                'POST': 'CREATE',
                'PUT': 'UPDATE',
                'PATCH': 'UPDATE',
                'DELETE': 'DELETE'
            }
            action = action_map.get(request.method, 'UNKNOWN')
            
            # Module logic based on URL path
            path = request.path
            module = path.split('/')[3] if len(path.split('/')) > 3 else 'Unknown'
            
            # Extract user if authenticated
            user = request.user if hasattr(request, 'user') and request.user.is_authenticated else None

            # Attempt to parse payload for old/new data representation
            try:
                new_data = json.loads(request._body_copy.decode('utf-8')) if hasattr(request, '_body_copy') and request._body_copy else None
            except (json.JSONDecodeError, UnicodeDecodeError):
                new_data = {"raw": "Non-JSON payload (e.g. multipart/form-data)"}

            # Create Audit Log asynchronously or directly here if fast enough
            # For massive scale, this should be offloaded to Celery
            try:
                AuditLog.objects.create(
                    user=user,
                    action=action,
                    module=module.upper(),
                    record_id=request.path,  # Placeholder for actual record ID
                    new_data=new_data,
                    ip_address=self.get_client_ip(request)
                )
            except Exception as e:
                logger.error(f"Failed to create audit log: {str(e)}")

        return response

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
