import uuid
import hashlib
import secrets
from django.db import models
from django.contrib.auth.models import User


class Tenant(models.Model):
    """Multi-tenant organization that owns a chatbot instance."""
    PLAN_CHOICES = [
        ('free', 'Free'),
        ('starter', 'Starter'),
        ('pro', 'Pro'),
        ('enterprise', 'Enterprise'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name='tenant', null=True
    )
    name = models.CharField(max_length=200, help_text='Organization/tenant name')
    plan = models.CharField(max_length=20, choices=PLAN_CHOICES, default='free')
    monthly_message_quota = models.IntegerField(
        default=500,
        help_text='Maximum messages allowed per month'
    )
    allowed_origins = models.TextField(
        blank=True, default='',
        help_text='Newline-separated list of allowed CORS origins'
    )
    custom_system_prompt_override = models.TextField(
        blank=True, default='',
        help_text='Optional custom system prompt for the AI'
    )
    neo4j_uri = models.CharField(max_length=500, blank=True, default='')
    neo4j_user = models.CharField(max_length=100, blank=True, default='')
    neo4j_password = models.CharField(max_length=200, blank=True, default='')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tenant'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.get_plan_display()})"

    def save(self, *args, **kwargs):
        # Set quota based on plan if not explicitly set
        if not self.monthly_message_quota or self.monthly_message_quota == 500:
            quota_map = {
                'free': 500,
                'starter': 5000,
                'pro': 25000,
                'enterprise': 1000000,
            }
            self.monthly_message_quota = quota_map.get(self.plan, 500)
        super().save(*args, **kwargs)


class ApiKey(models.Model):
    """API key for programmatic access to the chatbot widget API."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name='api_keys',
    )
    key_hash = models.CharField(
        max_length=64,
        unique=True,
        db_index=True,
        help_text='SHA-256 hash of the raw API key'
    )
    prefix = models.CharField(
        max_length=20,
        help_text='Display prefix like dlk_8408_'
    )
    name = models.CharField(
        max_length=100,
        help_text='Human-readable name for this key'
    )
    is_active = models.BooleanField(default=True)
    allowed_origins = models.TextField(
        blank=True, default='',
        help_text='Newline-separated CORS origins override for this key'
    )
    last_used_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'api_key'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.prefix}*** ({self.tenant.name})"

    @staticmethod
    def generate_key(tenant_id: str) -> tuple:
        """
        Generate a new API key.
        Returns: (raw_key, key_hash, prefix)
        """
        raw_key = f"dlk_{tenant_id[:4]}_{secrets.token_hex(24)}"
        key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
        prefix = raw_key[:13]  # e.g., "dlk_8408_3cf8"
        return raw_key, key_hash, prefix
