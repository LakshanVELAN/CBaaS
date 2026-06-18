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
    from tenant_manager.models import Tenant
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

    return Response({
        'total_tenants': total_tenants,
        'active_tenants': active_tenants,
        'suspended_tenants': total_tenants - active_tenants,
        'plan_breakdown': plan_breakdown,
        'recent_tenants_30d': recent_tenants,
        'total_messages': total_messages,
        'total_tokens': agg['total_tokens'] or 0,
        'total_cost': float(agg['total_cost'] or 0),
    })


@api_view(['GET'])
@superadmin_required
def tenant_list(request):
    """List all tenants for superadmin management."""
    from tenant_manager.models import Tenant
    from analytics.models import MessageLog

    tenants = []
    for t in Tenant.objects.all().order_by('-created_at'):
        msg_count = MessageLog.objects.filter(tenant=t).count()
        tenants.append({
            'id': str(t.id),
            'name': t.name,
            'plan': t.plan,
            'is_active': t.is_active,
            'total_messages': msg_count,
            'created_at': t.created_at.isoformat(),
        })

    return Response(tenants)


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
