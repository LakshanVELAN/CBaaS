#!/bin/bash
# Production startup script for Railway
# v3 - added DATABASE_URL safety net + data integrity check

set -e

# ============================================================
# 🔒 DATABASE_URL SAFETY NET
# Prevents deploying against a blank/wrong database.
#
# How it works:
#   Set EXPECTED_DB_NAME in Railway env vars to the database
#   name from your Neon connection string. If the current
#   DATABASE_URL points to a different database (e.g. after
#   a Neon branch switch or accidental env var change), the
#   deploy will fail early with a clear message.
#
#   To find your DB name: look at DATABASE_URL after the last /:
#     postgresql://user:pass@ep-example.us-east-1.aws.neon.tech/my_db
#                                                               ^^^^^^
#   Set EXPECTED_DB_NAME=my_db in Railway env vars.
#
#   Not set? The check still validates DATABASE_URL is present
#   and looks like a real connection string.
# ============================================================
if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is not set — cannot connect to any database."
  echo "  Set DATABASE_URL in Railway env vars to your Neon PostgreSQL URL."
  exit 1
fi

echo "=== Checking DATABASE_URL safety ==="

# Extract the database name from the URL (last path segment before ?)
CURRENT_DB_NAME=$(echo "$DATABASE_URL" | sed -n 's|.*/\([^/?]*\)\(\?.*\)*$|\1|p')
if [ -z "$CURRENT_DB_NAME" ]; then
  echo "⚠️  Could not parse database name from DATABASE_URL"
  echo "   URL format: $(echo "$DATABASE_URL" | sed 's/:[^:@]*@/:****@/' | head -c 80)..."
else
  echo "📦 Current database: $CURRENT_DB_NAME"
fi

# If EXPECTED_DB_NAME is set, compare against current DB
if [ -n "${EXPECTED_DB_NAME:-}" ]; then
  if [ "$CURRENT_DB_NAME" != "$EXPECTED_DB_NAME" ]; then
    echo "ERROR: Database name mismatch!"
    echo "  Expected: $EXPECTED_DB_NAME  (from EXPECTED_DB_NAME env var)"
    echo "  Current:  $CURRENT_DB_NAME   (from DATABASE_URL)"
    echo ""
    echo "This usually means DATABASE_URL was changed to point to a different"
    echo "database. If this is intentional, update EXPECTED_DB_NAME in Railway"
    echo "env vars to match the new database name."
    exit 1
  fi
  echo "✅ Database name matches EXPECTED_DB_NAME — correct database confirmed"
else
  echo "⚠️  EXPECTED_DB_NAME not set — skipping database name check"
  echo "   (Set EXPECTED_DB_NAME in Railway env vars for protection)"
fi

# ============================================================
# Database readiness check with retry
# Neon free tier databases may pause after inactivity;
# this loop waits for the database to become available.
# ============================================================
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

echo "=== Checking data integrity ==="
python manage.py check_data_integrity 2>&1

echo "=== Seeding super admin ==="
python manage.py seed_superadmin --email lakshanraja85@gmail.com --password lakshan@12345 --name "Lakshan Raja" 2>&1 || echo "Super admin seed skipped (may already exist)"

echo "=== Seeding demo tenant ==="
python manage.py seed_demo_tenant --email lakshanraja85@gmail.com --password lakshan@12345 --name "CBaaS Demo" --plan pro 2>&1 || echo "Demo tenant seed skipped (may already exist)"

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
