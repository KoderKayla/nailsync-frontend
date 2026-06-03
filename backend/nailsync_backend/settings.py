# Django settings for nailsync_backend project.

from pathlib import Path
from datetime import timedelta 

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = 'django-insecure-u3^c0pei*-7$twg)mcznx@t-t8d=24+e47-@e9fl8jx6rdu6_%'

DEBUG = True

ALLOWED_HOSTS = ['*']

# 🔌 Installed Apps
INSTALLED_APPS = [
    'corsheaders',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',  
    'core',            # Keep only your updated core app here
]

# 🧱 Middleware
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'nailsync_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'nailsync_backend.wsgi.application'

# 🗄️ Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# 🔐 Password Validators
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.numeric_password_validation.NumericPasswordValidator'},
]

# 🌐 Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# 🖼️ Static Files
STATIC_URL = 'static/'

STATIC_ROOT = BASE_DIR / 'staticfiles'

# 🆔 Default Primary Key Field
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ✅ REST Framework Settings for JWT
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
}

# 🔐 Simple JWT Settings Optimized for App Development
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=90),    # ✅ Increased to 90 days so you stay signed in
    'REFRESH_TOKEN_LIFETIME': timedelta(days=180),  # ✅ Increased to 180 days
    'ROTATE_REFRESH_TOKENS': True,                  # ✅ Keeps tokens cycling smoothly
    'BLACKLIST_AFTER_ROTATION': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

AUTH_USER_MODEL = 'core.User'

CORS_ALLOWED_ORIGINS = [
    "https://nailsync-frontend.onrender.com",
    "http://127.0.0.1:3000",
]

CORS_ALLOW_CREDENTIALS = True