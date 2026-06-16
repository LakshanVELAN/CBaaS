import uuid
from django.db import models


class MessageLog(models.Model):
    """Individual chat message log for analytics and billing."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(
        'tenant_manager.Tenant',
        on_delete=models.CASCADE,
        related_name='message_logs',
    )
    session_id = models.CharField(max_length=100, db_index=True)
    role = models.CharField(max_length=100, default='guest')
    current_route = models.CharField(max_length=500, blank=True, default='')
    prompt_tokens = models.IntegerField(default=0)
    completion_tokens = models.IntegerField(default=0)
    total_tokens = models.IntegerField(default=0)
    cost_usd = models.DecimalField(max_digits=12, decimal_places=8, default=0)
    upstream_latency_ms = models.IntegerField(default=0)
    success = models.BooleanField(default=True)
    error_code = models.CharField(max_length=50, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'message_log'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['tenant', 'created_at']),
        ]

    def __str__(self):
        return f"Msg {self.session_id[:8]}... ({self.tenant.name})"


class UsageSummary(models.Model):
    """Monthly usage summary per tenant for quota enforcement."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(
        'tenant_manager.Tenant',
        on_delete=models.CASCADE,
        related_name='usage_summaries',
    )
    year = models.IntegerField()
    month = models.IntegerField()
    total_messages = models.IntegerField(default=0)
    total_tokens = models.BigIntegerField(default=0)
    total_cost_usd = models.DecimalField(max_digits=12, decimal_places=8, default=0)

    class Meta:
        db_table = 'usage_summary'
        unique_together = ['tenant', 'year', 'month']

    def __str__(self):
        return f"{self.tenant.name} - {self.year}/{self.month:02d}"
