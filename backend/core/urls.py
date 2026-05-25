from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ClientViewSet, ProductViewSet, ServiceViewSet, AppointmentViewSet, AppointmentDetailViewSet

router = DefaultRouter()
router.register(r'clients', ClientViewSet)
router.register(r'products', ProductViewSet)
router.register(r'services', ServiceViewSet, basename='service')
router.register(r'appointments/schedule', AppointmentViewSet, basename='appointment-schedule')
router.register(r'appointments', AppointmentDetailViewSet, basename='formula') # links frontend /api/appointments/ here

urlpatterns = [
    path('', include(router.urls)),
]