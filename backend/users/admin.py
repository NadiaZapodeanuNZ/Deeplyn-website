from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, EmailVerification, PasswordReset, TherapistProfile
from .utils import send_therapist_approved_email, send_therapist_rejected_email


@admin.action(description="Approve selected therapists")
def approve_therapists(modeladmin, request, queryset):
    for profile in queryset.filter(request_status='pending'):
        profile.request_status = TherapistProfile.RequestStatus.APPROVED
        profile.save(update_fields=['request_status'])
        send_therapist_approved_email(profile.user)


@admin.action(description="Reject selected therapists")
def reject_therapists(modeladmin, request, queryset):
    pending = queryset.filter(request_status='pending')
    
    for profile in pending:
        profile.request_status = TherapistProfile.RequestStatus.REJECTED
        profile.save(update_fields=['request_status'])
        profile.user.is_active = False
        profile.user.save(update_fields=['is_active'])
        
        send_therapist_rejected_email(profile.user)


class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'is_active', 'is_staff', 'date_joined')
    list_filter = ('is_active', 'is_staff')
    search_fields = ('username', 'email')


class EmailVerificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'token', 'expires_at', 'resend_attempts', 'blocked_until')
    search_fields = ('user__username', 'user__email')
    list_filter = ('blocked_until',)


class PasswordResetAdmin(admin.ModelAdmin):
    list_display = ('user', 'token', 'expires_at', 'is_used', 'request_attempts')
    search_fields = ('user__username', 'user__email')
    list_filter = ('is_used',)


class TherapistProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'license_code', 'request_status')
    list_filter = ('request_status',)
    search_fields = ('user__username', 'user__email')
    actions = [approve_therapists, reject_therapists]

admin.site.register(User, UserAdmin)
admin.site.register(EmailVerification, EmailVerificationAdmin)
admin.site.register(PasswordReset, PasswordResetAdmin)
admin.site.register(TherapistProfile, TherapistProfileAdmin)