from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Client, Service, Product, Appointment, AppointmentDetail

# Inline detail view so you can see and edit formulas directly inside the Appointment page
class AppointmentDetailInline(admin.StackedInline):
    model = AppointmentDetail
    can_delete = False
    verbose_name_plural = 'Formula / Appointment Details'

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'is_nail_tech', 'is_staff')
    list_filter = ('is_nail_tech', 'is_staff', 'is_superuser')
    fieldsets = UserAdmin.fieldsets + (
        ('NailSync Roles', {'fields': ('is_nail_tech',)}),
    )

@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ('name', 'phone_number', 'user')
    search_fields = ('name', 'phone_number')
    list_filter = ('user',)

@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ('name', 'price', 'default_duration_minutes', 'user')
    search_fields = ('name',)
    list_filter = ('user',)

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('brand', 'color_name_or_number', 'user')
    search_fields = ('brand', 'color_name_or_number')
    list_filter = ('user', 'brand')

@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ('client', 'service', 'appointment_time', 'duration_minutes', 'status')
    list_filter = ('status', 'appointment_time', 'service')
    search_fields = ('client__name', 'service__name')
    inlines = [AppointmentDetailInline]

admin.site.register(AppointmentDetail)