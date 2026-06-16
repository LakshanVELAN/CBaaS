from celery import shared_task


@shared_task
def log_message_async(tenant_id, session_id, role, current_route,
                      prompt_tokens, completion_tokens, total_tokens,
                      cost_usd, upstream_latency_ms, success, error_code):
    """Log a chat message asynchronously."""
    from .models import MessageLog
    from tenant_manager.models import Tenant
    try:
        tenant = Tenant.objects.get(id=tenant_id)
        MessageLog.objects.create(
            tenant=tenant,
            session_id=session_id,
            role=role,
            current_route=current_route,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=total_tokens,
            cost_usd=cost_usd,
            upstream_latency_ms=upstream_latency_ms,
            success=success,
            error_code=error_code,
        )
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Failed to log message: {e}")


@shared_task
def increment_usage(tenant_id, tokens, cost):
    """Increment monthly usage summary for a tenant."""
    from .models import UsageSummary
    from tenant_manager.models import Tenant
    from django.utils import timezone
    try:
        tenant = Tenant.objects.get(id=tenant_id)
        now = timezone.now()
        summary, _ = UsageSummary.objects.get_or_create(
            tenant=tenant,
            year=now.year,
            month=now.month,
            defaults={'total_messages': 0, 'total_tokens': 0, 'total_cost_usd': 0},
        )
        summary.total_messages += 1
        summary.total_tokens += tokens
        summary.total_cost_usd = float(summary.total_cost_usd) + cost
        summary.save()
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Failed to increment usage: {e}")
