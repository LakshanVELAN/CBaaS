"""
Neo4j graph database utilities for the ChatBot SaaS platform.
Uses a single global Neo4j connection (from .env) and creates per-tenant
databases automatically. Each tenant's knowledge graph is isolated in
its own Neo4j database.
"""
import os
import time
import logging

from django.conf import settings

# Lazy import: neo4j driver uses async internals that can hang during
# import in forked gunicorn workers. Import on first use instead.
_GraphDatabase = None


def _get_graph_db():
    global _GraphDatabase
    if _GraphDatabase is None:
        from neo4j import GraphDatabase as _GDB
        _GraphDatabase = _GDB
    return _GraphDatabase

logger = logging.getLogger(__name__)

# Global driver singleton (uses .env connection)
_driver = None
_driver_failed = False  # Prevent repeated connection attempts after failure
_driver_failed_at: float = 0  # Timestamp of last failure for cooldown reset


def get_global_driver():
    """
    Get or create the global Neo4j driver from .env settings.
    This single connection manages all per-tenant databases.

    Uses short timeouts and caches failures to avoid blocking chat requests.
    """
    global _driver, _driver_failed, _driver_failed_at

    # Don't retry if we already failed (cooldown: 5 minutes, then retry)
    if _driver_failed:
        if time.time() - _driver_failed_at < 300:  # 5-minute cooldown
            return None
        # Cooldown expired — allow retry
        _driver_failed = False

    uri = getattr(settings, 'NEO4J_URI', '') or os.environ.get('NEO4J_URI', '')
    user = getattr(settings, 'NEO4J_USER', '') or os.environ.get('NEO4J_USER', 'neo4j')
    password = getattr(settings, 'NEO4J_PASSWORD', '') or os.environ.get('NEO4J_PASSWORD', '')

    if not uri:
        return None

    if _driver is not None:
        return _driver

    try:
        GraphDatabase = _get_graph_db()
        _driver = GraphDatabase.driver(
            uri,
            auth=(user, password),
            max_connection_lifetime=300.0,
            connection_timeout=5.0,  # 5s connection timeout
            max_connection_pool_size=50,
        )
        # Lightweight test query with short timeout
        with _driver.session() as session:
            session.run("RETURN 1").consume()
        logger.info("Global Neo4j driver connected successfully")
        return _driver
    except Exception as e:
        logger.warning(f"Failed to connect to Neo4j (will not retry for 5 minutes): {e}")
        _driver = None
        _driver_failed = True
        _driver_failed_at = time.time()
        return None


_custom_drivers: dict = {}  # {tenant_id: driver}


def get_tenant_driver(tenant):
    """
    Get the driver for a tenant. First checks for a per-tenant custom Neo4j
    connection (from Neo4jConfig), then falls back to the global platform-level Neo4j.
    Per-tenant data isolation is handled via database names or label prefixes.
    """
    # Try per-tenant custom Neo4j first
    custom = get_tenant_custom_driver(tenant)
    if custom:
        return custom
    # Fall back to global
    return get_global_driver()


def get_tenant_custom_driver(tenant):
    """
    Get a per-tenant Neo4j driver from the tenant's saved Neo4jConfig.
    Creates a new driver if one doesn't exist or if the connection parameters changed.
    """
    global _custom_drivers

    try:
        from .models import Neo4jConfig
        config = Neo4jConfig.objects.get(tenant=tenant)
    except Exception:
        return None

    if not config.uri:
        return None

    tenant_id = str(tenant.id)

    # Check if we have an existing cached driver
    existing = _custom_drivers.get(tenant_id)
    if existing and existing.get('uri') == config.uri:
        # Return the cached driver
        return existing.get('driver')

    # Close old driver if exists
    if existing and existing.get('driver'):
        try:
            existing['driver'].close()
        except Exception:
            pass

    try:
        GraphDatabase = _get_graph_db()
        driver = GraphDatabase.driver(
            config.uri,
            auth=(config.username, config.password),
            max_connection_lifetime=300.0,
            connection_timeout=10.0,
            max_connection_pool_size=10,
        )
        _custom_drivers[tenant_id] = {'uri': config.uri, 'driver': driver}
        return driver
    except Exception as e:
        logger.warning(f"Failed to create custom Neo4j driver for tenant {tenant.name}: {e}")
        return None


def close_custom_driver(tenant):
    """Close a tenant's custom Neo4j driver."""
    global _custom_drivers
    tenant_id = str(tenant.id)
    existing = _custom_drivers.pop(tenant_id, None)
    if existing and existing.get('driver'):
        try:
            existing['driver'].close()
        except Exception:
            pass


def close_all_custom_drivers():
    """Close all custom Neo4j drivers."""
    global _custom_drivers
    for tenant_id, config in list(_custom_drivers.items()):
        try:
            config['driver'].close()
        except Exception:
            pass
    _custom_drivers.clear()


# Cache tenant database names to avoid CREATE DATABASE on every request
_tenant_db_cache: dict = {}


def ensure_tenant_database(tenant) -> str:
    """
    Ensure a Neo4j database exists for this tenant.
    Returns the database name to use for queries.

    Uses Neo4j's multi-database feature (Enterprise) or falls back
    to label-prefix isolation (Community/AuraDB free).

    Caches results to avoid running CREATE DATABASE on every request.
    """
    tenant_id = str(tenant.id)[:8]
    cache_key = tenant_id

    # Return cached result if available
    if cache_key in _tenant_db_cache:
        return _tenant_db_cache[cache_key]

    db_name = f"tenant_{tenant_id}"

    driver = get_global_driver()
    if not driver:
        _tenant_db_cache[cache_key] = ''
        return ''

    try:
        # Try to create the database (Neo4j Enterprise feature)
        with driver.session(database="system") as session:
            session.run(f"CREATE DATABASE `{db_name}` IF NOT EXISTS")
            logger.info(f"Ensured Neo4j database: {db_name}")
        _tenant_db_cache[cache_key] = db_name
        return db_name
    except Exception as e:
        # Community edition or AuraDB free - use default database
        logger.info(f"Multi-database not available, using default DB with tenant isolation: {e}")
        _tenant_db_cache[cache_key] = ''
        return ''


def get_tenant_database(tenant) -> str:
    """Get the database name for a tenant (without creating it)."""
    tenant_id = str(tenant.id)[:8]
    return f"tenant_{tenant_id}"


def close_driver():
    """Close the global driver."""
    global _driver
    if _driver:
        try:
            _driver.close()
        except Exception:
            pass
        _driver = None


def upload_knowledge_to_graph(driver, tenant, knowledge_data: dict, db_name: str = '') -> dict:
    """
    Upload structured knowledge into Neo4j as nodes and relationships.
    Each node is tagged with tenant_id for data isolation.

    Expected knowledge_data format:
    {
        "roles": [
            {
                "name": "admin",
                "display_name": "Administrator",
                "description": "Full access",
                "pages": [
                    {
                        "path": "/dashboard",
                        "title": "Dashboard",
                        "description": "Overview",
                        "visible_content": "...",
                        "actions": [
                            {
                                "id": "admin_export",
                                "label": "Export",
                                "action_description": "Export data",
                                "navigates_to": "/reports"
                            }
                        ],
                        "linked_pages": ["/reports"]
                    }
                ],
                "menu_items": [
                    {"label": "Dashboard", "icon": "dashboard", "path": "/dashboard"}
                ]
            }
        ],
        "pages": [...]
    }
    """
    tenant_id = str(tenant.id)
    session_db = db_name or ''
    session_kwargs = {'database': session_db} if session_db else {}

    stats = {
        "roles_created": 0,
        "pages_created": 0,
        "actions_created": 0,
        "menu_items_created": 0,
        "relationships_created": 0,
    }

    with driver.session(**session_kwargs) as session:
        # Clear existing knowledge for this tenant only
        session.run(
            "MATCH (n) WHERE n.tenant_id = $tid DETACH DELETE n",
            tid=tenant_id,
        )

        # Upload roles
        for role_data in knowledge_data.get('roles', []):
            role_name = role_data.get('name', '')
            if not role_name:
                continue

            session.run(
                """
                MERGE (r:Role {name: $name, tenant_id: $tid})
                SET r.display_name = $display_name,
                    r.description = $description
                """,
                name=role_name,
                tid=tenant_id,
                display_name=role_data.get('display_name', role_name),
                description=role_data.get('description', ''),
            )
            stats['roles_created'] += 1

            # Upload pages accessible by this role
            for page_data in role_data.get('pages', []):
                page_path = page_data.get('path', '')
                if not page_path:
                    continue

                session.run(
                    """
                    MERGE (p:Page {path: $path, tenant_id: $tid})
                    SET p.title = $title,
                        p.description = $description,
                        p.visible_content = $visible_content
                    WITH p
                    MATCH (r:Role {name: $role_name, tenant_id: $tid})
                    MERGE (r)-[:CAN_ACCESS]->(p)
                    """,
                    path=page_path,
                    tid=tenant_id,
                    title=page_data.get('title', ''),
                    description=page_data.get('description', ''),
                    visible_content=page_data.get('visible_content', ''),
                    role_name=role_name,
                )
                stats['pages_created'] += 1
                stats['relationships_created'] += 1

                # Upload actions on this page
                for action_data in page_data.get('actions', []):
                    action_id = action_data.get('id', '')
                    if not action_id:
                        continue

                    session.run(
                        """
                        MERGE (a:Action {id: $id, tenant_id: $tid})
                        SET a.label = $label,
                            a.action_description = $description
                        WITH a
                        MATCH (p:Page {path: $page_path, tenant_id: $tid})
                        MERGE (p)-[:HAS_ACTION]->(a)
                        """,
                        id=action_id,
                        tid=tenant_id,
                        label=action_data.get('label', ''),
                        description=action_data.get('action_description', ''),
                        page_path=page_path,
                    )
                    stats['actions_created'] += 1
                    stats['relationships_created'] += 1

                    # Link action to target page
                    target_path = action_data.get('navigates_to', '')
                    if target_path:
                        session.run(
                            """
                            MATCH (a:Action {id: $action_id, tenant_id: $tid})
                            MERGE (target:Page {path: $target_path, tenant_id: $tid})
                            MERGE (a)-[:NAVIGATES_TO]->(target)
                            """,
                            action_id=action_id,
                            tid=tenant_id,
                            target_path=target_path,
                        )
                        stats['relationships_created'] += 1

                # Link page to other pages
                for linked_path in page_data.get('linked_pages', []):
                    session.run(
                        """
                        MATCH (source:Page {path: $source_path, tenant_id: $tid})
                        MERGE (target:Page {path: $target_path, tenant_id: $tid})
                        MERGE (source)-[:LINKED_TO]->(target)
                        """,
                        source_path=page_path,
                        tid=tenant_id,
                        target_path=linked_path,
                    )
                    stats['relationships_created'] += 1

            # Upload menu items
            for menu_data in role_data.get('menu_items', []):
                menu_label = menu_data.get('label', '')
                if not menu_label:
                    continue

                session.run(
                    """
                    MERGE (m:MenuItem {label: $label, role_name: $role_name, tenant_id: $tid})
                    SET m.icon = $icon, m.path = $path
                    WITH m
                    MATCH (r:Role {name: $role_name, tenant_id: $tid})
                    MERGE (r)-[:HAS_MENU_ITEM]->(m)
                    """,
                    label=menu_label,
                    role_name=role_name,
                    tid=tenant_id,
                    icon=menu_data.get('icon', ''),
                    path=menu_data.get('path', ''),
                )
                stats['menu_items_created'] += 1
                stats['relationships_created'] += 1

                # Link menu item to target page
                target_path = menu_data.get('path', '')
                if target_path:
                    session.run(
                        """
                        MATCH (m:MenuItem {label: $label, role_name: $role_name, tenant_id: $tid})
                        MERGE (p:Page {path: $path, tenant_id: $tid})
                        MERGE (m)-[:LINKED_TO]->(p)
                        """,
                        label=menu_label,
                        role_name=role_name,
                        tid=tenant_id,
                        path=target_path,
                    )
                    stats['relationships_created'] += 1

        # Upload standalone pages
        for page_data in knowledge_data.get('pages', []):
            page_path = page_data.get('path', '')
            if not page_path:
                continue

            session.run(
                """
                MERGE (p:Page {path: $path, tenant_id: $tid})
                SET p.title = $title,
                    p.description = $description,
                    p.visible_content = $visible_content
                """,
                path=page_path,
                tid=tenant_id,
                title=page_data.get('title', ''),
                description=page_data.get('description', ''),
                visible_content=page_data.get('visible_content', ''),
            )
            stats['pages_created'] += 1

            for action_data in page_data.get('actions', []):
                action_id = action_data.get('id', '')
                if not action_id:
                    continue

                session.run(
                    """
                    MERGE (a:Action {id: $id, tenant_id: $tid})
                    SET a.label = $label,
                        a.action_description = $description
                    WITH a
                    MATCH (p:Page {path: $page_path, tenant_id: $tid})
                    MERGE (p)-[:HAS_ACTION]->(a)
                    """,
                    id=action_id,
                    tid=tenant_id,
                    label=action_data.get('label', ''),
                    description=action_data.get('action_description', ''),
                    page_path=page_path,
                )
                stats['actions_created'] += 1
                stats['relationships_created'] += 1

    return stats


def get_role_context_from_neo4j(driver, tenant, role_name: str, db_name: str = '', use_tenant_filter: bool = True) -> str:
    """
    Query the Neo4j Knowledge Graph for a specific tenant and role.
    Returns formatted text for injection into the system prompt.

    When use_tenant_filter is True (platform Neo4j), filters by tenant_id.
    When False (custom Neo4j), matches role by name only.
    """
    tenant_id = str(tenant.id)
    session_db = db_name or ''
    session_kwargs = {'database': session_db} if session_db else {}

    pages_data = []
    menu_data = []

    if use_tenant_filter:
        pages_query = """
        MATCH (r:Role {name: $role_name, tenant_id: $tid})-[:CAN_ACCESS]->(p:Page)
        OPTIONAL MATCH (p)-[:HAS_ACTION]->(a:Action)
        OPTIONAL MATCH (a)-[:NAVIGATES_TO]->(target:Page)
        RETURN p.path as path, p.title as title, p.description as description,
                p.visible_content as visible_content,
                collect({id: a.id, label: a.label, description: a.action_description, navigates_to: target.path}) as actions
        """
        menu_query = """
        MATCH (r:Role {name: $role_name, tenant_id: $tid})-[:HAS_MENU_ITEM]->(m:MenuItem)
        OPTIONAL MATCH (m)-[:LINKED_TO]->(p:Page)
        RETURN m.label as label, m.icon as icon, p.path as path
        """
    else:
        pages_query = """
        MATCH (r:Role {name: $role_name})-[:CAN_ACCESS]->(p:Page)
        OPTIONAL MATCH (p)-[:HAS_ACTION]->(a:Action)
        OPTIONAL MATCH (a)-[:NAVIGATES_TO]->(target:Page)
        RETURN p.path as path, p.title as title, p.description as description,
                p.visible_content as visible_content,
                collect({id: a.id, label: a.label, description: a.action_description, navigates_to: target.path}) as actions
        """
        menu_query = """
        MATCH (r:Role {name: $role_name})-[:HAS_MENU_ITEM]->(m:MenuItem)
        OPTIONAL MATCH (m)-[:LINKED_TO]->(p:Page)
        RETURN m.label as label, m.icon as icon, p.path as path
        """

    params = {'role_name': role_name}
    if use_tenant_filter:
        params['tid'] = tenant_id

    with driver.session(**session_kwargs) as session:
        pages_result = session.run(pages_query, **params)
        for record in pages_result:
            pages_data.append({
                "path": record["path"],
                "title": record["title"],
                "description": record["description"],
                "visible_content": record["visible_content"],
                "actions": record["actions"],
            })

        menu_result = session.run(menu_query, **params)
        for record in menu_result:
            menu_data.append({
                "label": record["label"],
                "icon": record["icon"],
                "path": record["path"],
            })

    if not pages_data and not menu_data:
        return ""

    lines = [f"Active Role: {role_name}"]

    if menu_data:
        lines.append("\nSidebar Navigation Menu:")
        for item in menu_data:
            path_str = f" -> {item['path']}" if item['path'] else ""
            icon_str = f" (Icon: {item['icon']})" if item['icon'] else ""
            lines.append(f"- {item['label']}{icon_str}{path_str}")

    if pages_data:
        lines.append("\nAccessible Pages & Page Content Details:")
        for p in pages_data:
            lines.append("---")
            lines.append(f"Page Title: {p['title']}")
            lines.append(f"Route Path: {p['path']}")
            if p['description']:
                lines.append(f"Description: {p['description']}")
            if p['visible_content']:
                lines.append("Visible Page Content:")
                for cl in p['visible_content'].split('\n'):
                    if cl.strip():
                        lines.append(f"  - {cl.strip()}")
            valid_actions = [a for a in p['actions'] if a.get('label')]
            if valid_actions:
                lines.append("Interactive Elements & Clickable Actions on this Page:")
                for a in valid_actions:
                    nav_str = f" (Navigates to: {a['navigates_to']})" if a['navigates_to'] else ""
                    desc_str = f" — {a['description']}" if a['description'] else ""
                    lines.append(f'  * Click "{a["label"]}"{nav_str}{desc_str}')
        lines.append("---")

    return "\n".join(lines)


def get_graph_stats(driver, tenant, db_name: str = '', use_tenant_filter: bool = True) -> dict:
    """Get summary statistics for a tenant's knowledge graph.

    When use_tenant_filter is True (default for platform Neo4j), queries filter
    by tenant_id for multi-tenancy isolation. When False (for per-tenant custom
    Neo4j instances), counts ALL nodes since the database belongs to that tenant alone.
    """
    tenant_id = str(tenant.id)
    session_db = db_name or ''
    session_kwargs = {'database': session_db} if session_db else {}

    with driver.session(**session_kwargs) as session:
        if use_tenant_filter:
            roles = session.run(
                "MATCH (r:Role) WHERE r.tenant_id = $tid RETURN count(r) as count",
                tid=tenant_id,
            ).single()["count"]
            pages = session.run(
                "MATCH (p:Page) WHERE p.tenant_id = $tid RETURN count(p) as count",
                tid=tenant_id,
            ).single()["count"]
            actions = session.run(
                "MATCH (a:Action) WHERE a.tenant_id = $tid RETURN count(a) as count",
                tid=tenant_id,
            ).single()["count"]
            menu_items = session.run(
                "MATCH (m:MenuItem) WHERE m.tenant_id = $tid RETURN count(m) as count",
                tid=tenant_id,
            ).single()["count"]
            relationships = session.run(
                "MATCH (a)-[r]->(b) WHERE a.tenant_id = $tid RETURN count(r) as count",
                tid=tenant_id,
            ).single()["count"]
        else:
            roles = session.run(
                "MATCH (r:Role) RETURN count(r) as count"
            ).single()["count"]
            pages = session.run(
                "MATCH (p:Page) RETURN count(p) as count"
            ).single()["count"]
            actions = session.run(
                "MATCH (a:Action) RETURN count(a) as count"
            ).single()["count"]
            menu_items = session.run(
                "MATCH (m:MenuItem) RETURN count(m) as count"
            ).single()["count"]
            relationships = session.run(
                "MATCH ()-[r]->() RETURN count(r) as count"
            ).single()["count"]

    return {
        "roles": roles,
        "pages": pages,
        "actions": actions,
        "menu_items": menu_items,
        "relationships": relationships,
    }


def get_all_pages_from_neo4j(driver, tenant, db_name: str = '', use_tenant_filter: bool = True) -> list:
    """
    Query Neo4j for ALL Page nodes belonging to the tenant, across all roles.
    Returns a list of dicts with path, title, description, and associated roles.

    When use_tenant_filter is True (platform Neo4j), filters by tenant_id.
    When False (custom Neo4j), queries ALL pages.
    """
    tenant_id = str(tenant.id)
    session_db = db_name or ''
    session_kwargs = {'database': session_db} if session_db else {}

    if use_tenant_filter:
        query = """
        MATCH (p:Page)
        WHERE p.tenant_id = $tid
        OPTIONAL MATCH (r:Role {tenant_id: $tid})-[:CAN_ACCESS]->(p)
        RETURN DISTINCT p.path as path, p.title as title, p.description as description,
               collect(DISTINCT r.name) as roles
        """
        params = {'tid': tenant_id}
    else:
        query = """
        MATCH (p:Page)
        OPTIONAL MATCH (r:Role)-[:CAN_ACCESS]->(p)
        RETURN DISTINCT p.path as path, p.title as title, p.description as description,
               collect(DISTINCT r.name) as roles
        """
        params = {}

    pages = []
    with driver.session(**session_kwargs) as session:
        result = session.run(query, **params)
        for record in result:
            # Filter out nulls: OPTIONAL MATCH with no results yields [null], not []
            raw_roles = record['roles'] or []
            pages.append({
                'path': record['path'],
                'title': record['title'] or record['path'],
                'description': record['description'] or '',
                'roles': [r for r in raw_roles if r],
            })
    return pages


def has_custom_driver(tenant) -> bool:
    """Check if the tenant has a custom Neo4j connection configured."""
    try:
        from .models import Neo4jConfig
        config = Neo4jConfig.objects.get(tenant=tenant)
        return bool(config.uri) and config.is_connected
    except Exception:
        return False
