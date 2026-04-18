<!-- I test here the actual api :
urlpatterns = [
    # Registration and email verification
    path('register/', register, name='register'),
    path('verify-email/', verify_email, name='verify-email'),
    path('resend-token/', resend_token, name='resend-token'),

    # Authentication
    path('login/', login, name='login'),
    path('login/refresh/', refresh_token, name='refresh-token'),
    path('login/with-link/', login_with_link, name='login-with-link'),
    path('logout/', logout, name='logout'),

    # Password management
    path('forgot-password/', forgot_password, name='forgot-password'),
    path('reset-password/', reset_password, name='reset-password'),
] -->




<!-- so the paths for users are like this:
POST    http://127.0.0.1:8000/api/users/register/ ✔️
POST    http://127.0.0.1:8000/api/users/verify-email/✔️
POST    http://127.0.0.1:8000/api/users/resend-token/ ✔️

POST    http://127.0.0.1:8000/api/users/login/ ✔️ (?)
POST    http://127.0.0.1:8000/api/users/login/refresh/ (REFRESH-TOKEN)✔️
GET     http://127.0.0.1:8000/api/users/login/with-link/✔️(?)


POST    http://127.0.0.1:8000/api/users/logout/

POST    http://127.0.0.1:8000/api/users/forgot-password/
POST    http://127.0.0.1:8000/api/users/reset-password/ -->


<!-- 
POST = modifica ce e pe server, NECESAR SA AIBE BODY CA IN EL TRIMIT DATELE 
       MAI SECURE. NU APARE IN URL
* POST requests are never cached
* POST requests do not remain in the browser history
* POST requests cannot be bookmarked
* POST requests have no restrictions on data length


GET = candx vr sa vad anumite date. nu modifica nimic pe server
      APARE IN URL, NU ARE BODY

* GET requests can be cached
* GET requests remain in the browser history
* GET requests can be bookmarked
* GET requests should never be used when dealing with sensitive data
* GET requests have length restrictions
* GET requests are only used to request data (not modify) -->



TESTEEEEEE:


<!-- POST    http://127.0.0.1:8000/api/users/register/

1) cand userul pune gresit username-ul -> len(username) < 4

{
    "username": "max",
    "email":"zapona2f@gmail.com",
    "password":"Test123!!!",
    "confirm_pass":"Test123!!!"
}


2) cand userul are username-ul len(username)>32
{
    "username": "maximilian3000autoservicedeskshamalamadingdong3000",
    "email":"zapona2f@gmail.com",
    "password":"Test123!!!",
    "confirm_pass":"Test123!!!"
}


3) cand userul are un gmail inactiv:
 
 {
    "username": "maximilan200",
    "email":"test123@gmail.com",
    "password":"Test123!!!",
    "confirm_pass":"Test123!!!"
}

4) cand userul nu isi pune corect emailul:
{
    "username": "maximilan2000",
    "email":"zapona2f@gmail.com@gmail.com",
    "password":"Test123!!!",
    "confirm_pass":"Test123!!!"
}

{
    "username": "maximilan2000",
    "email":"zapona2fgmai.com",
    "password":"Test123!!!",
    "confirm_pass":"Test123!!!"
}

{
    "username": "maximilian",
    "email":"zapona2f@gmail_com",
    "password":"Test123!!!",
    "confirm_pass":"Test123!!!"
}

5) parola nu e ce trebuie:

{
    "username": "maximilian2000",
    "email":"zapona2f@gmail.com",
    "password":"Test!!!",
    "confirm_pass":"Test!!!"
}

{
    "username": "maximilian2000",
    "email":"zapona2f@gmail.com",
    "password":"Test",
    "confirm_pass":"Test"
}

7) parola are mai putine caractere decat prevede legea
{
    "username": "maximilian2000",
    "email":"zapona2f@gmail.com",
    "password":"test",
    "confirm_pass":"test"
}
{
    "username": "maximilian2000",
    "email":"zapona2f@gmail.com",
    "password":"test2!!!",
    "confirm_pass":"test2!!!"
}

8) parola e mai lunga decat trebuie:

{
    "username": "maximilian2000",
    "email":"zapona2f@gmail.com",
    "password":"Test234qwertyuiopasdfghjklmnbvcxzzxcvbnmmaximilian50000hbfbhbbbhbbb!!!",
    "confirm_pass":"Test234qwertyuiopasdfghjklmnbvcxzzxcvbnmmaximilian50000hbfbhbbbhbbb!!!"
}

9) mismatch la parole:

{
    "username": "maximilian2000",
    "email":"zapona2f@gmail.com",
    "password":"Test1234!!!",
    "confirm_pass":"Test12345!!!"
}

email: abc
username:xyz

email: altceva1
username:qwe





10) everything works fine

{
    "username": "nadia_enzet2000",
    "email":"zapona2f@gmail.com",
    "password":"Test1234!!!",
    "confirm_pass":"Test1234!!!"
} 



POST    http://127.0.0.1:8000/api/users/verify-email/
1)    email invalid! - nu acest email a trimis cererea de inregistrare
    {
      "email" : "timoleon1903@gmail.com",
      "token" : "X602G0"
     }

2) email invalid : nu exista emailul
    {
      "email" : "timoleon1903123456789098765432@gmail.com",
      "token" : "X602G0"
     }
3) email invalid

    {
      "email" : "timoleon1903@gmail.com@gmail.com",
      "token" : "X602G0"
     }

4) token incorect
    {
      "email" : "zapona2f@gmail.com",
      "token" : "XXXX5"
     }
    
     {
      "email" : "zapona2f@gmail.com",
      "token" : "XXXXXX7"
     }

      {
      "email" : "zapona2f@gmail.com",
      "token" : "XXXXX6"
     }

5) token corect!!
 {
      "email" : "zapona2f@gmail.com",
      "token" : ""
 }


LOGIN TESTE!!!!

POST    http://127.0.0.1:8000/api/users/login/

1) LOGIN LEGIT!!
  a. identifier = email , remember_me = true

{
  "identifier":"zapona2f@gmail.com",
  "password":"Test1234!!!",
  "remember_me":"True"
}
  b. identifier = username, remember_me = true
{
  "identifier":"nadia_enzet2000",
  "password":"Test1234!!!",
  "remember_me":"True"
}
c. identifier = email , remember_me = false

{
  "identifier":"zapona2f@gmail.com",
  "password":"Test1234!!!",
  "remember_me":"False"
}
d. identifier = username, remember_me = false

{
  "identifier":"nadia_enzet2000",
  "password":"Test1234!!!",
  "remember_me":"False"
}

T/////////////OATE MERG BINE DAR NU STIU CE AR TREBUI SA VAD PT REMEMBER_ME = FALSE!!!! ????????????????????

2) variatii care nu merg:
--nu exista acest username
{
  "identifier":"nadia2000",              
  
  "password":"Test1234!!!",
  "remember_me":"True"
}
MERGE CUM TREBUIE - invalid creditentials
11 ms

--nu exista acest email
{ 
  "identifier":"pika.chiu.tup@gmail.com",
  "password":"Test1234!!!",                 
  "remember_me":"True"
}
 MERGE CUM TREBUIE - invalid creditentials 
 13 ms


--nu este parola corecta:

{
  "identifier":"nadia_enzet2000",
  "password":"Test1234567890!!!",
  "remember_me":"True"
}
 MERGE CUM TREBUIE - invalid creditentials 
 930 ms
--cont neverificat inca:

{
  "identifier":"pika.chiu.tup.tup@gmail.com",
  "password":"Test1234!!!",
  "remember_me":"True"
}

 MERGE CUM TREBUIE - {
    "non_field_errors": [
        "Account is not activated. Please verify your email."
    ]
}
 904 ms

{
  "identifier":"Timok3000",
  "password":"Test1234!!!",
  "remember_me":"True"
}
la fel si aici

POST    http://127.0.0.1:8000/api/users/forgot-password/
1) totul merge:

{
  "email":"zapona2f@gmail.com"
}

a mers, s au trimis 2 link uri, noi vom face login cu link
merge!!!!
daca mai incercam a doua oara nu merge!!!














































delete function serializer:
vrem sa stergem contul - cum facem asta?
avem nevoie de un buton care butonul ala face toata treaba adica 

buton -> un url nou !
url ul va arata asa 
Delete http://127.0.0.1:8000/api/users/delete-account/

userul TREBUIE SA fie logat, trebuie sa isi puna parola ca sa isi stearga contul

