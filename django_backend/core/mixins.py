from django.contrib import admin
from users.models import AdminAuditLog

class AuditLoggingAdminMixin:
    """
    Mixin for ModelAdmin classes that automatically records all creation, update,
    and deletion operations performed by administrators into the AdminAuditLog table.
    """
    def save_model(self, request, obj, form, change):
        action = 'update' if change else 'create'
        target_type = obj.__class__.__name__
        
        # Save first to ensure obj has pk
        super().save_model(request, obj, form, change)
        
        # Get client IP address
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR', '0.0.0.0')

        # Construct detail snapshot of changed values
        changed_data = form.changed_data if form else []
        detail = f"Admin {action}d {target_type} (ID: {obj.pk}). Changed: {', '.join(changed_data) or 'None'}"
        if len(detail) > 400:
            detail = detail[:397] + "..."

        # Create audit log record
        AdminAuditLog.objects.create(
            admin=request.user,
            action=action,
            target_type=target_type[:30],
            target_id=str(obj.pk)[:40],
            detail=detail,
            ip=ip[:45]
        )

    def delete_model(self, request, obj):
        target_type = obj.__class__.__name__
        target_id = str(obj.pk or '')
        
        # Get client IP address
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR', '0.0.0.0')

        super().delete_model(request, obj)

        detail = f"Admin deleted {target_type} (ID: {target_id})"
        if len(detail) > 400:
            detail = detail[:397] + "..."

        AdminAuditLog.objects.create(
            admin=request.user,
            action='delete',
            target_type=target_type[:30],
            target_id=target_id[:40],
            detail=detail,
            ip=ip[:45]
        )
