"""
Management command to create/update a superadmin user.

Usage:
    python manage.py seed_superadmin --email admin@example.com --password securepass123
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User


class Command(BaseCommand):
    help = 'Create or update a superadmin (staff) user for the SaaS admin dashboard.'

    def add_arguments(self, parser):
        parser.add_argument('--email', required=True, help='Email address for the superadmin')
        parser.add_argument('--password', required=True, help='Password for the superadmin')
        parser.add_argument('--name', default='', help='Full name (optional)')

    def handle(self, *args, **options):
        email = options['email']
        password = options['password']
        name = options['name']

        user, created = User.objects.get_or_create(
            username=email,
            email=email,
            defaults={'is_staff': True, 'is_superuser': True},
        )

        if not created:
            user.is_staff = True
            user.is_superuser = True

        if name:
            parts = name.split(' ', 1)
            user.first_name = parts[0]
            if len(parts) > 1:
                user.last_name = parts[1]

        user.set_password(password)
        user.save()

        action = 'Created' if created else 'Updated'
        self.stdout.write(self.style.SUCCESS(
            f'{action} superadmin: {email}'
        ))
