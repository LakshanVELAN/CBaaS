from .base import *

DEBUG = False

# WhiteNoise serves static files in production (gunicorn doesn't)
MIDDLEWARE.insert(2, 'whitenoise.middleware.WhiteNoiseMiddleware')
STORAGES = {
    'staticfiles': {
        'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage',
    },
}
ALLOWED_HOSTS = os.environ.get('DJANGO_ALLOWED_HOSTS', '').split(',')

CORS_ALLOW_ALL_ORIGINS = False

import dj_database_url
DATABASES = {
    'default': dj_database_url.config(
        conn_max_age=600,
        ssl_require=True,
    )
}

# Run Celery tasks synchronously — no Redis/Celery worker needed in production
# This avoids the dependency on a Redis service on Railway
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True

# Security settings
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
