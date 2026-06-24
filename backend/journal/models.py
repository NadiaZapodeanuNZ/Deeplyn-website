from django.db import models
from django.contrib.auth import get_user_model
from users.models import ClientTherapist
from django.utils import timezone


User = get_user_model()

class Journal(models.Model):
    user = models.OneToOneField(User,on_delete=models.CASCADE,related_name='journal')
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self):
        return f"{self.user.username}'s Journal"

    class Meta:
        verbose_name = 'Journal'
        verbose_name_plural = 'Journals'
        db_table = 'journals'

class Note(models.Model):
    class EmotionsSource(models.TextChoices):
        NONE = 'none', 'None'
        MANUAL = 'manual', 'Manual'
        TRANSFORMER = 'transformer', 'Automatically'

    journal = models.ForeignKey(Journal,on_delete=models.CASCADE,related_name='notes')
    title = models.CharField(max_length=32, default='')
    content = models.TextField(max_length=1500,default ='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_favorite = models.BooleanField(default=False)
    is_shared  = models.BooleanField(default=False)
    
    emotions_source = models.CharField(max_length=15,choices=EmotionsSource.choices,default=EmotionsSource.NONE)

    def __str__(self):
        return f"Note #{self.pk} ({self.created_at.strftime('%d-%m-%Y %H:%M:%S')})"

    class Meta:
        ordering = ['-is_favorite','-created_at']
        verbose_name = 'Note'
        verbose_name_plural = 'Notes'
        db_table = 'notes'


class Emotion(models.Model):
    name = models.CharField(max_length=50, unique=True)
    vector_index = models.PositiveSmallIntegerField(unique=True)
    def __str__(self):
        return f"{self.vector_index} — {self.name}"
    class Meta:
        ordering = ['vector_index']
        verbose_name = 'Emotion'
        verbose_name_plural = 'Emotions'
        db_table = 'emotions'

class NoteEmotion(models.Model):
    class Source(models.TextChoices):
        MANUAL = 'manual', 'Manual'
        TRANSFORMER = 'transformer', 'Automatically'
    note = models.ForeignKey(Note, on_delete=models.CASCADE, related_name='note_emotions')
    emotion = models.ForeignKey(Emotion, on_delete=models.CASCADE, related_name='note_emotions')
    intensity = models.FloatField()  # 0.0 - 1.0
    source = models.CharField(max_length=15, choices=Source.choices)

    def __str__(self):
        return f"{self.emotion.name} ({self.intensity}) [{self.source}]"

    class Meta:
        verbose_name = 'Note Emotion'
        verbose_name_plural = 'Note Emotions'
        db_table = 'note_emotions'
        unique_together = ('note', 'emotion')
        constraints = [
            models.CheckConstraint(
                condition=models.Q(intensity__gte=0.0) & models.Q(intensity__lte=1.0),
                name='intensity_range'
            )
        ]


class SharedNote(models.Model):
    note = models.ForeignKey(Note, on_delete=models.SET_NULL, null=True, related_name='shared_copies')
    client = models.ForeignKey(User, on_delete=models.CASCADE, related_name='shared_notes_as_client')
    therapist = models.ForeignKey(User, on_delete=models.CASCADE, related_name='shared_notes_as_therapist')
    title = models.CharField(max_length=32)
    content = models.TextField(max_length=1500)
    emotions_source = models.CharField(max_length=15, choices=Note.EmotionsSource.choices, default=Note.EmotionsSource.NONE)
    emotions_snapshot = models.JSONField(default=list, blank=True)
    shared_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'shared_notes'
        unique_together = ('note', 'therapist')

    def __str__(self):
        return f"{self.client.username} - {self.therapist.username} | {self.title}"