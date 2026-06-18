import json
from functools import wraps
from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.db.models import Sum, Count


def superadmin_required(view_func):
    """Decorator that validates a superadmin JWT token from the Authorization header."""
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if not auth_header.startswith('Bearer '):
            return Response({'error': 'Authentication required.'}, status=401)

        token_str = auth_header.split(' ', 1)[1]
        from rest_framework_simplejwt.tokens import AccessToken
        try:
            access = AccessToken(token_str)
            payload = access.payload
        except Exception:
            return Response({'error': 'Invalid or expired token.'}, status=401)

        if not payload.get('is_superadmin'):
            return Response({'error': 'Superadmin access required.'}, status=403)

        try:
            request.superadmin = User.objects.get(id=payload['user_id'])
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=401)

        return view_func(request, *args, **kwargs)
    return wrapper


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """Authenticate a superadmin (staff user) and return JWT tokens."""
    email = request.data.get('email', '')
    password = request.data.get('password', '')

    if not email or not password:
        return Response({'error': 'Email and password are required.'}, status=400)

    user = authenticate(username=email, password=password)
    if not user:
        return Response({'error': 'Invalid email or password.'}, status=401)

    if not user.is_staff:
        return Response({'error': 'Superadmin access required.'}, status=403)

    refresh = RefreshToken()
    refresh['user_id'] = user.id
    refresh['email'] = user.email
    refresh['is_superadmin'] = True

    return Response({
        'user': {
            'id': user.id,
            'email': user.email,
            'name': user.get_full_name() or user.email.split('@')[0],
        },
        'tokens': {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        },
    })


@api_view(['GET'])
@superadmin_required
def platform_stats(request):
    """Get overall platform statistics for superadmin."""
    from tenant_manager.models import Tenant, ApiKey
    from analytics.models import MessageLog

    # ── Tenant stats ──
    total_tenants = Tenant.objects.count()
    active_tenants = Tenant.objects.filter(is_active=True).count()
    plan_breakdown = dict(
        Tenant.objects.values('plan')
        .annotate(count=Count('id'))
        .values_list('plan', 'count')
    )

    # ── Message stats ──
    total_messages = MessageLog.objects.count()
    agg = MessageLog.objects.aggregate(
        total_tokens=Sum('total_tokens'),
        total_cost=Sum('cost_usd'),
    )

    # ── Recent registrations (last 30 days) ──
    from django.utils import timezone
    from datetime import timedelta
    thirty_days_ago = timezone.now() - timedelta(days=30)
    recent_tenants = Tenant.objects.filter(created_at__gte=thirty_days_ago).count()

    # ── Top tenants by message count (for dashboard list) ──
    top_tenants_data = (
        MessageLog.objects
        .values('tenant_id')
        .annotate(total=Count('id'))
        .order_by('-total')[:10]
    )
    top_tenant_ids = [t['tenant_id'] for t in top_tenants_data]
    top_tenants = Tenant.objects.filter(id__in=top_tenant_ids)
    top_tenants_map = {str(t.id): t for t in top_tenants}

    top_tenants_list = []
    for t in top_tenants_data:
        tenant = top_tenants_map.get(str(t['tenant_id']))
        if tenant:
            top_tenants_list.append({
                'id': str(tenant.id),
                'name': tenant.name,
                'email': tenant.user.email if tenant.user else '',
                'plan': tenant.plan,
                'total_messages': t['total'],
                'is_active': tenant.is_active,
            })

    # ── Recent tenants (newest first) ──
    recent_tenants_list = []
    for t in Tenant.objects.all().order_by('-created_at')[:10]:
        recent_tenants_list.append({
            'id': str(t.id),
            'name': t.name,
            'email': t.user.email if t.user else '',
            'plan': t.plan,
            'is_active': t.is_active,
            'created_at': t.created_at.isoformat(),
        })

    # ── Total API keys across platform ──
    total_api_keys = ApiKey.objects.count()

    return Response({
        'total_tenants': total_tenants,
        'active_tenants': active_tenants,
        'suspended_tenants': total_tenants - active_tenants,
        'plan_breakdown': plan_breakdown,
        'recent_tenants_30d': recent_tenants,
        'total_messages': total_messages,
        'total_tokens': agg['total_tokens'] or 0,
        'total_cost': float(agg['total_cost'] or 0),
        'total_api_keys': total_api_keys,
        'top_tenants': top_tenants_list,
        'recent_tenants': recent_tenants_list,
    })


@api_view(['GET'])
@superadmin_required
def tenant_list(request):
    """List all tenants for superadmin management."""
    from tenant_manager.models import Tenant, ApiKey
    from analytics.models import MessageLog, UsageSummary
    from django.utils import timezone

    now = timezone.now()

    tenants = []
    for t in Tenant.objects.all().order_by('-created_at'):
        msg_count = MessageLog.objects.filter(tenant=t).count()

        # Current month usage
        current_summary = UsageSummary.objects.filter(
            tenant=t, year=now.year, month=now.month
        ).first()
        current_month_usage = current_summary.total_messages if current_summary else 0

        # Last active date
        last_log = MessageLog.objects.filter(tenant=t).order_by('-created_at').first()
        last_active = last_log.created_at.isoformat() if last_log else None

        # API key count
        api_key_count = ApiKey.objects.filter(tenant=t).count()

        quotas = {'free': 500, 'starter': 5000, 'pro': 25000, 'enterprise': 1000000}
        monthly_quota = quotas.get(t.plan, 500)

        tenants.append({
            'id': str(t.id),
            'name': t.name,
            'email': t.user.email if t.user else '',
            'plan': t.plan,
            'monthly_quota': monthly_quota,
            'current_month_usage': current_month_usage,
            'usage_percent': round((current_month_usage / monthly_quota * 100), 1) if monthly_quota else 0,
            'is_active': t.is_active,
            'total_messages': msg_count,
            'api_key_count': api_key_count,
            'last_active': last_active,
            'created_at': t.created_at.isoformat(),
        })

    return Response(tenants)


@api_view(['GET'])
@superadmin_required
def tenant_detail(request, tenant_id):
    """Get detailed info and usage for a specific tenant."""
    from tenant_manager.models import Tenant, ApiKey
    from analytics.models import MessageLog, UsageSummary
    from django.utils import timezone
    from datetime import timedelta

    try:
        tenant = Tenant.objects.get(id=tenant_id)
    except Tenant.DoesNotExist:
        return Response({'error': 'Tenant not found.'}, status=404)

    now = timezone.now()

    # ── Lifetime stats ──
    total_messages = MessageLog.objects.filter(tenant=tenant).count()
    agg = MessageLog.objects.filter(tenant=tenant).aggregate(
        total_tokens=Sum('total_tokens'),
        total_cost=Sum('cost_usd'),
    )

    # ── Current month usage ──
    current_summary = UsageSummary.objects.filter(
        tenant=tenant, year=now.year, month=now.month
    ).first()
    current_month_usage = current_summary.total_messages if current_summary else 0
    current_month_tokens = current_summary.total_tokens if current_summary else 0

    quotas = {'free': 500, 'starter': 5000, 'pro': 25000, 'enterprise': 1000000}
    monthly_quota = quotas.get(tenant.plan, 500)

    # ── Last 7 days daily usage ──
    from django.db.models.functions import TruncDate
    seven_days_ago = now - timedelta(days=7)
    daily_logs = (
        MessageLog.objects
        .filter(tenant=tenant, created_at__gte=seven_days_ago)
        .annotate(date=TruncDate('created_at'))
        .values('date')
        .annotate(
            messages=Count('id'),
            tokens=Sum('total_tokens'),
            cost=Sum('cost_usd'),
        )
        .order_by('date')
    )

    daily_usage = []
    for d in daily_logs:
        daily_usage.append({
            'date': str(d['date']),
            'messages': d['messages'],
            'tokens': d['tokens'] or 0,
            'cost': float(d['cost'] or 0),
        })

    # ── API Keys ──
    api_keys = []
    for ak in ApiKey.objects.filter(tenant=tenant):
        api_keys.append({
            'id': str(ak.id),
            'prefix': ak.prefix,
            'name': ak.name,
            'is_active': ak.is_active,
            'last_used_at': ak.last_used_at.isoformat() if ak.last_used_at else None,
            'created_at': ak.created_at.isoformat(),
        })

    # ── Last active ──
    last_log = MessageLog.objects.filter(tenant=tenant).order_by('-created_at').first()

    # ── Monthly usage history ──
    monthly_history = UsageSummary.objects.filter(tenant=tenant).order_by('-year', '-month')[:12]
    monthly_usage = []
    for m in monthly_history:
        monthly_usage.append({
            'year': m.year,
            'month': m.month,
            'total_messages': m.total_messages,
            'total_tokens': m.total_tokens,
            'total_cost_usd': float(m.total_cost_usd),
        })

    return Response({
        'id': str(tenant.id),
        'name': tenant.name,
        'email': tenant.user.email if tenant.user else '',
        'plan': tenant.plan,
        'monthly_quota': monthly_quota,
        'current_month_usage': current_month_usage,
        'current_month_tokens': current_month_tokens,
        'usage_percent': round((current_month_usage / monthly_quota * 100), 1) if monthly_quota else 0,
        'is_active': tenant.is_active,
        'total_messages': total_messages,
        'total_tokens': agg['total_tokens'] or 0,
        'total_cost': float(agg['total_cost'] or 0),
        'last_active': last_log.created_at.isoformat() if last_log else None,
        'created_at': tenant.created_at.isoformat(),
        'api_keys': api_keys,
        'daily_usage': daily_usage,
        'monthly_usage': monthly_usage,
    })


@api_view(['PATCH'])
@superadmin_required
def tenant_toggle(request, tenant_id):
    """Activate or deactivate a tenant."""
    from tenant_manager.models import Tenant
    try:
        tenant = Tenant.objects.get(id=tenant_id)
        tenant.is_active = request.data.get('is_active', not tenant.is_active)
        tenant.save()
        return Response({
            'message': f"Tenant {'activated' if tenant.is_active else 'deactivated'}.",
            'is_active': tenant.is_active,
        })
    except Tenant.DoesNotExist:
        return Response({'error': 'Tenant not found.'}, status=404)
