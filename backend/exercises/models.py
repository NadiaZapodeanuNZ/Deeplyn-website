from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Exercise(models.Model):
    class Category(models.TextChoices):
        DBT = 'dbt', 'DBT'
        CBT = 'cbt', 'CBT'

    class TherapyType(models.TextChoices):
        MINDFULNESS = 'mindfulness', 'Mindfulness'
        DISTRESS_TOLERANCE = 'distress_tolerance', 'Distress Tolerance'
        EMOTION_REGULATION = 'emotion_regulation', 'Emotion Regulation'
        INTERPERSONAL_EFFECTIVENESS = 'interpersonal_effectiveness','Interpersonal Effectiveness'
        # CBT 
        COGNITIVE_RESTRUCTURING = 'cognitive_restructuring','Cognitive Restructuring'
        BEHAVIORAL_ACTIVATION = 'behavioral_activation','Behavioral Activation'
        EXPOSURE = 'exposure', 'Exposure'
        PROBLEM_SOLVING = 'problem_solving', 'Problem Solving'
        SELF_MONITORING = 'self_monitoring','Self-Monitoring'

    class ContentFormat(models.TextChoices):
        FREE_TEXT = 'free_text','Free Text'
        BULLET_POINTS = 'bullet_points', 'Bullet Points'
        QUIZ_ANSWER = 'quiz_answer','Quiz Answer'
        STRUCTURED_REFLECTION = 'structured_reflection', 'Structured Reflection'

    title = models.CharField(max_length=100)
    category = models.CharField(max_length=3,choices=Category.choices,db_index=True)
    therapy_type= models.CharField(max_length=35, choices=TherapyType.choices, db_index=True)
    content_format = models.CharField(max_length=25, choices=ContentFormat.choices, default=ContentFormat.FREE_TEXT)
    nr_questions = models.PositiveSmallIntegerField(default=1)
    content = models.TextField(max_length=1000)
    is_predefined = models.BooleanField(default=False, db_index=True)
    is_shared_by_therapist = models.BooleanField(default=False)
    is_deleted_from_therapist_panel = models.BooleanField(default=False)
    created_by  = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='created_exercises')
    assigned_to = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='assigned_exercises')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'exercises'
        ordering = ['category', 'therapy_type', 'title']
        verbose_name = 'Exercise'
        verbose_name_plural = 'Exercises'

    def __str__(self):
        prefix = 'predefined' if self.is_predefined else f'by {self.created_by}'
        return f"[{self.category.upper()}] [{prefix}] {self.title}"

class ExerciseCompletion(models.Model):
    class EmotionsSource(models.TextChoices):
        NONE = 'none','None'
        MANUAL = 'manual','Manual'
        TRANSFORMER = 'transformer', 'Automatically'

    exercise = models.ForeignKey(Exercise, on_delete=models.CASCADE, related_name='completions')
    client = models.ForeignKey(User,on_delete=models.CASCADE, related_name='exercise_completions')
    response = models.TextField(max_length=1000, blank=True, default='')
    comment = models.TextField(max_length=500, blank=True, default='')
    emotions_source = models.CharField(max_length=15, choices=EmotionsSource.choices, default=EmotionsSource.NONE)
    is_shared_with_therapist = models.BooleanField(default=False)
    is_deleted_from_therapist_panel = models.BooleanField(default=False)
    completed_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'exercise_completions'
        ordering = ['-completed_at']
        verbose_name = 'Exercise Completion'
        verbose_name_plural = 'Exercise Completions'

    def __str__(self):
        return f"{self.client.username} -> {self.exercise.title} ({self.completed_at.strftime('%d-%m-%Y')})"

class ExerciseEmotion(models.Model):
    class Source(models.TextChoices):
        MANUAL  = 'manual', 'Manual'
        TRANSFORMER = 'transformer', 'Automatically'

    completion = models.ForeignKey(ExerciseCompletion, on_delete=models.CASCADE, related_name='exercise_emotions')
    emotion = models.ForeignKey('journal.Emotion',  on_delete=models.CASCADE, related_name='exercise_emotions')
    intensity = models.FloatField()
    source = models.CharField(max_length=15, choices=Source.choices)

    class Meta:
        db_table = 'exercise_emotions'
        verbose_name = 'Exercise Emotion'
        verbose_name_plural = 'Exercise Emotions'
        unique_together = ('completion', 'emotion')
        constraints = [
            models.CheckConstraint(condition=models.Q(intensity__gte=0.0) & models.Q(intensity__lte=1.0),name='exercise_intensity_range')]

    def __str__(self):
        return f"{self.emotion.name} ({self.intensity}) [{self.source}]"