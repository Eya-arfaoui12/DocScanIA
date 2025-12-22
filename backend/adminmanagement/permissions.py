from rest_framework import permissions


class IsCustomAdmin(permissions.BasePermission):
    """
    Autorise uniquement les utilisateurs dont le rôle == 'admin'.
    """
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and getattr(request.user, 'role', None) == 'admin'
        )