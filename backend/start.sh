#!/bin/bash
# Production startup script for Railway

set -e

# Database readiness check with retry
# Supabase free tier databases may pause after inactivity;
# this loop waits for the database to become available.
MAX_RETRIES=10
RETRY_DELAY=5
echo "=== Checking database readiness ==="
for i in $(seq 1 $MAX_RETRIES); do
  DB_CHECK=$(python -c "
import django, os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.production')
import django; django.setup()
from django.db import connections
try:
    connections['default'].cursor().execute('SELECT 1')
    print('OK')
except Exception as e:
    import traceback
    print(f'ERROR:{e}')
    traceback.print_exc()
" 2>&1)
  if echo "$DB_CHECK" | grep -q '^OK$'; then
    echo "✓ Database is ready (attempt $i/$MAX_RETRIES)"
    break
  else
    echo "✗ Database not ready (attempt $i/$MAX_RETRIES)"
    echo "  └─ Error: $(echo "$DB_CHECK" | head -5)"
    if [ $i -eq $MAX_RETRIES ]; then
      echo "ERROR: Database did not become available after $MAX_RETRIES attempts"
      echo "Full error:"
      echo "$DB_CHECK"
      exit 1
    fi
    sleep $RETRY_DELAY
  fi
done

echo "=== Running database migrations ==="
python manage.py migrate --noinput

echo "=== Collecting static files ==="
python manage.py collectstatic --noinput --clear

echo "=== Starting gunicorn ==="
exec gunicorn config.wsgi:application \
    --bind 0.0.0.0:${PORT:-8000} \
    --workers ${GUNICORN_WORKERS:-4} \
    --worker-class sync \
    --timeout 120 \
    --access-logfile - \
    --error-logfile -
