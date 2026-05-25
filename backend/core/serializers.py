from rest_framework import serializers
from .models import User, Client, Product, Service, Appointment, AppointmentDetail

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'brand', 'color_name_or_number']


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = ['id', 'name', 'description', 'price', 'default_duration_minutes']

    def create(self, validated_data):
        # Automatically tie the service to the logged-in nail tech user instance
        request = self.context.get('request')
        if request and request.user:
            validated_data['user'] = request.user
        return super().create(validated_data)


class AppointmentDetailSerializer(serializers.ModelSerializer):
    client_name = serializers.ReadOnlyField(source='appointment.client.name')
    appointment_time = serializers.ReadOnlyField(source='appointment.appointment_time')

    class Meta:
        model = AppointmentDetail
        fields = ['id', 'client_name', 'appointment_time', 'style', 'formula_recipe', 'materials']


class AppointmentSerializer(serializers.ModelSerializer):
    client_name = serializers.ReadOnlyField(source='client.name')
    service_details = ServiceSerializer(source='service', read_only=True)
    detail = AppointmentDetailSerializer(required=False)
    end_time_with_buffer = serializers.DateTimeField(read_only=True)

    class Meta:
        model = Appointment
        fields = [
            'id', 'client', 'client_name', 'service', 'service_details', 
            'appointment_time', 'duration_minutes', 'status', 
            'end_time_with_buffer', 'notes', 'detail'
        ]

    def create(self, validated_data):
        detail_data = validated_data.pop('detail', None)
        appointment = Appointment.objects.create(**validated_data)
        if detail_data:
            AppointmentDetail.objects.create(appointment=appointment, **detail_data)
        return appointment

    def update(self, instance, validated_data):
        detail_data = validated_data.pop('detail', None)
        
        # Update core appointment fields
        instance.service = validated_data.get('service', instance.service)
        instance.appointment_time = validated_data.get('appointment_time', instance.appointment_time)
        instance.duration_minutes = validated_data.get('duration_minutes', instance.duration_minutes)
        instance.status = validated_data.get('status', instance.status)
        instance.notes = validated_data.get('notes', instance.notes)
        instance.save()

        # Update or create detail records
        if detail_data:
            detail_instance, created = AppointmentDetail.objects.get_or_create(appointment=instance)
            detail_instance.style = detail_data.get('style', detail_instance.style)
            detail_instance.formula_recipe = detail_data.get('formula_recipe', detail_instance.formula_recipe)
            detail_instance.materials = detail_data.get('materials', detail_instance.materials)
            detail_instance.save()
            
        return instance


class ClientSerializer(serializers.ModelSerializer):
    appointments = AppointmentSerializer(many=True, read_only=True)

    class Meta:
        model = Client
        fields = ['id', 'name', 'phone_number', 'appointments']