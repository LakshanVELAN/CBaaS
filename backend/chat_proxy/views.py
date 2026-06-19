import logging
import json
import concurrent.futures
from urllib.parse import urlparse

from django.utils import timezone

from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .gemini import chat_completion, build_system_prompt, train_page_content, extract_route_from_response
from .models import KnowledgeBaseEntry, RouteEntry, RoleConfig, Neo4jConfig
from .neo4j_utils import (
    get_tenant_driver,
    get_tenant_custom_driver,
    upload_knowledge_to_graph,
    get_role_context_from_neo4j,
    get_graph_stats,
    ensure_tenant_database,
    has_custom_driver,
)

logger = logging.getLogger(__name__)


@api_view(['POST'])
def chat_message(request):
    """
    Handle chat messages using Gemini AI with role-based context,
    workspace (DOM-scanned) knowledge, site knowledge, and navigation support.

    Accepts:
    - message, session_id, current_route, history, role (standard)
    - workspace_context: dict with DOM-scanned page data (headings, buttons, sections, etc.)
    - site_knowledge: list of route dicts accessible to the current user's role
    """
    tenant = request.tenant

    message = request.data.get('message', '')
    session_id = request.data.get('session_id', '')
    current_route = request.data.get('current_route', '')
    history = request.data.get('history', [])
    role = request.data.get('role', 'guest')

    # Optional fields from widget DOM scanner and route registry
    workspace_context = request.data.get('workspace_context', None)
    site_knowledge = request.data.get('site_knowledge', None)

    if not message or not session_id:
        return Response(
            {'error': 'message and session_id are required'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Sanitize inputs
    message = message.replace('\x00', '')[:4000]
    history = history[-20:]

    # Query Neo4j for role context if configured
    # Wrapped in a short timeout to avoid blocking chat requests
    neo4j_context = ''
    try:
        neo4j_driver = get_tenant_driver(tenant)
        if neo4j_driver:
            # When using a custom (per-tenant) Neo4j, don't filter by tenant_id
            use_tenant_filter = not has_custom_driver(tenant)
            with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
                future = executor.submit(
                    lambda: get_role_context_from_neo4j(
                        neo4j_driver, tenant, role,
                        ensure_tenant_database(tenant),
                        use_tenant_filter=use_tenant_filter,
                    )
                )
                neo4j_context = future.result(timeout=5)  # 5s max for Neo4j query
    except concurrent.futures.TimeoutError:
        logger.warning("Neo4j query timed out (5s), skipping graph context")
        neo4j_context = ''
    except Exception as e:
        logger.warning(f"Neo4j query failed for role {role}: {e}")
        neo4j_context = ''

    # Fetch knowledge base entries with URLs and titles for navigation
    # When Neo4j context is available, skip KnowledgeBase content in prompt
    # (Neo4j is the authoritative source — KB entries are only a fallback)
    kb_objects = KnowledgeBaseEntry.objects.filter(
        tenant=tenant, is_active=True
    ).values('title', 'content', 'url')[:50]
    kb_entries = list(kb_objects)

    # If Neo4j has context, don't include scraped KB content in the prompt
    kb_entries_for_prompt = [] if neo4j_context else kb_entries

    # Fetch route registry entries — filter to only include routes
    # accessible by the current role (or routes with no role restriction)
    route_objects = RouteEntry.objects.filter(
        tenant=tenant, is_active=True
    ).values('path', 'name', 'description', 'allowed_roles')[:100]
    route_entries = [
        r for r in route_objects
        if not r.get('allowed_roles') or role in r.get('allowed_roles', [])
    ]

    # Fetch role configs — only include the current user's role so the bot
    # doesn't reveal info about other roles the user shouldn't know about
    role_objects = RoleConfig.objects.filter(
        tenant=tenant, is_active=True, name=role
    ).values('name', 'display_name', 'description')[:20]
    role_entries = list(role_objects)

    # Build dynamic system prompt with all context
    system_prompt = build_system_prompt(
        tenant,
        knowledge_base_entries=kb_entries_for_prompt,
        role_entries=role_entries,
        route_entries=route_entries,
        workspace_context=workspace_context,
        site_knowledge=site_knowledge,
        neo4j_context=neo4j_context,
    )

    try:
        result = chat_completion(
            message=message,
            history=history,
            system_prompt=system_prompt,
        )

        response_text = result.get('message', '')

        # Parse navigation suggestions from the response
        raw_navigations = result.get('navigations', [])

        # Also extract backticked routes from the response
        route_from_text, route_name_from_text = extract_route_from_response(response_text)
        if route_from_text:
            raw_navigations.append({'url': route_from_text, 'title': route_name_from_text})

        # Deduplicate and clean navigations
        # AI-generated navigation suggestions are passed through unless
        # they have empty/invalid URLs. No need to cross-reference against
        # KB/route registry — the LLM gets route context and generates
        # reasonable suggestions.
        seen_urls = set()
        valid_navigations = []
        for nav in raw_navigations:
            nav_url = nav.get('url', '').strip()
            nav_title = nav.get('title', '').strip()
            if not nav_url or nav_url in ('/', '#', '') or not nav_title:
                continue
            if nav_url not in seen_urls:
                seen_urls.add(nav_url)
                valid_navigations.append({'url': nav_url, 'title': nav_title})
        navigations = valid_navigations

        # Pick the best navigation (first one) for the route field
        # Never fallback to current_route — that creates dead "Open Page" pills
        best_nav = navigations[0] if navigations else None

        # Log message asynchronously
        token_usage = result.get('token_usage', {})
        from analytics.tasks import log_message_async
        log_message_async.delay(
            tenant_id=str(tenant.id),
            session_id=session_id,
            role=role,
            current_route=current_route,
            prompt_tokens=token_usage.get('prompt_tokens', 0),
            completion_tokens=token_usage.get('completion_tokens', 0),
            total_tokens=token_usage.get('total_tokens', 0),
            cost_usd=float(token_usage.get('cost', 0)),
            upstream_latency_ms=0,
            success=True,
            error_code=None,
        )

        # Increment usage
        from analytics.tasks import increment_usage
        increment_usage.delay(
            tenant_id=str(tenant.id),
            tokens=token_usage.get('total_tokens', 0),
            cost=float(token_usage.get('cost', 0)),
        )

        return Response({
            'message': response_text,
            'route': best_nav['url'] if best_nav else None,
            'route_name': best_nav['title'] if best_nav else None,
            'navigations': navigations,
            'session_id': session_id,
            'token_usage': token_usage,
        })

    except Exception as e:
        logger.error(f"Gemini chat error: {e}", exc_info=True)
        return Response(
            {'error': 'chat_error', 'detail': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(['POST'])
def train_page(request):
    """Scrape a web page and store its content + extracted links in the knowledge base."""
    tenant = request.tenant

    url = request.data.get('url', '')
    if not url:
        return Response(
            {'error': 'url is required'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        result = train_page_content(url)
    except ValueError as e:
        return Response(
            {'error': 'scrape_failed', 'detail': str(e)},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Store in knowledge base with extracted links
    entry, created = KnowledgeBaseEntry.objects.update_or_create(
        tenant=tenant,
        url=url,
        defaults={
            'title': result['title'],
            'content': result['content'],
            'extracted_links': result.get('links', []),
            'is_active': True,
        },
    )

    return Response({
        'id': str(entry.id),
        'url': entry.url,
        'title': entry.title,
        'content_length': len(entry.content),
        'links_count': len(entry.extracted_links),
        'created': created,
        'message': 'Page trained successfully' if created else 'Page updated successfully',
    })


@api_view(['GET'])
def knowledge_base_list(request):
    """List all knowledge base entries for the tenant."""
    tenant = request.tenant
    entries = KnowledgeBaseEntry.objects.filter(tenant=tenant).values(
        'id', 'url', 'title', 'is_active', 'created_at', 'updated_at',
        'extracted_links',
    )
    return Response(list(entries))


@api_view(['DELETE'])
def knowledge_base_delete(request, entry_id):
    """Delete a knowledge base entry."""
    tenant = request.tenant
    try:
        entry = KnowledgeBaseEntry.objects.get(id=entry_id, tenant=tenant)
        entry.delete()
        return Response({'message': 'Entry deleted'})
    except KnowledgeBaseEntry.DoesNotExist:
        return Response(
            {'error': 'not_found'},
            status=status.HTTP_404_NOT_FOUND,
        )


@api_view(['POST'])
def upload_knowledge_json(request):
    """
    Upload structured knowledge JSON seed data to the Neo4j graph.
    Accepts the knowledge_data format expected by upload_knowledge_to_graph().
    """
    tenant = request.tenant

    knowledge_data = request.data.get('knowledge_data', {}) or request.data.get('data', {})
    if not knowledge_data:
        return Response(
            {'error': 'knowledge_data is required'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Normalize roles: support both array format and object/dict format
    roles_raw = knowledge_data.get('roles', [])
    if isinstance(roles_raw, dict):
        # Convert object format {role_id: {label, ...}} to array [{name: role_id, ...}]
        normalized_roles = []
        for role_id, role_data in roles_raw.items():
            normalized_roles.append({
                'name': role_id,
                'display_name': role_data.get('label', role_id),
                'description': role_data.get('_comment', role_data.get('description', '')),
                'pages': [],
                'menu_items': [],
            })
            # Convert pages from object format {/path: {title, ...}} to array [{path: /path, ...}]
            pages_raw = role_data.get('pages', {})
            if isinstance(pages_raw, dict):
                for page_path, page_data in pages_raw.items():
                    normalized_roles[-1]['pages'].append({
                        'path': page_path,
                        'title': page_data.get('title', ''),
                        'description': page_data.get('description', ''),
                        'visible_content': '\n'.join(page_data.get('visible_content', [])),
                        'actions': [{
                            'id': f"action_{role_id}_{action.get('label', '').lower().replace(' ', '_')}",
                            'label': action.get('label', ''),
                            'action_description': action.get('action', action.get('navigates_to', '')),
                            'navigates_to': action.get('navigates_to', ''),
                        } for action in page_data.get('clickable_actions', [])],
                        'linked_pages': [action.get('navigates_to', '') for action in page_data.get('clickable_actions', []) if action.get('navigates_to')],
                    })
            # Convert sidebar menu_items
            sidebar = role_data.get('sidebar', {})
            menu_items_raw = sidebar.get('menu_items', []) if isinstance(sidebar, dict) else []
            normalized_roles[-1]['menu_items'] = [{
                'label': item.get('label', ''),
                'icon': item.get('icon', ''),
                'path': item.get('route', ''),
            } for item in menu_items_raw]
        knowledge_data['roles'] = normalized_roles

    # Validate structure has at least one of roles or pages
    roles = knowledge_data.get('roles', [])
    pages = knowledge_data.get('pages', [])
    if not roles and not pages:
        return Response(
            {'error': 'knowledge_data must contain at least one role or page'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    neo4j_driver = get_tenant_driver(tenant)
    if not neo4j_driver:
        return Response(
            {'error': 'Neo4j is not configured'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    db_name = ensure_tenant_database(tenant)

    try:
        stats = upload_knowledge_to_graph(neo4j_driver, tenant, knowledge_data, db_name)
        return Response({
            'message': 'Knowledge graph updated successfully',
            'stats': stats,
        })
    except Exception as e:
        logger.error(f"Failed to upload knowledge to graph: {e}", exc_info=True)
        return Response(
            {'error': 'upload_failed', 'detail': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(['GET', 'PUT'])
def neo4j_config_view(request):
    """Get or update per-tenant Neo4j connection configuration."""
    tenant = request.tenant

    if request.method == 'GET':
        try:
            config = Neo4jConfig.objects.get(tenant=tenant)
            return Response({
                'uri': config.uri,
                'username': config.username,
                'password': config.password,
                'is_connected': config.is_connected,
                'last_tested_at': config.last_tested_at.isoformat() if config.last_tested_at else None,
            })
        except Neo4jConfig.DoesNotExist:
            return Response({
                'uri': '',
                'username': 'neo4j',
                'password': '',
                'is_connected': False,
                'last_tested_at': None,
            })

    # PUT - save/update config
    uri = request.data.get('uri', '').strip()
    username = request.data.get('username', 'neo4j').strip()
    password = request.data.get('password', '').strip()

    config, _ = Neo4jConfig.objects.update_or_create(
        tenant=tenant,
        defaults={'uri': uri, 'username': username, 'password': password},
    )

    return Response({
        'message': 'Neo4j configuration saved',
        'uri': config.uri,
        'username': config.username,
        'is_connected': config.is_connected,
    })


@api_view(['POST'])
def neo4j_test_connection(request):
    """Test the Neo4j connection with the provided or saved credentials."""
    tenant = request.tenant

    uri = request.data.get('uri', '').strip()
    username = request.data.get('username', 'neo4j').strip()
    password = request.data.get('password', '').strip()

    if not uri:
        # Try saved config
        try:
            config = Neo4jConfig.objects.get(tenant=tenant)
            uri = config.uri
            username = config.username
            password = config.password
        except Neo4jConfig.DoesNotExist:
            return Response(
                {'error': 'No Neo4j URI provided and no saved configuration found'},
                status=status.HTTP_400_BAD_REQUEST,
            )

    if not uri:
        return Response(
            {'error': 'Neo4j URI is required'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        from neo4j import GraphDatabase
        driver = GraphDatabase.driver(
            uri,
            auth=(username, password),
            connection_timeout=10.0,
        )
        with driver.session() as session:
            result = session.run("RETURN 1 AS test").single()
            connected = result and result["test"] == 1
        driver.close()

        # Update saved config status
        Neo4jConfig.objects.update_or_create(
            tenant=tenant,
            defaults={
                'uri': uri,
                'username': username,
                'password': password,
                'is_connected': connected,
                'last_tested_at': timezone.now(),
            },
        )

        if connected:
            return Response({
                'message': 'Connection successful! Neo4j is reachable.',
                'connected': True,
            })
        else:
            return Response({
                'error': 'Connection failed: unexpected response from server',
                'connected': False,
            }, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        error_msg = str(e)
        if 'authentication' in error_msg.lower():
            error_msg = 'Authentication failed. Check your username and password.'
        elif 'connection refused' in error_msg.lower() or 'timed out' in error_msg.lower():
            error_msg = 'Cannot connect to Neo4j. Check that the URI is correct and the server is running.'
        elif 'resolving' in error_msg.lower():
            error_msg = 'Could not resolve the Neo4j hostname. Check the URI.'

        Neo4jConfig.objects.update_or_create(
            tenant=tenant,
            defaults={'is_connected': False, 'last_tested_at': timezone.now()},
        )

        return Response(
            {'error': error_msg, 'connected': False},
            status=status.HTTP_400_BAD_REQUEST,
        )


@api_view(['GET'])
def extraction_guide(request):
    """
    Return a knowledge extraction guide with sample prompts and instructions
    that users can use to extract knowledge from their front-end.
    """
    guide = {
        'title': 'Knowledge Extraction Guide',
        'overview': (
            'This guide helps you extract structured knowledge from your '
            'front-end application and upload it to the Neo4j knowledge graph. '
            'The chatbot uses this graph to understand your app\'s navigation, '
            'roles, pages, and actions.'
        ),
        'methods': [
            {
                'method': '1. Upload JSON Knowledge File',
                'description': (
                    'Export your front-end UI structure as a JSON file and '
                    'upload it directly. This works well for static sites, '
                    'design system documentation, or when you want full control '
                    'over the knowledge graph structure.'
                ),
                'steps': [
                    'Create a JSON file following the structure below',
                    'Upload it using the file upload section on this page',
                    'The system will validate and import the data into Neo4j',
                ],
            },
            {
                'method': '2. Manual Page Training',
                'description': (
                    'Enter a URL in the "Train a Page" section above and '
                    'the system will scrape the page content, extract links, '
                    'and store it in the knowledge base for chat context. '
                    'Works best for documentation and content pages.'
                ),
                'steps': [
                    'Paste the full URL of the page you want to train',
                    'Click "Train Page" to scrape and store the content',
                    'Repeat for all pages you want the chatbot to know about',
                ],
            },
        ],
        'json_structure': {
            'description': 'Expected JSON structure for comprehensive knowledge extraction:',
            'schema': {
                '_meta': {
                    'app': '<app name>',
                    'extracted_from': '<repo name>',
                    'extraction_date': '<today>',
                    'total_roles': '<number>',
                },
                'organization_types': {
                    'example': 'Document organization-specific terminology differences',
                },
                'shared_features': {
                    'example': 'Features available across all roles (chatbot, notifications, OAuth, etc.)',
                },
                'roles': {
                    '<role_id>': {
                        '_comment': 'Description of this role',
                        'label': 'Human-readable role name',
                        'detection': 'JS condition that activates this role',
                        'home_redirect': 'Route after login',
                        'sidebar': {
                            'type': 'main / organization / etc.',
                            'menu_items': [
                                {'label': '...', 'route': '...', 'icon': '...', 'description': '...'},
                            ],
                            'bottom_section': {'profile': '...', 'logout': '...'},
                        },
                        'accessible_routes': ['/route/path', '...'],
                        'pages': {
                            '/route/path': {
                                'title': 'Page heading',
                                'description': 'What this page is for',
                                'visible_content': ['Section text', 'Card labels', 'Table columns', 'Stats'],
                                'clickable_actions': [
                                    {'label': 'Button text', 'navigates_to': '/target-route'},
                                    {'label': 'Toggle', 'action': 'Description of behavior'},
                                ],
                            },
                        },
                    },
                },
                'navigation_flows': {
                    'login_redirects': {'role': '/dashboard', '...': '...'},
                    'module_switches': ['Flow description 1', 'Flow description 2'],
                },
            },
        },
        'extraction_prompt': (
            'You are a frontend source code analyst. I am giving you a React frontend repository '
            '(as a zip file or file tree). Your job is to extract a complete, structured knowledge '
            'base JSON from the source code — role by role — so it can be used as a chatbot\'s '
            'system prompt or loaded into a RAG vector store.\n\n'
            'Follow these exact extraction rules:\n\n'
            '### EXTRACTION RULES\n\n'
            '**1. Roles**\n'
            '- Read App.jsx (or App.tsx) to find all routes and ProtectedRoute / role-guard logic.\n'
            '- Read all Sidebar components (MainSidebar, OrganizationSidebar, etc.) to find role-based menu rendering.\n'
            '- Read authService.js/jsx to find role detection logic.\n'
            '- For each distinct role found, create a separate entry.\n\n'
            '**2. Per Role, extract:**\n'
            '- `label` — human-readable role name\n'
            '- `detection` — the exact JS condition that activates this role\n'
            '- `home_redirect` — the route the user lands on after login\n'
            '- `sidebar` — every menu item with label, route, icon, description\n'
            '- `accessible_routes` — array of all route paths this role can visit\n'
            '- `pages` — for every route, extract title, description, visible_content (array of strings), '
            'and clickable_actions (array of objects with label and navigates_to or action)\n\n'
            '**3. Also extract:**\n'
            '- `shared_features` — features available across all roles\n'
            '- `navigation_flows` — login redirects per role, module-switching flows\n'
            '- `organization_types` — if the app supports multiple org types, document terminology differences\n\n'
            '**4. Output format rules:**\n'
            '- Output a single valid JSON file only. No markdown, no explanation outside the JSON.\n'
            '- Use `_comment` keys to annotate complex sections.\n'
            '- Every role must be a key under `\"roles\": {}` (object, not array).\n'
            '- Every page must have `visible_content` (array of strings) and `clickable_actions` (array of objects).\n'
            '- Clickable actions that navigate must have a `navigates_to` field.\n'
            '- Clickable actions that trigger behavior must have an `action` field.\n'
            '- Use the exact route paths from the source code.\n\n'
            '**5. Do not guess or hallucinate.**\n'
            '- Only document what you can verify exists in the source code.\n'
            '- If a page\'s full content is not visible, note it as '
            '`\"description\": \"Full content not extracted — component not available\"`.\n\n'
            '### OUTPUT STRUCTURE\n\n'
            '```json\n'
            '{\n'
            '  \"_meta\": { \"app\": \"<app name>\", \"extracted_from\": \"<repo name>\", \"extraction_date\": \"<today>\", \"total_roles\": <number> },\n'
            '  \"organization_types\": { ... },\n'
            '  \"shared_features\": { ... },\n'
            '  \"roles\": {\n'
            '    \"<role_id>\": {\n'
            '      \"_comment\": \"...\",\n'
            '      \"label\": \"...\",\n'
            '      \"detection\": \"...\",\n'
            '      \"home_redirect\": \"...\",\n'
            '      \"sidebar\": { \"type\": \"...\", \"menu_items\": [...] },\n'
            '      \"accessible_routes\": [\"...\"],\n'
            '      \"pages\": {\n'
            '        \"/route/path\": {\n'
            '          \"title\": \"...\",\n'
            '          \"description\": \"...\",\n'
            '          \"visible_content\": [\"...\"],\n'
            '          \"clickable_actions\": [\n'
            '            { \"label\": \"...\", \"navigates_to\": \"...\" },\n'
            '            { \"label\": \"...\", \"action\": \"...\" }\n'
            '          ]\n'
            '        }\n'
            '      }\n'
            '    }\n'
            '  },\n'
            '  \"navigation_flows\": { \"login_redirects\": { ... }, \"module_switches\": [...] }\n'
            '}\n'
            '```\n\n'
            'Now extract the knowledge base from the repository I am providing.'
        ),
    }
    return Response(guide)


@api_view(['GET'])
def graph_stats(request):
    """Get Neo4j graph statistics for the tenant."""
    tenant = request.tenant

    neo4j_driver = get_tenant_driver(tenant)
    if not neo4j_driver:
        return Response({
            'roles': 0, 'pages': 0, 'actions': 0,
            'menu_items': 0, 'relationships': 0,
            'message': 'Neo4j not configured',
        })

    db_name = ensure_tenant_database(tenant)

    # When the tenant is using their own custom Neo4j instance, don't filter by
    # tenant_id — the entire database belongs to them, so count ALL nodes.
    use_tenant_filter = not has_custom_driver(tenant)

    try:
        stats = get_graph_stats(neo4j_driver, tenant, db_name, use_tenant_filter=use_tenant_filter)
        return Response(stats)
    except Exception as e:
        logger.error(f"Failed to get graph stats: {e}", exc_info=True)
        return Response({
            'roles': 0, 'pages': 0, 'actions': 0,
            'menu_items': 0, 'relationships': 0,
            'error': str(e),
        })


@api_view(['GET', 'POST'])
def route_registry_list(request):
    """List or create route registry entries."""
    tenant = request.tenant

    if request.method == 'GET':
        routes = RouteEntry.objects.filter(tenant=tenant, is_active=True).values(
            'id', 'path', 'name', 'description', 'allowed_roles', 'sort_order', 'is_active',
            'created_at', 'updated_at',
        )
        return Response(list(routes))

    # POST - create a new route entry
    path = request.data.get('path', '')
    name = request.data.get('name', '')
    description = request.data.get('description', '')
    allowed_roles = request.data.get('allowed_roles', [])

    if not path or not name:
        return Response(
            {'error': 'path and name are required'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    entry = RouteEntry.objects.create(
        tenant=tenant,
        path=path,
        name=name,
        description=description,
        allowed_roles=allowed_roles,
    )

    return Response({
        'id': str(entry.id),
        'path': entry.path,
        'name': entry.name,
        'description': entry.description,
        'allowed_roles': entry.allowed_roles,
        'message': 'Route created successfully',
    }, status=status.HTTP_201_CREATED)


@api_view(['PATCH', 'DELETE'])
def route_registry_detail(request, entry_id):
    """Update or delete a route registry entry."""
    tenant = request.tenant

    try:
        entry = RouteEntry.objects.get(id=entry_id, tenant=tenant)
    except RouteEntry.DoesNotExist:
        return Response(
            {'error': 'not_found'},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == 'DELETE':
        entry.is_active = False
        entry.save(update_fields=['is_active'])
        return Response({'message': 'Route deactivated'})

    # PATCH - update fields
    if 'path' in request.data:
        entry.path = request.data['path']
    if 'name' in request.data:
        entry.name = request.data['name']
    if 'description' in request.data:
        entry.description = request.data['description']
    if 'allowed_roles' in request.data:
        entry.allowed_roles = request.data['allowed_roles']
    if 'sort_order' in request.data:
        entry.sort_order = request.data['sort_order']
    if 'is_active' in request.data:
        entry.is_active = request.data['is_active']
    entry.save()

    return Response({
        'id': str(entry.id),
        'path': entry.path,
        'name': entry.name,
        'description': entry.description,
        'allowed_roles': entry.allowed_roles,
        'sort_order': entry.sort_order,
        'is_active': entry.is_active,
        'message': 'Route updated successfully',
    })


@api_view(['GET', 'POST'])
def role_config_list(request):
    """List or create role configurations."""
    tenant = request.tenant

    if request.method == 'GET':
        roles = RoleConfig.objects.filter(tenant=tenant, is_active=True).values(
            'id', 'name', 'display_name', 'description', 'is_active',
            'created_at', 'updated_at',
        )
        return Response(list(roles))

    # POST - create a new role
    name = request.data.get('name', '')
    display_name = request.data.get('display_name', name)
    description = request.data.get('description', '')

    if not name:
        return Response(
            {'error': 'name is required'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    entry, created = RoleConfig.objects.get_or_create(
        tenant=tenant,
        name=name,
        defaults={
            'display_name': display_name,
            'description': description,
        },
    )

    if not created:
        return Response(
            {'error': 'role_already_exists', 'detail': f'Role "{name}" already exists'},
            status=status.HTTP_409_CONFLICT,
        )

    return Response({
        'id': str(entry.id),
        'name': entry.name,
        'display_name': entry.display_name,
        'description': entry.description,
        'message': 'Role created successfully',
    }, status=status.HTTP_201_CREATED)


@api_view(['PATCH', 'DELETE'])
def role_config_detail(request, entry_id):
    """Update or delete a role configuration."""
    tenant = request.tenant

    try:
        entry = RoleConfig.objects.get(id=entry_id, tenant=tenant)
    except RoleConfig.DoesNotExist:
        return Response(
            {'error': 'not_found'},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == 'DELETE':
        entry.is_active = False
        entry.save(update_fields=['is_active'])
        return Response({'message': 'Role deactivated'})

    # PATCH - update fields
    if 'display_name' in request.data:
        entry.display_name = request.data['display_name']
    if 'description' in request.data:
        entry.description = request.data['description']
    if 'is_active' in request.data:
        entry.is_active = request.data['is_active']
    entry.save()

    return Response({
        'id': str(entry.id),
        'name': entry.name,
        'display_name': entry.display_name,
        'description': entry.description,
        'is_active': entry.is_active,
        'message': 'Role updated successfully',
    })
