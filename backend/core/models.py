from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from datetime import timedelta

class User(AbstractUser):
    is_nail_tech = models.BooleanField(default=True)

    def __str__(self):
        return self.username


class Client(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='clients')
    name = models.CharField(max_length=100)
    phone_number = models.CharField(max_length=20)

    def __str__(self):
        return self.name


class Service(models.Model):
    """The menu of salon services available for booking (e.g., Gel Mani, Full Set)."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='services')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=6, decimal_places=2, help_text="Cost of the service")
    default_duration_minutes = models.PositiveIntegerField(default=60, help_text="Standard duration in minutes")

    class Meta:
        unique_together = ('user', 'name')

    def __str__(self):
        return f"{self.name} (${self.price})"


class Product(models.Model):
    """Tracks brands and colors distinctly so techs don't have to retype them."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='inventory')
    brand = models.CharField(max_length=100, help_text="e.g., DND, OPI, Après")
    color_name_or_number = models.CharField(max_length=100, help_text="e.g., Bubble Bath, Spiced Chai, #42")

    class Meta:
        unique_together = ('user', 'brand', 'color_name_or_number')

    def __str__(self):
        return f"{self.brand} - {self.color_name_or_number}"


class Appointment(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('CONFIRMED', 'Confirmed'),
        ('CANCELLED', 'Cancelled'),
        ('COMPLETED', 'Completed'),
    ]

    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='appointments')
    service = models.ForeignKey(Service, on_delete=models.PROTECT, related_name='appointments', null=True, blank=True)
    appointment_time = models.DateTimeField()
    duration_minutes = models.PositiveIntegerField(default=60, help_text="Service time in minutes")
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDING')
    notes = models.TextField(blank=True)

    @property
    def end_time_with_buffer(self):
        """Calculates the time the block ends, adding a 15-minute cleaning buffer."""
        return self.appointment_time + timedelta(minutes=self.duration_minutes + 15)

    def clean(self):
        """Validates that this appointment doesn't overlap with existing ones, accounting for buffers."""
        if not self.appointment_time:
            return

        start_time = self.appointment_time
        end_time = self.end_time_with_buffer

        # Check for overlapping appointments belonging to the same tech (User)
        overlapping_appointments = Appointment.objects.filter(
            client__user=self.client.user,
            appointment_time__lt=end_time
        ).exclude(pk=self.pk)

        for app in overlapping_appointments:
            if app.end_time_with_buffer > start_time:
                raise ValidationError(
                    f"Booking Conflict: This slots into an existing appointment with {app.client.name} "
                    f"which includes a 15-minute cleanup buffer (Busy until {app.end_time_with_buffer.strftime('%I:%M %p')})."
                )

    def save(self, *args, **kwargs):
        # Automatically pull duration from the chosen Service if not manually customized
        if self.service and not self.id and self.duration_minutes == 60:
            self.duration_minutes = self.service.default_duration_minutes
            
        self.full_clean()  # Forces the clean method to run before saving
        super().save(*args, **kwargs)

    def __str__(self):
        service_name = self.service.name if self.service else "No Service Listed"
        return f"{self.client.name} - {service_name} @ {self.appointment_time.strftime('%b %d, %I:%M %p')}"


class AppointmentDetail(models.Model):
    appointment = models.OneToOneField(Appointment, on_delete=models.CASCADE, related_name='detail')
    style = models.CharField(max_length=100, help_text="e.g., French Tips, Ombré, Chrome finish")
    
    # The Recipe: Connects to structured lists of products used
    formula_recipe = models.JSONField(default=dict, blank=True) 
    materials = models.JSONField(default=list, blank=True, help_text="List of accessories like gems, foils, charms")

    def __str__(self):
        return f"Formula for {self.appointment.client.name}"