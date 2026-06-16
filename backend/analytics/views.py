import logging
from datetime import datetime, timedelta
from collections import OrderedDict

from django.db import models
from django.db.models import Sum, Count, Q
from django.utils import timezone
from rest_framework.decorators import api_view
from rest_framework.response import Response

logger = logging.getLogger(__name__)


@api_view(['GET'])
def overview(request):
    """
    Get aggregated usage overview for the current tenant.

    Returns total stats plus current month breakdown vs quota.
    Query params:
    - start_date: ISO date string (optional, defaults to 30 days ago)
    - end_date: ISO date string (optional, defaults to now)
    """
    from .models import MessageLog, UsageSummary
    from tenant_manager.models import Tenant

    tenant = request.tenant

    now = timezone.now()
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')

    def _parse_date(date_str, default):
        if not date_str:
            return default
        try:
            dt = datetime.fromisoformat(date_str)
            return timezone.make_aware(dt) if timezone.is_naive(dt) else dt
        except (ValueError, TypeError):
            return default

    start_date = _parse_date(start_date, now - timedelta(days=30))
    end_date = _parse_date(end_date, now)

    # Stats within date range
    range_stats = MessageLog.objects.filter(
        tenant=tenant,
        created_at__gte=start_date,
        created_at__lte=end_date,
    ).aggregate(
        total_messages=Count('id'),
        total_tokens=Sum('total_tokens'),
        total_cost=Sum('cost_usd'),
        successful=Count('id', filter=Q(success=True)),
        failed=Count('id', filter=Q(success=False)),
    )

    # Current month usage
    current_month = UsageSummary.objects.filter(
        tenant=tenant,
        year=now.year,
        month=now.month,
    ).first()

    # Total lifetime stats
    lifetime = MessageLog.objects.filter(tenant=tenant).aggregate(
        total_messages=Count('id'),
        total_tokens=Sum('total_tokens'),
    )

    return Response({
        'date_range': {
            'start': start_date.isoformat(),
            'end': end_date.isoformat(),
        },
        'range': {
            'total_messages': range_stats.get('total_messages') or 0,
            'total_tokens': range_stats.get('total_tokens') or 0,
            'total_cost_usd': float(range_stats.get('total_cost') or 0),
            'successful': range_stats.get('successful') or 0,
            'failed': range_stats.get('failed') or 0,
        },
        'current_month': {
            'total_messages': current_month.total_messages if current_month else 0,
            'total_tokens': current_month.total_tokens if current_month else 0,
            'total_cost_usd': float(current_month.total_cost_usd) if current_month else 0,
            'quota': tenant.monthly_message_quota,
            'percent_used': (
                round((current_month.total_messages / tenant.monthly_message_quota) * 100, 1)
                if current_month and tenant.monthly_message_quota > 0
                else 0
            ),
        },
        'lifetime': {
            'total_messages': lifetime.get('total_messages') or 0,
            'total_tokens': lifetime.get('total_tokens') or 0,
        },
    })


@api_view(['GET'])
def daily_usage(request):
    """
    Get daily message counts for the date range.

    Query params:
    - days: number of days to look back (default 30, max 365)
    """
    tenant = request.tenant
    from .models import MessageLog
    days = int(request.GET.get('days', 30))
    days = min(max(days, 1), 365)

    now = timezone.now()
    start_date = now - timedelta(days=days - 1)

    # Query messages grouped by date
    logs = (
        MessageLog.objects
        .filter(tenant=tenant, created_at__gte=start_date)
        .extra(  # noqa: use extra for date truncation
            select={'date': "DATE(created_at)"},
        )
        .values('date')
        .annotate(
            messages=Count('id'),
            tokens=Sum('total_tokens'),
            cost=Sum('cost_usd'),
        )
        .order_by('date')
    )

    # Build a complete date range filling in zeros for days with no data
    date_map = OrderedDict()
    for i in range(days):
        day = (start_date + timedelta(days=i)).date()
        date_map[day.isoformat()] = {
            'date': day.isoformat(),
            'messages': 0,
            'tokens': 0,
            'cost': 0,
        }

    for entry in logs:
        day_str = str(entry['date'])
        if day_str in date_map:
            date_map[day_str] = {
                'date': day_str,
                'messages': entry.get('messages') or 0,
                'tokens': entry.get('tokens') or 0,
                'cost': float(entry.get('cost') or 0),
            }

    return Response({
        'days': days,
        'start_date': start_date.date().isoformat(),
        'end_date': now.date().isoformat(),
        'data': list(date_map.values()),
    })


@api_view(['GET'])
def usage_summary(request):
    """Get monthly usage summary for the tenant."""
    from .models import UsageSummary
    tenant = request.tenant
    summaries = UsageSummary.objects.filter(tenant=tenant).values(
        'year', 'month', 'total_messages', 'total_tokens', 'total_cost_usd'
    ).order_by('-year', '-month')[:12]
    return Response(list(summaries))


@api_view(['GET'])
def message_logs(request):
    """Get paginated message logs for the tenant."""
    from .models import MessageLog
    tenant = request.tenant
    page = int(request.GET.get('page', 1))
    page_size = 50
    start = (page - 1) * page_size
    end = start + page_size

    logs = MessageLog.objects.filter(tenant=tenant).values(
        'id', 'session_id', 'role', 'total_tokens', 'cost_usd',
        'success', 'error_code', 'created_at'
    ).order_by('-created_at')[start:end]

    total = MessageLog.objects.filter(tenant=tenant).count()

    return Response({
        'results': list(logs),
        'total': total,
        'page': page,
        'page_size': page_size,
    })


@api_view(['GET'])
def cost_breakdown(request):
    """Get cost breakdown by period."""
    from .models import UsageSummary
    from django.db.models import Sum as ModelSum
    tenant = request.tenant
    period = request.GET.get('period', 'monthly')

    if period == 'monthly':
        data = UsageSummary.objects.filter(tenant=tenant).values(
            'year', 'month'
        ).annotate(
            total_messages=ModelSum('total_messages'),
            total_tokens=ModelSum('total_tokens'),
            total_cost=ModelSum('total_cost_usd'),
        ).order_by('-year', '-month')[:24]

    return Response(list(data))



