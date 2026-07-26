import os
from pathlib import Path
from dotenv import load_dotenv
try:
    import dj_database_url
except ImportError:
    dj_database_url = None

import pymysql
pymysql.install_as_MySQLdb()

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(dotenv_path=BASE_DIR.parent / '.env')

SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', os.getenv('SECRET_KEY', 'django-insecure-change-this-in-production-now'))
DEBUG = os.getenv('DEBUG', 'False').lower() in ('true', '1', 't')
ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'users',
    'trading',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'core.middleware.RequestTimingMiddleware',
    'core.middleware.LastSeenMiddleware',
]

ROOT_URLCONF = 'bulllogic.urls'

FRONTEND_DIST = BASE_DIR.parent / 'frontend' / 'dist'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [FRONTEND_DIST] if FRONTEND_DIST.exists() else [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'bulllogic.wsgi.application'

# ── Database Configuration (Google Cloud SQL / Postgres / SQLite) -------------
DATABASE_URL = os.getenv('DATABASE_URL')
parsed_db = None
if DATABASE_URL and dj_database_url:
    try:
        # Standardize postgresql, mysql, and mssql schemes
        url = DATABASE_URL
        if url.startswith('postgres://'):
            url = url.replace('postgres://', 'postgresql://', 1)
        if url.startswith('mssql+pyodbc://'):
            url = url.replace('mssql+pyodbc://', 'mssql://', 1)
        
        is_mysql = False
        if url.startswith('mysql://') or url.startswith('mysql+pymysql://'):
            is_mysql = True
            url = url.replace('mysql+pymysql://', 'mysql://', 1)
            
        parsed_db = dj_database_url.parse(url, conn_max_age=600, conn_health_checks=True)
        
        if is_mysql and parsed_db:
            import urllib.parse as urlparse
            parsed_url = urlparse.urlparse(DATABASE_URL)
            query_params = urlparse.parse_qs(parsed_url.query)
            if 'unix_socket' in query_params:
                socket_path = query_params['unix_socket'][0]
                parsed_db['HOST'] = 'localhost'
                parsed_db['PORT'] = ''
                parsed_db['ENGINE'] = 'django.db.backends.mysql'
                parsed_db['OPTIONS'] = {'unix_socket': socket_path}
            elif os.getenv('K_SERVICE') is None:
                # Local environment check: test connection to local MySQL server
                try:
                    import pymysql
                    conn = pymysql.connect(
                        host=parsed_db.get('HOST', '127.0.0.1'),
                        port=int(parsed_db.get('PORT') or 3306),
                        user=parsed_db.get('USER', 'root'),
                        password=parsed_db.get('PASSWORD', ''),
                        database=parsed_db.get('NAME', 'bulllogic'),
                        connect_timeout=1
                    )
                    conn.close()
                except Exception as db_err:
                    print("Local MySQL database connection unverified (", db_err, "). Falling back to local SQLite database.")
                    parsed_db = None
        if parsed_db:
            engine = parsed_db.get('ENGINE', '')
            if 'sql_server' in engine or 'mssql' in engine:
                try:
                    import mssql
                except ImportError:
                    try:
                        import sql_server
                    except ImportError:
                        print("DATABASE_URL specified MSSQL but backend module is not installed. Falling back to SQLite.")
                        parsed_db = None
    except Exception as e:
        print("DATABASE_URL parsing error:", e)
        parsed_db = None

# Ensure instance directory exists for SQLite
DB_DIR = BASE_DIR.parent / 'instance'
DB_DIR.mkdir(parents=True, exist_ok=True)

if parsed_db:
    DATABASES = {'default': parsed_db}
elif os.getenv("DATABASE_TYPE") == "postgres":
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.getenv('POSTGRES_DB', 'bulllogic'),
            'USER': os.getenv('POSTGRES_USER', 'postgres'),
            'PASSWORD': os.getenv('POSTGRES_PASSWORD', ''),
            'HOST': os.getenv('POSTGRES_HOST', 'localhost'),
            'PORT': os.getenv('POSTGRES_PORT', '5432'),
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': DB_DIR / 'bulllogic_django.db',
        }
    }

AUTH_USER_MODEL = 'users.User'

PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.PBKDF2PasswordHasher',
    'users.hashers.WerkzeugHasher',  # verifies Flask/Werkzeug scrypt + pbkdf2 hashes
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = False  # match naive datetimes

# ── Static Files (Whitenoise + React SPA) ────────────────────────────────────
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

STATICFILES_DIRS = []
if FRONTEND_DIST.exists():
    STATICFILES_DIRS.append(FRONTEND_DIST)

STATICFILES_STORAGE = 'whitenoise.storage.CompressedStaticFilesStorage'
WHITENOISE_ROOT = FRONTEND_DIST if FRONTEND_DIST.exists() else None

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
}

CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:5175',
    'http://localhost:5000',
    'http://127.0.0.1:5000',
    'http://localhost:5001',
    'http://127.0.0.1:5001',
    'http://localhost:8002',
    'http://127.0.0.1:8002',
]
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_ALL_ORIGINS = True

IS_PRODUCTION = os.getenv('K_SERVICE') is not None

if IS_PRODUCTION:
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
else:
    SESSION_COOKIE_SECURE = False
    CSRF_COOKIE_SECURE = False

SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_AGE = 86400 * 7  # 7 days
CSRF_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_HTTPONLY = False    # React reads it
CSRF_TRUSTED_ORIGINS = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://localhost:5000',
    'http://127.0.0.1:5000',
    'http://localhost:5001',
    'http://127.0.0.1:5001',
    'http://localhost:8002',
    'http://127.0.0.1:8002',
    'https://*.run.app',
    'https://*.europe-west1.run.app',
    'https://triple-fusion-engine-git-914042770430.europe-west1.run.app',
    'https://triple-fusion-engine-github-914042770430.europe-west1.run.app',
]

# Email
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# ── Celery & Redis Configuration ──────────────────────────────────────────────
REDIS_URL = os.getenv('REDIS_URL', 'redis://127.0.0.1:6379/0')
CELERY_BROKER_URL = REDIS_URL
CELERY_RESULT_BACKEND = REDIS_URL
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'UTC'
