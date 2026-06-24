import random
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from .models import QuizQuestion, DailyQuiz, DailyQuizQuestion, DailyQuizAnswer
from .exceptions import NotEnoughQuestions

QUESTIONS_PER_DAY = 5

#  so , i aply the priority logic here!!
# when the client open Daily Quiz what can see?

# case 1 : if they have an ACTIVE THERAPIST ? If the therapist GAVE THEM A QUIZ , with
# -no deadline ---> deadline is today
# -published (share with client)
# - THIS IS HIGH PRIORITY SO I WILL SHOW THIS ONE

# case 2: No ! So it exists a quiz app for today ?
# - i will show that

# case 3: if it doesn t exist , GENERATE APP QUIZ

#   IF THE ACTIVE QUIZ TODAY FROM THERAPIST WAS COMPLETED BY CLIENT AND SUBMITED , 
# WE GENERATE A NEW QUIZ - APP - FOR THE NEXT DAY !!! 

def get_today_quiz_for_client(user):
    today = timezone.now().date()
    therapist_quiz = DailyQuiz.objects.prefetch_related('quiz_questions__question','answers__answer_emotions__emotion',
    ).filter(client=user,source=DailyQuiz.Source.THERAPIST,is_shared_by_therapist=True,
    ).filter(Q(date__lte=today, deadline__gte=today)| Q(deadline__isnull=True, date=today)
    ).order_by('-date').first()

    if therapist_quiz:
        total = therapist_quiz.answers.count()
        submitted = therapist_quiz.answers.filter(is_submitted=True).count()

        if total == 0 or submitted < total:
            return therapist_quiz

        last_submitted = therapist_quiz.answers.filter(is_submitted=True,
        ).order_by('-submitted_at').first()

        if last_submitted and last_submitted.submitted_at.date() == today:
            return therapist_quiz

    app_quiz = DailyQuiz.objects.prefetch_related('quiz_questions__question','answers__answer_emotions__emotion',
    ).filter(client=user,date=today,source=DailyQuiz.Source.APP,
    ).first()

    if app_quiz:
        return app_quiz
    return _generate_app_quiz(user, today)


# generate a quiz app , by default 5 questions from 500, random
# but i dont want them to be repeated 
# so , we have the 500 predefined questions and at every quiz, 
# 5 questions are used , so 500 - 5 choosed random questions
# random.sample will choose THE REMAIN QUESTIONS!!
# when the questions predefined are empty (all of them were used)
# repeat the cycle!!!! 
def _generate_app_quiz(user, date):
    all_predefined_ids = set(QuizQuestion.objects.filter(is_predefined=True,
        ).values_list('id', flat=True))

    if len(all_predefined_ids) < QUESTIONS_PER_DAY:
        raise NotEnoughQuestions()
    
    seen_ids = set(DailyQuizQuestion.objects.filter(daily_quiz__client=user,daily_quiz__source=DailyQuiz.Source.APP,
        ).values_list('question_id', flat=True))

    available_ids = all_predefined_ids - seen_ids

    if len(available_ids) < QUESTIONS_PER_DAY:
        available_ids = all_predefined_ids

    selected_ids = random.sample(list(available_ids), QUESTIONS_PER_DAY)

    with transaction.atomic():
        quiz = DailyQuiz.objects.create(client=user, created_by=None, date=date, source=DailyQuiz.Source.APP, is_shared_by_therapist=False)

        for order, q_id in enumerate(selected_ids, start=1):
            DailyQuizQuestion.objects.create( daily_quiz=quiz, question_id=q_id, order=order, max_chars=500)
            DailyQuizAnswer.objects.create(daily_quiz=quiz,question_id=q_id)

    quiz = DailyQuiz.objects.prefetch_related('quiz_questions__question','answers__answer_emotions__emotion',).get(id=quiz.id)
    return quiz

