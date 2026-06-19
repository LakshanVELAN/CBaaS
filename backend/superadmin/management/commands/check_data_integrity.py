"""
Management command to verify database data integrity on startup.

Checks that critical records exist and warns if the database appears
to be empty or was swapped (e.g. if DATABASE_URL changed between deploys).

Usage:
    python manage.py check_data_integrity
    python manage.py check_data_integrity --strict  # exit with error if checks fail

Exit codes:
    0 - All checks passed
    1 - Some checks failed (only in strict mode)
"""
from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth.models import User
from tenant_manager.models import Tenant


class Command(BaseCommand):
    help = 'Verify database has expected data (prevents deploying against a blank/ swapped DB).'

    def add_arguments(self, parser):
        parser.add_argument(
            '--strict',
            action='store_true',
            help='Exit with error code if any integrity check fails',
        )

    def handle(self, *args, **options):
        strict = options.get('strict', False)
        errors = []

        self.stdout.write(self.style.NOTICE('🔍 Running database integrity checks...'))

        # --- Check 1: Superadmin exists ---
        superadmin_count = User.objects.filter(is_superuser=True).count()
        if superadmin_count == 0:
            msg = 'No superadmin user found — database may be empty or pointing to a different instance'
            errors.append(msg)
            self.stdout.write(self.style.WARNING(f'  ✗ {msg}'))
        else:
            self.stdout.write(self.style.SUCCESS(
                f'  ✓ Superadmin users: {superadmin_count}'
            ))

        # --- Check 2: At least one tenant exists ---
        tenant_count = Tenant.objects.count()
        if tenant_count == 0:
            msg = 'No tenants found — database may be empty'
            errors.append(msg)
            self.stdout.write(self.style.WARNING(f'  ✗ {msg}'))
        else:
            # Show first few tenant names for confirmation
            sample_tenants = list(Tenant.objects.values_list('name', flat=True)[:5])
            self.stdout.write(self.style.SUCCESS(
                f'  ✓ Tenants: {tenant_count} (e.g. {", ".join(sample_tenants)})'
            ))

        # --- Check 3: Non-zero migrations applied (schema exists) ---
        from django.db.migrations.recorder import MigrationRecorder
        applied = MigrationRecorder.Migration.objects.filter(applied__isnull=False).count()
        if applied == 0:
            msg = 'No migrations applied — database schema may be missing'
            errors.append(msg)
            self.stdout.write(self.style.WARNING(f'  ✗ {msg}'))
        else:
            self.stdout.write(self.style.SUCCESS(
                f'  ✓ Applied migrations: {applied}'
            ))

        # --- Summary ---
        if errors:
            self.stdout.write(self.style.WARNING(
                '\n⚠️  Database integrity issues found:'
            ))
            for err in errors:
                self.stdout.write(self.style.WARNING(f'   • {err}'))
            self.stdout.write(self.style.WARNING(
                '\n💡 Possible causes:'
            ))
            self.stdout.write(self.style.WARNING(
                '   • DATABASE_URL was changed to a different database instance'
            ))
            self.stdout.write(self.style.WARNING(
                '   • Database was manually reset or data was purged'
            ))
            self.stdout.write(self.style.WARNING(
                '   • First deployment against a fresh database (expected)'
            ))

            if strict:
                raise CommandError(
                    'Database integrity check FAILED in strict mode. '
                    'Verify DATABASE_URL is correct and data has not been lost.'
                )
        else:
            self.stdout.write(self.style.SUCCESS('\n✅ All integrity checks passed — database has expected data.'))
