"""
E2E test settings — uses SQLite so no external services are needed.
Overrides DATABASES to use SQLite in-memory for fast testing.
"""
import os
from .base import *  # noqa: F401, F403

# Use SQLite for E2E testing
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.path.join(BASE_DIR, 'e2e_test_db.sqlite3'),
    }
}

# Disable Redis cache (use local memory instead)
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    }
}

# Disable Celery (run tasks synchronously for testing)
CELERY_TASK_ALWAYS_EAGER = True
CELERY_BROKER_URL = None
CELERY_RESULT_BACKEND = None

# Enable debug for detailed error responses
DEBUG = True

# Allow all hosts for testing
ALLOWED_HOSTS = ['*']

# Allow all CORS origins for testing
CORS_ALLOW_ALL_ORIGINS = True
