import uuid
from django.db import models


class RouteEntry(models.Model):
    """Stores a client's website route with role access and description for the chatbot."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(
        'tenant_manager.Tenant',
        on_delete=models.CASCADE,
        related_name='route_entries',
    )
    path = models.CharField(
        max_length=500,
        help_text='Route path, e.g. /about, /dashboard/students',
    )
    name = models.CharField(
        max_length=200,
        help_text='Human-readable name, e.g. About Us',
    )
    description = models.TextField(
        blank=True,
        default='',
        help_text='What this page does, for chatbot context',
    )
    allowed_roles = models.JSONField(
        default=list,
        blank=True,
        help_text='List of role names allowed to access this route, e.g. ["admin", "student"]',
    )
    is_active = models.BooleanField(default=True)
    sort_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.path})"

    class Meta:
        db_table = 'route_entry'
        ordering = ['sort_order', 'path']


class RoleConfig(models.Model):
    """Stores a client-defined role with its description for the chatbot."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(
        'tenant_manager.Tenant',
        on_delete=models.CASCADE,
        related_name='role_configs',
    )
    name = models.CharField(
        max_length=100,
        help_text='Role identifier, e.g. admin, student, trainer',
    )
    display_name = models.CharField(
        max_length=200,
        help_text='Human-readable role name, e.g. Organization Admin',
    )
    description = models.TextField(
        blank=True,
        default='',
        help_text='Description of what this role can do, for chatbot context',
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.display_name} ({self.name})"

    class Meta:
        db_table = 'role_config'
        ordering = ['name']
        unique_together = ['tenant', 'name']


class Neo4jConfig(models.Model):
    """Stores per-tenant Neo4j connection configuration.
    Users can provide their own Neo4j instance connection details
    instead of relying on the global platform-level Neo4j.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.OneToOneField(
        'tenant_manager.Tenant',
        on_delete=models.CASCADE,
        related_name='neo4j_config',
    )
    uri = models.CharField(max_length=500, blank=True, default='')
    username = models.CharField(max_length=200, blank=True, default='neo4j')
    password = models.CharField(max_length=500, blank=True, default='')
    is_connected = models.BooleanField(default=False)
    last_tested_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Neo4j config for {self.tenant.name}: {self.uri or 'not set'}"

    class Meta:
        db_table = 'neo4j_config'


class KnowledgeBaseEntry(models.Model):
    """Stores scraped page content that the chatbot uses as context for navigation."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(
        'tenant_manager.Tenant',
        on_delete=models.CASCADE,
        related_name='knowledge_base_entries',
    )
    url = models.URLField(max_length=500)
    title = models.CharField(max_length=500)
    content = models.TextField()
    extracted_links = models.JSONField(
        default=list,
        blank=True,
        help_text='List of {"url": str, "title": str} extracted from the page for navigation',
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.tenant.name})"

    class Meta:
        db_table = 'knowledge_base_entry'
        ordering = ['-created_at']
