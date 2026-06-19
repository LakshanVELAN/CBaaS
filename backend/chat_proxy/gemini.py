"""
Gemini AI integration for the ChatBot SaaS platform.
Supports site navigation via knowledge base entries with URLs,
role-based context, workspace (DOM-scanned) knowledge, and route extraction.
"""
import os
import re
import json
import logging
import concurrent.futures
from urllib.parse import urlparse

from django.conf import settings

logger = logging.getLogger(__name__)

# Lazy import: google.generativeai uses gRPC which can hang during
# import in forked gunicorn workers. Configure on first use instead.
_genai_configured = False

def _ensure_genai():
    """Lazy-import and configure google.generativeai on first use."""
    global _genai_configured
    if _genai_configured:
        return
    import google.generativeai as genai
    api_key = os.environ.get('GEMINI_API_KEY', '') or getattr(settings, 'GEMINI_API_KEY', '')
    if api_key:
        genai.configure(api_key=api_key)
    else:
        logger.warning("GEMINI_API_KEY not configured — Gemini calls will fail")
    _genai_configured = True


def get_model(model_name: str = None, system_instruction: str = None):
    """Get a Gemini model instance, optionally with a system instruction."""
    _ensure_genai()
    import google.generativeai as genai
    name = model_name or getattr(settings, 'GEMINI_MODEL', 'gemini-2.5-flash')
    kwargs = {}
    if system_instruction:
        kwargs['system_instruction'] = system_instruction
    return genai.GenerativeModel(name, **kwargs)


def build_system_prompt(
    tenant,
    knowledge_base_entries: list = None,
    role_entries: list = None,
    route_entries: list = None,
    workspace_context: dict = None,
    site_knowledge: list = None,
    neo4j_context: str = '',
) -> str:
    """
    Build the dynamic system prompt from tenant config, knowledge base,
    role definitions, route registry, and workspace (DOM-scanned) context.

    Injects role-specific context, workspace page knowledge, site knowledge,
    and instructs the LLM to output [NAVIGATE:url|title] tags.
    """
    parts = []

    # 1. Tenant's custom system prompt (or default)
    if tenant.custom_system_prompt_override:
        parts.append(tenant.custom_system_prompt_override)
    else:
        parts.append(
            "You are a helpful AI assistant for this website. "
            "Answer questions accurately and concisely based on the knowledge base provided. "
            "Guide users through the platform by suggesting relevant pages and actions. "
            "If you don't know something, say so honestly."
        )

    # 2. Navigation instructions
    parts.append(
        "\nWhen a user asks about a feature, page, or action on this site, "
        "suggest navigating to the relevant page by including a navigation tag "
        "at the end of your response in this exact format:\n"
        "[NAVIGATE:url|page_title]\n"
        "For example: [NAVIGATE:https://example.com/pricing|Pricing Page]\n"
        "You can suggest multiple pages if relevant. "
        "Only suggest navigation when it's genuinely helpful."
    )

    # 3. Current user's role context
    if role_entries:
        parts.append("\n\n--- Current User Role ---")
        role = role_entries[0]
        name = role.get('name', '')
        display = role.get('display_name', name)
        desc = role.get('description', '')
        parts.append(
            f"The current user has the role **{display}** ({name}). "
            f"{desc}"
        )
        parts.append(
            "\n**IMPORTANT**: You MUST ONLY answer questions about what THIS role can access. "
            "Do NOT describe other roles, their capabilities, or their accessible pages. "
            "If a user asks about another role's access, say you cannot answer that. "
            "Stay strictly within this role's scope."
        )
        parts.append("--- End Current User Role ---")

    # 4. Route registry context
    if route_entries:
        parts.append("\n\n--- Site Navigation Map ---")
        parts.append(
            "The following routes are available on this website. "
            "Use this to guide users to the correct page:\n"
        )
        for route in route_entries:
            path = route.get('path', '')
            name = route.get('name', '')
            desc = route.get('description', '')
            roles = route.get('allowed_roles', [])
            role_str = f" (Roles: {', '.join(roles)})" if roles else ""
            parts.append(f"- {name}: {path}{role_str}\n  {desc}")
        parts.append("--- End Navigation Map ---")

    # 5. Workspace context (DOM-scanned page knowledge from widget)
    if workspace_context:
        parts.append("\n\n--- Current Page Context (Live DOM Scan) ---")
        parts.append("The user is currently viewing this page. Here is the live page structure:\n")
        if workspace_context.get('title'):
            parts.append(f"Page Title: {workspace_context['title']}")
        if workspace_context.get('current_page'):
            parts.append(f"Current URL: {workspace_context['current_page']}")
        if workspace_context.get('headings'):
            parts.append(f"Headings: {', '.join(workspace_context['headings'][:10])}")
        if workspace_context.get('buttons'):
            parts.append(f"Buttons/Actions: {', '.join(workspace_context['buttons'][:10])}")
        if workspace_context.get('sections'):
            parts.append(f"Sections: {json.dumps(workspace_context['sections'][:10], indent=2)}")
        if workspace_context.get('forms'):
            parts.append(f"Forms: {json.dumps(workspace_context['forms'][:5], indent=2)}")
        if workspace_context.get('workflows'):
            parts.append(f"Workflow Steps: {json.dumps(workspace_context['workflows'][:10], indent=2)}")
        if workspace_context.get('instructional_text'):
            parts.append(f"Instructions on page: {json.dumps(workspace_context['instructional_text'][:10], indent=2)}")
        parts.append("--- End Current Page Context ---")

    # 6. Site knowledge from widget (route-aware context)
    if site_knowledge:
        parts.append("\n\n--- Accessible Routes for Current User ---")
        parts.append(
            "Based on the user's role, these are the routes they can access:\n"
        )
        for sk in site_knowledge:
            name = sk.get('name', '')
            path = sk.get('path', '')
            desc = sk.get('description', '')
            parts.append(f"- {name} ({path}): {desc}")
        parts.append("--- End Accessible Routes ---")

    # 7. Knowledge base entries (URL-scraped pages)
    if knowledge_base_entries:
        parts.append("\n\n--- Trained Knowledge Base ---")
        parts.append(
            "The following pages have been trained into the knowledge base. "
            "Use their content to answer questions only if relevant:\n"
        )
        for i, entry in enumerate(knowledge_base_entries[:50], 1):
            url = entry.get('url', '')
            title = entry.get('title', f'Page {i}')
            content = entry.get('content', '')
            parts.append(f"\n[Page {i}: {title}]")
            parts.append(f"URL: {url}")
            parts.append(f"Content:\n{content}")
        parts.append("\n--- End Trained Knowledge Base ---")

    # 8. Knowledge graph context from Neo4j (placed LAST for highest priority)
    if neo4j_context:
        parts.append("\n\n--- Knowledge Graph Context (Neo4j) [HIGHEST PRIORITY] ---")
        parts.append(
            "The following structured knowledge graph describes roles, pages, "
            "actions, and navigation paths. **This is the most authoritative source of truth.** "
            "Always prioritize this knowledge over any trained/scraped page content:\n"
        )
        parts.append(neo4j_context)
        parts.append("--- End Knowledge Graph Context (Neo4j) ---")

    return "\n".join(parts)


def parse_navigation_suggestions(response_text: str) -> tuple:
    """
    Extract navigation suggestions from the bot response.

    Returns: (cleaned_text, list of {'url': str, 'title': str})
    """
    # Match both https:// and widget:// protocols (widget:// indicates an app route)
    nav_pattern = r'\[NAVIGATE:((?:https?|widget)://[^\]|]+)\|([^\]]+)\]'
    matches = re.findall(nav_pattern, response_text)

    navigations = []
    for url, title in matches:
        navigations.append({'url': url.strip(), 'title': title.strip()})

    # Remove navigation tags from the response text
    cleaned_text = re.sub(nav_pattern, '', response_text).strip()

    # Clean up any double newlines left behind
    cleaned_text = re.sub(r'\n{3,}', '\n\n', cleaned_text)

    return cleaned_text, navigations


def extract_route_from_response(response_text: str) -> tuple:
    """
    Parse backticked routes from the LLM response.
    E.g. matches `Navigate here:` `/route/path` — Label
    """
    if not response_text:
        return None, None

    # Pattern 1: backticked route with description after it
    pattern = r'`(/[^`]+)`\s*(?:—|-|\||:)?\s*([^|\r\n\t*]+)'
    match = re.search(pattern, response_text)
    if match:
        route = match.group(1).strip()
        route_name = match.group(2).strip()
        route_name = re.sub(r'^[—\-\|\:\s]+|[—\-\|\:\s]+$', '', route_name).strip()
        route_name = re.sub(r'[*_#`]+', '', route_name).strip()
        return route, route_name

    # Pattern 2: fallback - just any backticked route starting with /
    fallback_pattern = r'`(/[^`\s]+)`'
    match = re.search(fallback_pattern, response_text)
    if match:
        route = match.group(1).strip()
        return route, 'Page'

    return None, None


def chat_completion(
    message: str,
    history: list = None,
    system_prompt: str = None,
    model_name: str = None,
) -> dict:
    """
    Send a chat message to Gemini and return the response.

    Args:
        message: The user's message.
        history: Previous conversation messages as list of
                 {"sender": "user"|"bot", "text": "..."}.
        system_prompt: The system prompt to use.
        model_name: Optional model override.

    Returns:
        {"message": str, "navigations": list, "token_usage": dict}
    """
    # Build conversation history
    chat_history = []
    if history:
        for msg in history[-20:]:  # Last 20 messages max
            sender = msg.get('sender', 'user')
            content = msg.get('text', '')
            gemini_role = 'user' if sender in ('user', 'guest') else 'model'
            chat_history.append({"role": gemini_role, "parts": [content]})

    # Start a chat session with system instruction
    system_instruction = system_prompt or "You are a helpful AI assistant."
    model_with_system = get_model(model_name, system_instruction=system_instruction)
    chat = model_with_system.start_chat(history=chat_history)

    # Send the message with a timeout to prevent infinite hangs
    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
        future = executor.submit(chat.send_message, message)
        try:
            response = future.result(timeout=60)  # 60s max for Gemini response
        except concurrent.futures.TimeoutError:
            raise TimeoutError("Gemini API request timed out after 60 seconds")

    # Parse navigation suggestions from response
    cleaned_text, navigations = parse_navigation_suggestions(response.text)

    # Extract token usage
    usage = response.usage_metadata
    token_usage = {
        "prompt_tokens": getattr(usage, 'prompt_token_count', 0) or 0,
        "completion_tokens": getattr(usage, 'candidates_token_count', 0) or 0,
        "total_tokens": getattr(usage, 'total_token_count', 0) or 0,
        "cost": 0.0,
    }

    return {
        "message": cleaned_text,
        "navigations": navigations,
        "token_usage": token_usage,
    }


def train_page_content(url: str) -> dict:
    """
    Fetch and extract text content from a web page for knowledge base training.
    Also extracts internal links for navigation suggestions.

    Args:
        url: The URL to scrape.

    Returns:
        {"title": str, "content": str, "url": str, "links": list}
    """
    import requests
    from bs4 import BeautifulSoup

    # SSRF protection: only allow http/https schemes and block internal IPs
    parsed = urlparse(url)
    if parsed.scheme not in ('http', 'https'):
        raise ValueError('Only http and https URLs are allowed')
    hostname = parsed.hostname or ''
    blocked = ['localhost', '127.0.0.1', '0.0.0.0', '169.254.169.254', '[::1]']
    if hostname in blocked or hostname.startswith('10.') or hostname.startswith('192.168.'):
        raise ValueError('Internal/private URLs are not allowed')

    try:
        resp = requests.get(url, timeout=15, headers={
            'User-Agent': 'ChatBot-SaaS/1.0 Knowledge-Base-Builder'
        })
        resp.raise_for_status()

        soup = BeautifulSoup(resp.text, 'html.parser')

        # Remove script and style elements
        for tag in soup(['script', 'style', 'nav', 'footer', 'header', 'aside']):
            tag.decompose()

        title = soup.title.string.strip() if soup.title and soup.title.string else url

        # Get main content
        main = soup.find('main') or soup.find('article') or soup.body or soup
        text = main.get_text(separator='\n', strip=True)

        # Clean up whitespace
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        content = '\n'.join(lines)

        # Truncate to reasonable size (approx 8000 chars ~ 2000 tokens)
        if len(content) > 8000:
            content = content[:8000] + "\n[Content truncated...]"

        # Extract links from the page for navigation
        links = []
        base_parsed = urlparse(url)
        for a_tag in soup.find_all('a', href=True):
            href = a_tag['href']
            link_text = a_tag.get_text(strip=True)
            if not link_text or len(link_text) < 2:
                continue

            # Resolve relative URLs
            if href.startswith('/'):
                href = f"{base_parsed.scheme}://{base_parsed.netloc}{href}"
            elif not href.startswith(('http://', 'https://')):
                continue

            # Only include links from the same domain
            link_parsed = urlparse(href)
            if link_parsed.netloc == base_parsed.netloc:
                links.append({
                    'url': href,
                    'title': link_text[:200],
                })

        # Deduplicate links
        seen_urls = set()
        unique_links = []
        for link in links:
            if link['url'] not in seen_urls:
                seen_urls.add(link['url'])
                unique_links.append(link)

        return {
            "title": title,
            "content": content,
            "url": url,
            "links": unique_links[:30],  # Limit to 30 links
        }

    except requests.RequestException as e:
        logger.error(f"Failed to fetch page {url}: {e}")
        raise ValueError(f"Could not fetch page: {e}")
