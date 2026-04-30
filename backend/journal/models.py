from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
User = get_user_model()


class Journal(models.Model):
    user = models.OneToOneField(User,on_delete=models.CASCADE,related_name='journal')
    # one to one field 
    # so an user has only one journal and a journal belongs to only one user
    # in this case , the journal is created automatically when the user is created
    # and Django automatically put CONSTRAINTS UNIQUE on user id in the journal table
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
        # first element is the value stored in the database, second element is the human readable name


    journal = models.ForeignKey(Journal,on_delete=models.CASCADE,related_name='notes')
    # crypted fields
    title_encrypted = models.BinaryField()
    title_iv = models.BinaryField(max_length=12)
    content_encrypted = models.BinaryField()
    content_iv = models.BinaryField(max_length=12)
    # crypted because i want to provide security/confidentiality
    # for the user's notes, so even if someone gets access to the database,
    # they won't be able to read the notes without the encryption key


    # plaintext fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_favorite = models.BooleanField(default=False) 
    # a note can be favourite!
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
    vector_index = models.PositiveSmallIntegerField(unique=True)  # 0-27

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