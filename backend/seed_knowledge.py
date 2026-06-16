import json
import uuid
import django
import os
import sys

# Setup django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from tenant_manager.models import Tenant
from chat_proxy.models import KnowledgeBaseEntry, RouteEntry, RoleConfig

tenant_id = uuid.UUID('576c6fca-cbd1-416b-b7ac-15a7ee05ee9f')
try:
    tenant = Tenant.objects.get(id=tenant_id)
except Tenant.DoesNotExist:
    print("Tenant DigiLearn Premium does not exist. Run setup first.")
    sys.exit(1)

# Clear existing entries for this tenant to avoid duplicates
KnowledgeBaseEntry.objects.filter(tenant=tenant).delete()
RouteEntry.objects.filter(tenant=tenant).delete()
RoleConfig.objects.filter(tenant=tenant).delete()

json_path = r'c:\Users\laksh\Downloads\digilearn_knowledge_base_v2.json'
with open(json_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

roles_data = data.get('roles', {})

# Resolve pages for all roles first
resolved_pages = {}

# Pass 1: populate roles that have dict pages directly
for role_name, rdata in roles_data.items():
    pages = rdata.get('pages')
    if isinstance(pages, dict):
        resolved_pages[role_name] = dict(pages)

# Pass 2: resolve inherited pages
for role_name, rdata in roles_data.items():
    pages = rdata.get('pages')
    
    if role_name == 'organization_admin_school':
        # Inherits from organization_admin_college + terminology changes + school_specific_pages
        base_pages = resolved_pages.get('organization_admin_college', {})
        copied = {}
        for path, pdata in base_pages.items():
            title = pdata.get('title', '').replace('Trainer', 'Faculty').replace('Course', 'Class')
            desc = pdata.get('description', '').replace('Trainer', 'Faculty').replace('Course', 'Class')
            copied[path] = {
                'title': title,
                'description': desc,
                'visible_content': [x.replace('Trainer', 'Faculty').replace('Course', 'Class') for x in pdata.get('visible_content', [])],
                'clickable_actions': pdata.get('clickable_actions', [])
            }
        # Merge school specific pages
        school_pages = rdata.get('school_specific_pages', {})
        copied.update(school_pages)
        resolved_pages[role_name] = copied
        
    elif isinstance(pages, str) or pages is None:
        if pages and 'Same as organization_admin_college' in pages:
            resolved_pages[role_name] = dict(resolved_pages.get('organization_admin_college', {}))
        elif pages and 'Same pages as organization_student_college' in pages:
            copied = dict(resolved_pages.get('organization_student_college', {}))
            if '/organization/course-catalog' in copied:
                del copied['/organization/course-catalog']
            resolved_pages[role_name] = copied
        else:
            # Fallback - copy admin college pages if empty or unhandled
            resolved_pages[role_name] = dict(resolved_pages.get('organization_admin_college', {}))

# Seed database
for role_name, rdata in roles_data.items():
    # 1. Create RoleConfig
    role_config = RoleConfig.objects.create(
        tenant=tenant,
        name=role_name,
        display_name=rdata.get('label', role_name),
        description=rdata.get('_comment', '') or rdata.get('description', ''),
        is_active=True
    )
    print(f"Created RoleConfig: {role_name}")

    # 2. Add Routes & KnowledgeBaseEntries
    pages = resolved_pages.get(role_name, {})
    
    for path, pdata in pages.items():
        title = pdata.get('title', path)
        desc = pdata.get('description', '')
        visible_content = pdata.get('visible_content', [])
        clickable_actions = pdata.get('clickable_actions', [])
        
        # Build route entry if it doesn't exist
        route_entry, created = RouteEntry.objects.get_or_create(
            tenant=tenant,
            path=path,
            defaults={
                'name': title,
                'description': desc or f"View {title} page",
                'allowed_roles': [role_name],
                'is_active': True,
                'sort_order': 0
            }
        )
        if not created:
            if role_name not in route_entry.allowed_roles:
                route_entry.allowed_roles.append(role_name)
                route_entry.save()
                
        # Build KnowledgeBaseEntry content
        page_summary = {
            'page_title': title,
            'route': path,
            'role': role_name,
            'description': desc,
            'visible_content': visible_content,
            'clickable_actions': clickable_actions
        }
        
        kb_entry = KnowledgeBaseEntry.objects.create(
            tenant=tenant,
            url=f"widget://{path}",
            title=title,
            content=json.dumps(page_summary, indent=2),
            extracted_links=[{'url': path, 'title': title}],
            is_active=True
        )

print("Database seeding completed successfully!")
