from rest_framework.permissions import BasePermission


class IsClient(BasePermission):

    message = "Only clients can perform this action."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role == request.user.Role.CLIENT)


class IsTherapist(BasePermission):
    message = "Only approved therapists can perform this action."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role == request.user.Role.THERAPIST
        )