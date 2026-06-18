import time
import hashlib
import logging
from django.conf import settings
from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger(__name__)


class ApiKeyAuthMiddleware(MiddlewareMixin):
    """Authenticates requests via API key OR JWT token in Authorization header."""

    EXEMPT_PATHS = [
        '/health/',
        '/api/v1/tenants/register/',
        '/api/v1/tenants/login/',
        '/api/v1/billing/webhook/',
        '/admin/',
        '/api/v1/superadmin/',
    ]

    def _authenticate_jwt(self, token):
        """Try to decode as JWT and return tenant if valid."""
        from tenant_manager.serializers import decode_jwt
        from tenant_manager.models import Tenant
        payload = decode_jwt(token)
        if payload and 'tenant_id' in payload:
            try:
                tenant = Tenant.objects.get(id=payload['tenant_id'], is_active=True)
                return tenant, None
            except Tenant.DoesNotExist:
                return None, 'Tenant account not found'
        return None, None  # Not a JWT, try API key next

    def _authenticate_api_key(self, raw_key):
        """Validate API key and return tenant if valid."""
        key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
        from tenant_manager.models import ApiKey
        try:
            api_key = ApiKey.objects.select_related('tenant').get(
                key_hash=key_hash, is_active=True
            )
        except ApiKey.DoesNotExist:
            return None, None, 'Invalid API key'
        if not api_key.tenant.is_active:
            return None, None, 'Tenant account is deactivated'
        # Update last_used_at asynchronously
        from tenant_manager.tasks import update_api_key_last_used
        update_api_key_last_used.delay(str(api_key.id))
        return api_key.tenant, api_key, None

    def process_request(self, request):
        # Allow CORS preflight through without auth
        if request.method == 'OPTIONS':
            return None
        # Skip auth for exempt paths
        path = request.path.rstrip('/')
        if any(path == p.rstrip('/') or path.startswith(p) for p in self.EXEMPT_PATHS):
            return None
        if request.path.startswith('/static/') or request.path.startswith('/admin/') or request.path == '/favicon.ico':
            return None

        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return JsonResponse({'error': 'Missing or invalid Authorization header'}, status=401)

        raw_token = auth_header[7:]

        # 1) Try JWT first (dashboard login)
        tenant, error = self._authenticate_jwt(raw_token)
        if tenant:
            request.tenant = tenant
            request.jwt_payload = {
                'tenant_id': str(tenant.id),
                'role': getattr(tenant, 'role', 'tenant'),
            }
            return None
        if error:
            return JsonResponse({'error': error}, status=401)

        # 2) Fall back to API key (programmatic / widget access)
        tenant, api_key, error = self._authenticate_api_key(raw_token)
        if tenant:
            request.tenant = tenant
            request.api_key = api_key
            request.jwt_payload = {
                'tenant_id': str(tenant.id),
                'role': getattr(tenant, 'role', 'tenant'),
            }
            return None
        if error:
            return JsonResponse({'error': error}, status=401)

        return JsonResponse({'error': 'Invalid or expired token'}, status=401)


class RateLimitMiddleware(MiddlewareMixin):
    """Per-tenant sliding window rate limiter using Redis."""

    RATE_LIMITS = {
        'free': 20,
        'starter': 60,
        'pro': 200,
        'enterprise': None,  # unlimited
    }

    def process_request(self, request):
        tenant = getattr(request, 'tenant', None)
        if not tenant:
            return None

        limit = self.RATE_LIMITS.get(tenant.plan, 20)  # Default to free tier (20 req/min)
        if limit is None:
            return None  # Enterprise = unlimited

        minute_bucket = int(time.time() // 60)
        key = f"ratelimit:{tenant.id}:{minute_bucket}"

        try:
            from django.core.cache import cache
            current = cache.get(key, 0)
            if current >= limit:
                return JsonResponse(
                    {'error': 'Rate limit exceeded', 'retry_after': 60},
                    status=429,
                    headers={'Retry-After': '60'},
                )
            cache.set(key, current + 1, timeout=120)
        except Exception:
            pass  # If Redis is down, allow the request through

        return None


class CorsOriginMiddleware(MiddlewareMixin):
    """Validates per-tenant CORS origins."""

    EXEMPT_PATHS = ['/health/', '/api/v1/tenants/register/']

    def process_request(self, request):
        if request.method == 'OPTIONS':
            return None
        if any(request.path.startswith(p) for p in self.EXEMPT_PATHS):
            return None

        tenant = getattr(request, 'tenant', None)
        if not tenant:
            return None

        origin = request.headers.get('Origin')
        if not origin:
            return None

        # Check tenant-level allowed_origins
        allowed_origins = [
            o.strip() for o in tenant.allowed_origins.split('\n') if o.strip()
        ]
        if allowed_origins and origin not in allowed_origins:
            return JsonResponse({'error': 'Origin not allowed'}, status=403)

        # Also check API key-level overrides
        api_key = getattr(request, 'api_key', None)
        if api_key and api_key.allowed_origins:
            key_origins = [
                o.strip() for o in api_key.allowed_origins.split('\n') if o.strip()
            ]
            if key_origins and origin not in key_origins:
                return JsonResponse(
                    {'error': 'Origin not allowed for this API key'}, status=403
                )

        return None


class QuotaMiddleware(MiddlewareMixin):
    """Checks monthly message quota before forwarding to upstream."""

    EXEMPT_PATHS = [
        '/health/',
        '/api/v1/tenants/',
        '/api/v1/billing/',
        '/admin/',
    ]

    def process_request(self, request):
        if request.method != 'POST':
            return None
        if any(request.path.startswith(p) for p in self.EXEMPT_PATHS):
            return None
        if not request.path.startswith('/api/v1/chat/'):
            return None

        tenant = getattr(request, 'tenant', None)
        if not tenant:
            return None

        from analytics.models import UsageSummary
        from django.utils import timezone
        now = timezone.now()
        summary, _ = UsageSummary.objects.get_or_create(
            tenant=tenant,
            year=now.year,
            month=now.month,
            defaults={'total_messages': 0, 'total_tokens': 0, 'total_cost_usd': 0},
        )

        if summary.total_messages >= tenant.monthly_message_quota:
            return JsonResponse({
                'error': 'quota_exceeded',
                'limit': tenant.monthly_message_quota,
                'used': summary.total_messages,
            }, status=402)

        return None
