from celery import shared_task
from django.utils import timezone


@shared_task
def update_api_key_last_used(api_key_id: str):
    """Update the last_used_at timestamp for an API key asynchronously."""
    from .models import ApiKey
    try:
        ApiKey.objects.filter(id=api_key_id).update(last_used_at=timezone.now())
    except Exception:
        pass  # Best-effort logging
