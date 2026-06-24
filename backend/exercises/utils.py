from .models import ExerciseEmotion

def normalize_intensity(raw):
    return round(raw / 10.0, 4)


def create_exercise_emotions(completion, emotions_data, source):
    objs = [
        ExerciseEmotion(
            completion=completion,
            emotion=item['emotion'],
            intensity=normalize_intensity(item['intensity']),
            source=source)
        for item in emotions_data
    ]
    return ExerciseEmotion.objects.bulk_create(objs, ignore_conflicts=True)
