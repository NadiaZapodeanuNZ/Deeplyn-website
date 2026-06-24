from django.contrib import admin
from .models import Exercise, ExerciseCompletion, ExerciseEmotion

class ExerciseAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'therapy_type', 'content_format', 'nr_questions', 'is_predefined', 'is_shared_by_therapist', 'created_by', 'assigned_to')
    list_filter = ('category', 'therapy_type', 'content_format', 'is_predefined', 'is_shared_by_therapist')
    search_fields = ('title', 'created_by__username', 'assigned_to__username')
    readonly_fields = ('created_at', 'updated_at')

class ExerciseEmotionInline(admin.TabularInline):
    model = ExerciseEmotion
    extra = 0
    readonly_fields = ('emotion', 'intensity', 'source')

class ExerciseCompletionAdmin(admin.ModelAdmin):
    list_display = ('client', 'exercise', 'emotions_source', 'is_shared_with_therapist', 'completed_at')
    list_filter = ('emotions_source', 'is_shared_with_therapist')
    search_fields = ('client__username', 'exercise__title')
    readonly_fields = ('completed_at', 'updated_at')
    inlines = [ExerciseEmotionInline]

admin.site.register(Exercise,ExerciseAdmin)
admin.site.register(ExerciseCompletion, ExerciseCompletionAdmin)