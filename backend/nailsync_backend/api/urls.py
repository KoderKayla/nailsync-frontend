from django.urls import path
from .views import HelloWorld
from rest_framework.authtoken.views import obtain_auth_token

urlpatterns = [
    path('hello/', HelloWorld.as_view(), name='hello-world'),
    path('login/', obtain_auth_token, name='api-token-auth'),  # ✅ Add this line
]

