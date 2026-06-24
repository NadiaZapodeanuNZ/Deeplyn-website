from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import mark_safe
from django.urls import reverse
from .models import User, EmailVerification, PasswordReset, TherapistProfile, ClientTherapist
from .utils import send_therapist_approved_email, send_therapist_rejected_email

@admin.action(description="Approve selected therapists")
def approve_therapists(modeladmin, request, queryset):
    for profile in queryset.filter(request_status='pending'):
        profile.request_status = TherapistProfile.RequestStatus.APPROVED
        profile.save(update_fields=['request_status'])
        send_therapist_approved_email(profile.user)


@admin.action(description="Reject selected therapists")
def reject_therapists(modeladmin, request, queryset):
    for profile in queryset.filter(request_status='pending'):
        profile.request_status = TherapistProfile.RequestStatus.REJECTED
        profile.save(update_fields=['request_status'])
        profile.user.is_active = False
        profile.user.save(update_fields=['is_active'])
        send_therapist_rejected_email(profile.user)

@admin.action(description="Accept selected client requests")
def accept_client_requests(modeladmin, request, queryset):
    queryset.filter(status=ClientTherapist.Status.PENDING).update(
        status=ClientTherapist.Status.ACTIVE)


@admin.action(description="Reject selected client requests")
def reject_client_requests(modeladmin, request, queryset):
    queryset.filter(status=ClientTherapist.Status.PENDING).update(
        status=ClientTherapist.Status.REJECTED)


class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'photo_preview', 'is_active', 'is_staff', 'date_joined')
    list_filter = ('is_active', 'is_staff',)
    search_fields = ('username', 'email')
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Profile', {
            'fields': ('profile_photo', 'country', 'role')
        }),)

    def photo_preview(self, obj):
        if obj.profile_photo:
            return mark_safe(
                f'<img src="{obj.profile_photo.url}" '
                f'style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;" />')
        return 'No photo'

    photo_preview.short_description = 'Photo'


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
    readonly_fields = ('pending_clients_list',)

    def pending_clients_list(self, obj):
        pending = ClientTherapist.objects.filter(
            therapist=obj.user,
            status=ClientTherapist.Status.PENDING).select_related('client')

        if not pending.exists():
            return 'No pending requests.'

        rows = ''
        for r in pending:
            edit_url = reverse('admin:users_clienttherapist_change', args=[r.id])
            rows += (
                f'<tr style="border-bottom: 1px solid #eee;">'
                f'<td style="padding: 6px 14px;">{r.client.username}</td>'
                f'<td style="padding: 6px 14px;">{r.client.email}</td>'
                f'<td style="padding: 6px 14px;">{r.created_at.strftime("%d/%m/%Y %H:%M")}</td>'
                f'<td style="padding: 6px 14px;">'
                f'<a href="{edit_url}" target="_blank" '
                f'style="background:#417690; color:white; padding:4px 12px; '
                f'border-radius:4px; text-decoration:none; font-size:13px;">Change status</a>'
                f'</td>'
                f'</tr>'
            )

        return mark_safe(
            f'<table style="border-collapse: collapse; width: 100%;">'
            f'<thead><tr style="background:#f8f8f8;">'
            f'<th style="padding: 6px 14px; text-align:left;">Username</th>'
            f'<th style="padding: 6px 14px; text-align:left;">Email</th>'
            f'<th style="padding: 6px 14px; text-align:left;">Requested at</th>'
            f'<th style="padding: 6px 14px; text-align:left;">Action</th>'
            f'</tr></thead>'
            f'<tbody>{rows}</tbody>'
            f'</table>')

    pending_clients_list.short_description = 'Pending client requests'


class ClientTherapistAdmin(admin.ModelAdmin):
    list_display = ('client', 'therapist', 'status', 'created_at', 'ended_at')
    list_filter = ('status',)
    search_fields = ('client__username', 'therapist__username')
    actions = [accept_client_requests, reject_client_requests]
    readonly_fields = ('client', 'therapist', 'created_at', 'ended_at')
    list_editable = ('status',)


admin.site.register(User, UserAdmin)
admin.site.register(EmailVerification, EmailVerificationAdmin)
admin.site.register(PasswordReset, PasswordResetAdmin)
admin.site.register(TherapistProfile, TherapistProfileAdmin)
admin.site.register(ClientTherapist, ClientTherapistAdmin)