from rest_framework import viewsets, status
from rest_framework.response import Response
from django.core.exceptions import ValidationError  # Crucial import for catching the buffer conflicts
from .models import Client, Product, Service, Appointment, AppointmentDetail
from .serializers import ClientSerializer, ProductSerializer, ServiceSerializer, AppointmentSerializer, AppointmentDetailSerializer 

class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer

    def get_queryset(self):
        # Keeps it secure so techs only see their own clients
        return Client.objects.filter(user=self.request.user)


class ServiceViewSet(viewsets.ModelViewSet):
    """Endpoints for managing the salon service menu."""
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer

    def get_queryset(self):
        # Techs only see and manage their own service catalog
        return Service.objects.filter(user=self.request.user)


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

    def get_queryset(self):
        return Product.objects.filter(user=self.request.user)


class AppointmentViewSet(viewsets.ModelViewSet):
    """Endpoints for managing primary schedule data."""
    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer

    def get_queryset(self):
        # Shows appointments where the client belongs to this specific technician
        return Appointment.objects.filter(client__user=self.request.user)


class AppointmentDetailViewSet(viewsets.ModelViewSet):
    queryset = AppointmentDetail.objects.all()
    serializer_class = AppointmentDetailSerializer

    def get_queryset(self):
        # Techs only see details/recipes for their own client base
        return AppointmentDetail.objects.filter(appointment__client__user=self.request.user)

    def create(self, request, *args, **kwargs):
        # 1. Look up or create the client
        client_name = request.data.get('client_name') or request.data.get('client', {}).get('name')
        client_phone = request.data.get('client_phone') or request.data.get('client', {}).get('phone', '')

        if not client_name:
            return Response({"error": "Client name is required."}, status=status.HTTP_400_BAD_REQUEST)

        client_obj, created = Client.objects.get_or_create(
            user=request.user, 
            name=client_name,
            defaults={'phone_number': client_phone}
        )

        # 2. Extract Service configuration if passed from the frontend
        service_id = request.data.get('service')
        service_obj = None
        duration_minutes = request.data.get('duration_minutes', 60)

        if service_id:
            try:
                service_obj = Service.objects.get(pk=service_id, user=request.user)
                # If no custom duration was passed, use the default service duration
                if 'duration_minutes' not in request.data:
                    duration_minutes = service_obj.default_duration_minutes
            except Service.DoesNotExist:
                return Response({"error": "Selected service does not exist in your catalog."}, status=status.HTTP_400_BAD_REQUEST)

        # 3. Try creating the parent Appointment slot & intercept buffer blocks
        appointment_time = request.data.get('appointment_time')
        
        try:
            appointment_obj = Appointment.objects.create(
                client=client_obj,
                service=service_obj,
                appointment_time=appointment_time,
                duration_minutes=duration_minutes,
                status=request.data.get('status', 'PENDING'),
                notes=request.data.get('notes', f"Formula setup for {client_name}")
            )
        except ValidationError as e:
            # Extracts your model validation string message seamlessly
            error_message = e.message_dict.get('__all__', [str(e)])[0] if hasattr(e, 'message_dict') else str(e)
            return Response({"booking_conflict": error_message}, status=status.HTTP_400_BAD_REQUEST)

        # 4. Pull the custom style, recipe, and materials fields from the frontend request
        detail_data = {
            'style': request.data.get('style', ''),
            'formula_recipe': request.data.get('formula_recipe', {}),
            'materials': request.data.get('materials', [])
        }

        # 5. Pass the data to the serializer
        serializer = self.get_serializer(data=detail_data)
        
        # 6. Save the appointment instance DIRECTLY inside the save block!
        if serializer.is_valid():
            serializer.save(appointment=appointment_obj)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        # If serialization validation fails for style/recipe, delete the appointment we just made
        appointment_obj.delete()
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)