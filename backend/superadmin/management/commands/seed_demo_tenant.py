"""
Management command to create a demo tenant linked to the superadmin user.
This ensures the login flow works (login requires a Tenant linked to the User).

Usage:
    python manage.py seed_demo_tenant --email admin@example.com --password securepass123
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User


class Command(BaseCommand):
    help = 'Create or update a demo tenant linked to a user for the SaaS dashboard.'

    def add_arguments(self, parser):
        parser.add_argument('--email', required=True, help='Email of the user to link the tenant to')
        parser.add_argument('--password', required=True, help='Password for the user')
        parser.add_argument('--name', default='Demo Organization', help='Tenant/organization name')
        parser.add_argument('--plan', default='pro', help='Plan: free, starter, pro, enterprise')

    def handle(self, *args, **options):
        from tenant_manager.models import Tenant
        from tenant_manager.models import ApiKey

        email = options['email']
        password = options['password']
        name = options['name']
        plan = options['plan']

        # Find or create the user
        user, _ = User.objects.get_or_create(
            username=email,
            email=email,
            defaults={'is_staff': True, 'is_superuser': True},
        )
        user.set_password(password)
        user.save()

        # Check if user already has a tenant
        existing_tenant = Tenant.objects.filter(user=user).first()
        if existing_tenant:
            self.stdout.write(self.style.SUCCESS(
                f'User {email} already has tenant: {existing_tenant.name} ({existing_tenant.id})'
            ))
            return

        # Create tenant linked to the user
        tenant = Tenant.objects.create(
            user=user,
            name=name,
            plan=plan,
            monthly_message_quota=25000,
            allowed_origins='*',
            is_active=True,
        )

        # Create a default API key for the tenant
        raw_key, key_hash, prefix = ApiKey.generate_key(str(tenant.id))
        ApiKey.objects.create(
            tenant=tenant,
            key_hash=key_hash,
            prefix=prefix,
            name='Default API Key',
            is_active=True,
        )

        self.stdout.write(self.style.SUCCESS(
            f'Created demo tenant: {name} ({tenant.id}) linked to {email}'
        ))
        self.stdout.write(self.style.WARNING(
            f'API Key (save this): {raw_key}'
        ))
