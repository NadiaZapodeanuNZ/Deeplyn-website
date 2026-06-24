from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()

class QuizQuestion(models.Model):
    text = models.TextField(max_length=500)
    is_predefined = models.BooleanField(default=False, db_index=True)
    created_by = models.ForeignKey(User, null=True, blank=True,on_delete=models.SET_NULL,related_name='created_quiz_questions')
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'quiz_questions'
        verbose_name = 'Quiz Question'
        verbose_name_plural = 'Quiz Questions'

    def __str__(self):
        prefix = 'predefined' if self.is_predefined else f'by {self.created_by}'
        return f"[{prefix}] {self.text[:60]}"

class DailyQuiz(models.Model):
    class Source(models.TextChoices):
        APP = 'app', 'App'
        THERAPIST = 'therapist', 'Therapist'

    client = models.ForeignKey(User, on_delete=models.CASCADE,related_name='daily_quizzes')
    created_by = models.ForeignKey(User, null=True, blank=True,on_delete=models.SET_NULL,related_name='created_daily_quizzes')
    date = models.DateField()
    source = models.CharField(max_length=10, choices=Source.choices,default=Source.APP, db_index=True)
    is_shared_by_therapist = models.BooleanField(default=False)
    deadline = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'daily_quizzes'
        verbose_name = 'Daily Quiz'
        verbose_name_plural = 'Daily Quizzes'
        constraints = [models.UniqueConstraint(fields=['client', 'date', 'source'],name='one_quiz_per_source_per_day')]

    def __str__(self):
        return f"{self.client.username} | {self.date} [{self.source}]"

    @property
    def has_shared_answers(self):
        return self.answers.filter(is_shared_by_client=True).exists()

    @property
    def is_expired(self):
        if self.deadline is None:
            return False
        return timezone.now().date() > self.deadline

    @property
    def is_fully_submitted(self):
        total = self.answers.count()
        if total == 0:
            return False
        return self.answers.filter(is_submitted=True).count() == total


class DailyQuizQuestion(models.Model):
    daily_quiz = models.ForeignKey(DailyQuiz, on_delete=models.CASCADE,related_name='quiz_questions')
    question = models.ForeignKey(QuizQuestion, on_delete=models.CASCADE,related_name='daily_appearances')
    order = models.PositiveSmallIntegerField()
    max_chars = models.PositiveIntegerField(default=500)
 
    class Meta:
        db_table = 'daily_quiz_questions'
        ordering = ['order']
        unique_together = [
            ('daily_quiz', 'order'),
            ('daily_quiz', 'question')] 
 
    def __str__(self):
        return f"{self.daily_quiz} - Q{self.order} (max {self.max_chars})"
    
class DailyQuizAnswer(models.Model):
    class EmotionsSource(models.TextChoices):
        NONE = 'none', 'None'
        MANUAL = 'manual', 'Manual'
        TRANSFORMER = 'transformer', 'Automatically'

    daily_quiz = models.ForeignKey(DailyQuiz, on_delete=models.CASCADE,related_name='answers')
    question = models.ForeignKey(QuizQuestion, on_delete=models.PROTECT,related_name='answers')
    answer_text = models.TextField(max_length=1000, blank=True, default='')
    emotions_source = models.CharField(max_length=15, choices=EmotionsSource.choices,default=EmotionsSource.NONE)
    is_submitted = models.BooleanField(default=False)
    submitted_at = models.DateTimeField(null=True, blank=True)
    is_shared_by_client = models.BooleanField(default=False)

    class Meta:
        db_table = 'daily_quiz_answers'
        verbose_name = 'Daily Quiz Answer'
        verbose_name_plural = 'Daily Quiz Answers'
        unique_together = ('daily_quiz', 'question')

    def __str__(self):
        status = 'submitted' if self.is_submitted else 'draft'
        return f"{self.daily_quiz.client.username} | {self.daily_quiz.date} [{status}]"

class QAEmotion(models.Model):
    class Source(models.TextChoices):
        MANUAL = 'manual', 'Manual'
        TRANSFORMER = 'transformer', 'Automatically'

    answer = models.ForeignKey(DailyQuizAnswer, on_delete=models.CASCADE,related_name='answer_emotions')
    emotion = models.ForeignKey('journal.Emotion', on_delete=models.CASCADE,related_name='quiz_answer_emotions')
    intensity = models.FloatField()
    source = models.CharField(max_length=15, choices=Source.choices)

    class Meta:
        db_table = 'quiz_answer_emotions'
        verbose_name = 'QA Emotion'
        verbose_name_plural = 'QA Emotions'
        unique_together = ('answer', 'emotion')
        constraints = [
            models.CheckConstraint(
                condition=models.Q(intensity__gte=0.0) & models.Q(intensity__lte=1.0),
                name='quiz_intensity_range')]

    def __str__(self):
        return f"{self.emotion.name} ({self.intensity}) [{self.source}]"


class QuizDraft(models.Model):
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='quiz_drafts')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
 
    class Meta:
        db_table = 'quiz_drafts'
        ordering = ['-created_at']
 
    def __str__(self):
        return f"Draft by {self.created_by}"
 
 
class QuizDraftQuestion(models.Model):
    draft = models.ForeignKey(QuizDraft, on_delete=models.CASCADE, related_name='draft_questions')
    question = models.ForeignKey(QuizQuestion, on_delete=models.CASCADE, related_name='draft_appearances')
    order = models.PositiveSmallIntegerField()
    max_chars = models.PositiveIntegerField(default=500)
 
    class Meta:
        db_table = 'quiz_draft_questions'
        ordering = ['order']
        unique_together = [
            ('draft', 'order'),
            ('draft', 'question')]
 
    def __str__(self):
        return f"Draft Q{self.order} - {self.question.text[:40]}"