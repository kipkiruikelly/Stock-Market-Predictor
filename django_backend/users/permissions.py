from rest_framework.permissions import BasePermission

class HasRolePermission(BasePermission):
    """
    Custom permission to check if the authenticated user has any of the allowed roles.
    Specify allowed roles using `allowed_roles = [...]` on the View class.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
            
        allowed_roles = getattr(view, 'allowed_roles', None)
        if not allowed_roles:
            # If no roles specified, default to letting authenticated user through
            return True
            
        # Extract user's role (fallback to free)
        user_role = getattr(request.user, 'role', 'free').lower()
        
        # Standardize allowed_roles list
        allowed_roles_lower = [r.lower() for r in allowed_roles]
        
        # Admins or Super Admins naturally bypass standard checks
        if user_role in ['admin', 'super_admin', 'super admin']:
            return True
            
        return user_role in allowed_roles_lower
