from django.contrib import admin
from django.urls import path, include  # <-- Added include here
from django.http import HttpResponse
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

# Simple home view to confirm server is live
def home(request):
    return HttpResponse("Hello, NailSync is running!")

urlpatterns = [
    # Home route (http://localhost:8000/)
    path('', home),

    # Admin route (http://localhost:8000/admin/)
    path('admin/', admin.site.urls),

    # JWT authentication routes
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),     # Login
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),   # Refresh token

    # NailSync Core Features API (Appointments, Buffers, Brands & Colors)
    path('api/', include('core.urls')), # <-- Added this line to activate your features!
]
