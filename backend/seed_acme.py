import json
import uuid
import django
import os

# Setup django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from tenant_manager.models import Tenant
from chat_proxy.models import KnowledgeBaseEntry, RouteEntry, RoleConfig

tenant_id = uuid.UUID('f0d8dcbb-cbd1-416b-b7ac-15a7ee05ee9f')
try:
    tenant = Tenant.objects.get(id=tenant_id)
except Tenant.DoesNotExist:
    tenant = Tenant.objects.create(
        id=tenant_id,
        name='ansha_tech',
        plan='pro',
        monthly_message_quota=25000,
        allowed_origins='*'
    )

# Clear existing entries for this tenant to avoid duplicates
KnowledgeBaseEntry.objects.filter(tenant=tenant).delete()
RouteEntry.objects.filter(tenant=tenant).delete()
RoleConfig.objects.filter(tenant=tenant).delete()

# Define Acme Academy roles
roles = {
    'student': {
        'label': 'Organization Student',
        'description': 'Student user with read-only access to course catalogs, assignments, grading transcripts, and parent notifications.',
        'pages': {
            '/grades': {
                'title': 'Grades & Transcripts Viewer',
                'description': 'View final marks, correction worksheets, and print formal GPA transcripts.',
                'visible_content': [
                    'Advanced Graph Database Systems (Spring 2026, 95%, A+)',
                    'Large Language Models in Production (Spring 2026, 92%, A)',
                    'Welcome to your student academic dashboard. Here you can view your official transcripts, subject-specific corrected worksheets, and calculate overall GPA grades.'
                ],
                'clickable_actions': []
            }
        }
    },
    'admin': {
        'label': 'Organization Admin',
        'description': 'Institution administrator with full access to student rosters, class scheduling, LMS settings, and subscription configurations.',
        'pages': {
            '/admin/roster': {
                'title': 'Student Roster Management',
                'description': 'Add, suspend, or invite students to the school/college organization.',
                'visible_content': [
                    'Institution control center. Administrators can add new student enrolments, schedule daily timetable grids, configure academic rosters, and audit user permissions.',
                    'Perform administrator operations below. Any action taken here is logged in the system audit registry.',
                    'Invite Student Button'
                ],
                'clickable_actions': [
                    {'label': 'Invite Student Button', 'action': 'Triggers email invitation flow to add a student to the roster.'}
                ]
            }
        }
    },
    'personal': {
        'label': 'Personal User',
        'description': 'Logged-in personal workspace user with access to personal AI support tools, profile settings, and credit balance lookup.',
        'pages': {
            '/profile': {
                'title': 'Personal Profile Settings',
                'description': 'Manage avatar pictures, email preferences, and view active token credits.',
                'visible_content': [
                    'Your personal user workspace details. Update your contact configurations, profile pictures, email notification settings, and query your token balances.',
                    'Contact Email: student@acmeuni.edu',
                    'Remaining Credits: 4,250 Tokens'
                ],
                'clickable_actions': []
            }
        }
    }
}

for role_name, rdata in roles.items():
    # 1. Create RoleConfig
    RoleConfig.objects.create(
        tenant=tenant,
        name=role_name,
        display_name=rdata['label'],
        description=rdata['description'],
        is_active=True
    )
    print(f"Created Role: {role_name}")

    # 2. Add Routes & KnowledgeBaseEntries
    for path, pdata in rdata['pages'].items():
        title = pdata['title']
        desc = pdata['description']
        visible_content = pdata['visible_content']
        clickable_actions = pdata['clickable_actions']

        # Create route entry
        RouteEntry.objects.create(
            tenant=tenant,
            path=path,
            name=title,
            description=desc,
            allowed_roles=[role_name],
            is_active=True,
            sort_order=0
        )
        print(f"Created Route: {path}")

        # Create KnowledgeBaseEntry
        page_summary = {
            'page_title': title,
            'route': path,
            'role': role_name,
            'description': desc,
            'visible_content': visible_content,
            'clickable_actions': clickable_actions
        }
        
        KnowledgeBaseEntry.objects.create(
            tenant=tenant,
            url=f"widget://{path}",
            title=title,
            content=json.dumps(page_summary, indent=2),
            extracted_links=[{'url': path, 'title': title}],
            is_active=True
        )
        print(f"Created KB Entry for: {title}")

print("Seeding completed successfully!")
