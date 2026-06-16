from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import Count, Sum


@api_view(['GET'])
def platform_stats(request):
    """Get overall platform statistics for superadmin."""
    from tenant_manager.models import Tenant
    from analytics.models import MessageLog, UsageSummary

    total_tenants = Tenant.objects.count()
    active_tenants = Tenant.objects.filter(is_active=True).count()

    total_messages = MessageLog.objects.count()
    total_logs = MessageLog.objects.aggregate(
        total_tokens=Sum('total_tokens'),
        total_cost=Sum('cost_usd'),
    )

    return Response({
        'total_tenants': total_tenants,
        'active_tenants': active_tenants,
        'total_messages': total_messages,
        'total_tokens': total_logs['total_tokens'] or 0,
        'total_cost': float(total_logs['total_cost'] or 0),
    })


@api_view(['GET'])
def tenant_list(request):
    """List all tenants for superadmin management."""
    from tenant_manager.models import Tenant
    tenants = Tenant.objects.all().values(
        'id', 'name', 'plan', 'is_active', 'created_at'
    ).order_by('-created_at')
    return Response(list(tenants))


@api_view(['PATCH'])
def tenant_toggle(request, tenant_id):
    """Activate or deactivate a tenant."""
    from tenant_manager.models import Tenant
    try:
        tenant = Tenant.objects.get(id=tenant_id)
        tenant.is_active = request.data.get('is_active', not tenant.is_active)
        tenant.save()
        return Response({'message': f"Tenant {'activated' if tenant.is_active else 'deactivated'}."})
    except Tenant.DoesNotExist:
        return Response({'error': 'Tenant not found.'}, status=404)
