from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from datetime import timedelta
import random
import string
import uuid

class User(AbstractUser):
    """Model(tabela) User care mosteneste AbstractUser.

    Mosteneste de la AbstractUser urmatoarele campuri : password,date_joined,last_login,first_name,last_name,is_staff,is_superuser
    Ceea ce modifica acest model este faptul ca emailul este unic si obligatoriu impreuna cu username-ul.
    De asemenea , setez is_active pe False la creearea contului deoarece vreau sa verific ca emailul este unul valid,
    adaugand totodata o forma de securitate pentru a preveni crearea de conturi false ,spam sau 
    cereri nedorite de conturi.
    Dupa ce utilizatorul isi creeaza contul si userul este verificat , is_active devine True , utilizatorul reusind astfel sa se logheze
    in contul sau

    Attributes:
        email (EmailField): Este necesar sa fie unic , obligatoriu pentru creearea unui cont valid
        username (CharField): Este necesar sa fie unic , obligatoriu pentru creearea unui cont valid
        is_active (bool): Indica daca contul utilizatorului este activ sau nu. 
        Implicit este setat pe False, ceea ce inseamna ca utilizatorul trebuie sa
        isi verifice emailul inainte de a putea accesa contul pe platforma.
        is_staff (bool): Acest camp indica daca utilizatorul are acces la interfata de administrare Django.
        Niciun cont creat nu are acest drept implicit (setat pe False), deci doar administratorul poate avea acest drept.
        is_superuser (bool): In acest caz, niciun utilizator nu are acest drept implicit
        deci va fi setat pe False pentru toate conturile create.
        password (CharField): Aceasta metoda asigura securitatea parolelor utilizatorilor, deoarece parolele nu sunt stocate in format text simplu, 
            ci intr-un format criptat care este dificil de spart chiar si cu resurse semnificative.
        date_joined (DateTimeField): Data si ora la care utilizatorul si-a creat contul.
        last_login (DateTimeField): Data si ora la care utilizatorul s-a logat ultima data.
    """
    email = models.EmailField(max_length=256, unique=True, null=False)
    username = models.CharField(max_length=32, unique=True, null=False)
    is_active = models.BooleanField(default=False)
    # AbstractUser help me to inherit some traits like:

    # username - CharField 
    # first_name - CharField (optional)
    # last_name -CharField – nume de familie (opțional)
    # password - hashed automatically, VARCHAR(128)
    # email - EmailField – email (overrided)
    # is_active - BooleanField – default True (my case - False)
    # is_staff - BooleanField  admin Django
    # is_superuser - BooleanField all permissions
    # date_joined - DateTimeField
    # last_login - DateTimeField 

    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"
        db_table = "users"

    def __str__(self):
        return f"{self.username} ({self.email})"


class EmailVerification(models.Model):
    """ Model (tabela) pentru verificarea emailului.

        Fiecare utilizator este intr-o relatie one-to-one cu tabela EmailVerification
        deoarece ,in procesul de verificare al emailului unic, fiecare utilizator are nevoie de un singur token de verificare.
        Acest model stocheaza tokenul de verificare (token), data expirarii acestuia (expires_at), numarul de incercari de resend (resend_attempts), numarul de incercari esuate (failed_attempts),
        data primei incercari de resend (first_resend_at) si data pana la care utilizatorul este blocat (blocked_until) in cazul in care depaseste numarul maxim de incercari permise pentru resend sau verificare.

        .

        Attributes:
            user (OneToOneField): O relatie one-to-one cu modelul User, care asociaza fiecare inregistrare de verificare a emailului cu un singur utilizator.
            token (CharField): Un token unic de 6 caractere generat pentru verificarea emailului. Acest token este trimis utilizatorului prin email pentru activarea contului.
            expires_at (DateTimeField): Perioada de valabilitate a tokenului, by default 5 minute pentru sporirea securitatii.
            resend_attempts (PositiveIntegerField): Un contor ce tine evidenta numarului de incercari de resend a tokenului. Acest camp este incrementat de fiecare data cand utilizatorul solicita un nou token.
            failed_attempts (PositiveIntegerField): Un contor ce tine evidenta numarului de incercari esuate de verificare a tokenului. Acest camp este incrementat de fiecare data cand utilizatorul introduce un token gresit.
            blocked_until (DateTimeField): Daca utilizatorul depaseste numarul maxim de incercari permise pentru resend sau verificare, acest camp este setat cu data si ora disponibila pentru reincercare. In acest interval, 
            utilizatorul este blocat si nu isi poate creea contul cu acelasi email/username.
            first_resend_at (DateTimeField): Acest camp inregistreaza data si ora primei incercari de resend a tokenului. Acesta este folosit pentru a implementa o logica de limitare a numarului de resends intr-un interval de timp specific, prevenind astfel abuzul prin cereri repetate de tokenuri noi intr-un timp scurt.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='email_verification')
    token = models.CharField(max_length=6)
    expires_at = models.DateTimeField()
    resend_attempts = models.PositiveIntegerField(default=0)
    failed_attempts = models.PositiveIntegerField(default=0)
    blocked_until = models.DateTimeField(null=True, blank=True)
    first_resend_at  = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Email Verification"
        db_table = "email_verification"

    def __str__(self):
        return f"{self.user.username} - {self.token}"

    def is_token_expired(self):
        """Metoda care verifica daca tokenul de verificare a emailului a expirat.
           Return:
                bool: True , daca tokenul a expirat,
                bool: False in caz contrar.
        """
        return timezone.now() > self.expires_at

    def is_blocked(self):
        """Metoda care verifica daca utilizatorul este momentan blocat
           de la solicitarea de tokenuri noi sau incercarea de verificare.
           Return:
                bool: True daca timpul curent este inainte de  blocked_until
                bool: False in caz contrar.
        """
        return self.blocked_until is not None and timezone.now() < self.blocked_until

    def generate_new_token(self):
        """Metoda care genereaza un nou token de verificare pentru utilizator, actualizeaza data expirarii si reseteaza contorii de incercari.
           Return:
                string: Noul token generat pentru verificarea emailului.

        """
        self.token = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        self.expires_at = timezone.now() + timedelta(minutes=5)
        self.save(update_fields=['token', 'expires_at'])
        return self.token
    
class PasswordReset(models.Model):
    """Model(tabela) pentru resetarea parolei.

        Fiecare utilizator poate avea mai multe inregistrari in tabela PasswordReset, 
        deoarece un utilizator poate solicita resetarea parolei de mai multe ori. 
        Acest model stocheaza tokenul de resetare a parolei (token), data expirarii
        acestuia (expires_at), numarul de incercari de resetare (request_attempts),
        data pana la care utilizatorul este blocat (blocked_until) in cazul in 
        care depaseste numarul maxim de incercari permise pentru resetare sau 
        verificare si un camp is_used pentru a marca daca tokenul a fost folosit deja sau nu.

        Attributes:
            user (ForeignKey): O relatie many-to-one cu modelul User, care asociaza 
                               fiecare inregistrare de resetare a parolei cu un utilizator specific. 
                               Un utilizator poate avea multiple inregistrari de resetare a parolei.
            token (UUIDField): Un token unic generat pentru resetarea parolei. Acest token 
                               este trimis utilizatorului prin email pentru a permite 
                               resetarea parolei.
            expires_at (DateTimeField): Perioada de valabilitate a tokenului, by default 15 minute 
                                        pentru sporirea securitatii.
            request_attempts (IntegerField): Un contor ce tine evidenta numarului de incercari 
                                             de resetare a parolei. Acest camp este incrementat de
                                             fiecare data cand utilizatorul solicita o noua resetare a parolei.
            blocked_until (DateTimeField): Daca utilizatorul depaseste numarul maxim de incercari permise pentru 
                                           resetarea parolei, acest camp este setat cu data si ora disponibila
                                           pentru reincercare. 
            is_used (BooleanField): Acest camp indica daca tokenul de resetare a parolei a fost folosit deja sau nu."""
    

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='password_resets')
    token = models.UUIDField(default=uuid.uuid4, unique=True)
    expires_at = models.DateTimeField()
    request_attempts = models.IntegerField(default=0)
    blocked_until = models.DateTimeField(null=True, blank=True)
    is_used = models.BooleanField(default=False)

    class Meta:
        db_table = "password_reset"

    def __str__(self):
        return f"{self.user.username} - {self.token}"

    def is_expired(self):
        return timezone.now() > self.expires_at

    def is_blocked(self):
        if self.blocked_until is None:
            return False
        return timezone.now() < self.blocked_until