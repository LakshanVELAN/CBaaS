from .base import *

DEBUG = False

# WhiteNoise serves static files in production (gunicorn doesn't)
MIDDLEWARE.insert(2, 'whitenoise.middleware.WhiteNoiseMiddleware')
STORAGES = {
    'staticfiles': {
        'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage',
    },
}
ALLOWED_HOSTS = os.environ.get('DJANGO_ALLOWED_HOSTS', '.up.railway.app,localhost,127.0.0.1').split(',')
# Safety: always include Railway wildcard domain regardless of env var
if not any(h.endswith('.up.railway.app') or h == '.up.railway.app' for h in ALLOWED_HOSTS):
    ALLOWED_HOSTS.append('.up.railway.app')

# Allow overriding CORS via env var (e.g. set to 'True' when testing local frontend against production backend)
CORS_ALLOW_ALL_ORIGINS = os.environ.get('CORS_ALLOW_ALL_ORIGINS', 'False').lower() == 'true'

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

# CSRF Trusted Origins for Railway domain
CSRF_TRUSTED_ORIGINS = os.environ.get(
    'CSRF_TRUSTED_ORIGINS',
    'https://cbaas-production-32fb.up.railway.app,https://cbaas-production.up.railway.app',
).split(',')

# Security settings
# Railway terminates SSL at the edge proxy and forwards HTTP to gunicorn.
# SECURE_PROXY_SSL_HEADER tells Django to trust the X-Forwarded-Proto header
# so request.is_secure() works correctly behind Railway's proxy.
# SECURE_SSL_REDIRECT is disabled to avoid redirect loops — Railway handles
# HTTPS enforcement at the edge.
# Cache: ALWAYS use LocMemCache in production on Railway.
# The base.py CACHES setting points to Redis (localhost:6379) which doesn't
# exist on Railway. If REDIS_URL env var IS set (e.g. from a removed Redis
# service), the conditional check would skip this override, causing every
# cache access to hang trying to connect to a dead Redis URL.
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    }
}

SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
