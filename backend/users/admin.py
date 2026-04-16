from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, EmailVerification, PasswordReset


class UserAdmin(BaseUserAdmin):
    """Custom admin view for the User model."""
    list_display = ('username', 'email', 'is_active', 'is_staff', 'date_joined')
    list_filter = ('is_active', 'is_staff')
    search_fields = ('username', 'email')


class EmailVerificationAdmin(admin.ModelAdmin):
    """Admin view for email verification records."""
    list_display = ('user', 'token', 'expires_at', 'resend_attempts', 'blocked_until')
    search_fields = ('user__username', 'user__email')
    list_filter = ('blocked_until',)


class PasswordResetAdmin(admin.ModelAdmin):
    """Admin view for password reset records."""
    list_display = ('user', 'token', 'expires_at', 'is_used', 'request_attempts')
    search_fields = ('user__username', 'user__email')
    list_filter = ('is_used',)


# Register all models with their custom admin views
admin.site.register(User, UserAdmin)
admin.site.register(EmailVerification, EmailVerificationAdmin)
admin.site.register(PasswordReset, PasswordResetAdmin)