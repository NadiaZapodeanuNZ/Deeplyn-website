from django.db import migrations

NEW_EMOTIONS = [
    (0, "anger"),
    (1, "caring"),
    (2, "disappointment"),
    (3, "disgust"),
    (4, "embarrassment"),
    (5, "excitement"),
    (6, "fear"),
    (7, "gratitude"),
    (8, "joy"),
    (9, "love"),
    (10, "nervousness"),
    (11, "optimism"),
    (12, "pride"),
    (13, "remorse"),
    (14, "sadness"),
    (15, "surprise"),
    (16, "neutral"),
]


def update_emotions(apps, schema_editor):
    Emotion = apps.get_model("journal", "Emotion")
    NoteEmotion = apps.get_model("journal", "NoteEmotion")
    SharedNote = apps.get_model("journal", "SharedNote")
    NoteEmotion.objects.all().delete()
    SharedNote.objects.all().update(emotions_snapshot=[])
    Emotion.objects.all().delete()
    for vector_index, name in NEW_EMOTIONS:
        Emotion.objects.create(name=name, vector_index=vector_index)


def reverse_emotions(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('journal', '0006_sharednote_emotions_snapshot_and_more'),
    ]

    operations = [
        migrations.RunPython(update_emotions, reverse_emotions),
    ]