from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from .models import User, EmailVerification, PasswordReset, TherapistProfile


class TherapistProfileInline(admin.StackedInline):
    model = TherapistProfile
    can_delete = False
    verbose_name_plural = "Therapist Profile"
    fields = ('license_code','where_to_check_license','documents_pdf','bio',
            'specializations','request_status','is_accepting_clients')

class UserAdmin(BaseUserAdmin):
    fieldsets = BaseUserAdmin.fieldsets + (("Additional Info", {"fields": ("role", "country", "profile_photo")}))
    list_display = ('username','email','role_badge',  'country','is_active','is_staff','date_joined')
    list_filter = ('role', 'is_active', 'is_staff', 'country')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    
    def role_badge(self, obj):
        colors = {'client':    '#28a745','therapist': '#007bff'}
        color = colors.get(obj.role, '#6c757d')
        return format_html('<span style="color: white; background-color: {}; '
                           'padding: 2px 8px; border-radius: 4px; font-size: 11px;">{}</span>',
                           color,obj.get_role_display() )
    
    role_badge.short_description = 'Role'
    
    def get_inline_instances(self, request, obj=None):
        if obj and obj.role == User.Role.THERAPIST:
            return [TherapistProfileInline(self.model, self.admin_site)]
        return []

class ClientUser(User):
    class Meta:
        proxy = True
        verbose_name = "Client"
        verbose_name_plural = "Clients"


class TherapistUser(User):
    class Meta:
        proxy = True
        verbose_name = "Therapist"
        verbose_name_plural = "Therapists"


class ClientAdmin(UserAdmin):

    inlines = []
    
    def get_queryset(self, request):
        return super().get_queryset(request).filter(role=User.Role.CLIENT)
    
    def get_inline_instances(self, request, obj=None):
        return []


class TherapistAdmin(UserAdmin):
    inlines = [TherapistProfileInline]
    list_display = ('username','email','country','is_active','request_status_badge','date_joined')

    def get_queryset(self, request):
        return super().get_queryset(request).filter(role=User.Role.THERAPIST)
    
    def request_status_badge(self, obj):
        if not hasattr(obj, 'therapist'):
            return
        colors = {
            'pending':  '#ffc107',  
            'approved': '#28a745',  
            'rejected': '#dc3545'
        }
        status = obj.therapist.request_status
        color = colors.get(status, '#6c757d')
        return format_html('<span style="color: white; background-color: {}; '
                           'padding: 2px 8px; border-radius: 4px; font-size: 11px;">{}</span>',
                           color,obj.therapist.get_request_status_display())
    request_status_badge.short_description = 'Status'
    def get_inline_instances(self, request, obj=None):
        if obj:
            return [TherapistProfileInline(self.model, self.admin_site)]
        return []

class EmailVerificationAdmin(admin.ModelAdmin):
    list_display = ('user','token','expires_at','resend_attempts','failed_attempts','blocked_until')
    search_fields = ('user__username', 'user__email')
    list_filter = ('blocked_until')
    readonly_fields = ('token', 'expires_at')


class PasswordResetAdmin(admin.ModelAdmin):
    list = ('user','token','expires_at','is_used','request_attempts','blocked_until',)
    search_fields = ('user__username', 'user__email')
    list_filter = ('is_used', 'blocked_until')
    readonly_fields = ('token')

admin.site.register(User, UserAdmin)
admin.site.register(ClientUser, ClientAdmin)
admin.site.register(TherapistUser, TherapistAdmin)
admin.site.register(EmailVerification, EmailVerificationAdmin)
admin.site.register(PasswordReset, PasswordResetAdmin)