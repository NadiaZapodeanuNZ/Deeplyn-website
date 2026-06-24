from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Session(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending','Pending'
        APPROVED = 'approved','Approved'
        REJECTED = 'rejected','Rejected'

    class SessionType(models.TextChoices):
        VIDEO = 'video','Video Session'
        IN_PERSON = 'in_person','In-Person'
        PHONE = 'phone','Phone Call'

    therapist = models.ForeignKey(User, on_delete=models.CASCADE, related_name='therapist_sessions')
    client = models.ForeignKey(User, on_delete=models.CASCADE, related_name='client_sessions')

    # create session client --> need_to_approve = therapist
    # create session therapist --> need_to_approve = client
    need_to_approve = models.ForeignKey(User,on_delete=models.SET_NULL,null=True,blank=True,related_name='sessions_to_approve')
    date = models.DateTimeField()
    session_type = models.CharField(max_length=20, choices=SessionType.choices, default=SessionType.VIDEO)
    client_notes = models.TextField(max_length=200, blank=True, default='')
    therapist_notes = models.TextField(max_length=200, blank=True, default='')
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'sessions'
        ordering = ['date']

    def __str__(self):
        return (
            f"{self.client.username} <----> {self.therapist.username} | "
            f"{self.date.strftime('%d %b %Y %H:%M')} ({self.status})"
        )
    
    def approve(self):
        self.status = Session.Status.APPROVED
        self.need_to_approve = None
        self.save(update_fields=['status', 'need_to_approve', 'updated_at'])

    def reject(self):
        self.status = Session.Status.REJECTED
        self.need_to_approve = None
        self.save(update_fields=['status', 'need_to_approve', 'updated_at'])

#  bcs i wanted to have 2 perspetives, especially in the admin where i debug things a lot 
#  the solution for the 2 type of sessions is to use a proxy model for each perspective
#  as i know from Django documentation, a normal model creates a new table in the
#  database and a python object that inherits from models.Model

# but the proxy model , in this case tells django TO NOT CREATE 2 MODELS
# but to use the same model --> Session , in 2 perspectives!

class SessionPendingTherapist(Session):
    class Meta:
        proxy = True
        verbose_name = 'session_therapist_approval'
        verbose_name_plural = 'sessions_therapist_approval'


class SessionPendingClient(Session):
    class Meta:
        proxy = True
        verbose_name = 'session_client_approval'
        verbose_name_plural = 'sessions_client_approval'
