import os
import mimetypes
import logging
from pathlib import Path
from django.http import FileResponse, Http404
from django.conf import settings
from django.utils.cache import patch_cache_control

logger = logging.getLogger(__name__)

FRONTEND_BUILD_DIR = settings.BASE_DIR / 'frontend_build'
STATIC_ROOT = settings.BASE_DIR / 'staticfiles'


def serve_spa(request, path=''):
    """
    Serve the React SPA's build files and fall back to index.html
    for client-side routing.

    Also explicitly serves files from STATIC_ROOT for paths starting
    with 'static/' — this handles the widget JS and other static assets
    that WhiteNoise may not intercept before the catch-all URL pattern.
    """
    if path:
        # --- Serve from STATIC_ROOT for any static/ prefixed path ---
        # This ensures /static/widget/chatbot-widget.js is served as JS,
        # not swallowed by the SPA catch-all returning index.html.
        if path.startswith('static/'):
            static_relative = path[len('static/'):]  # strip the 'static/' prefix
            static_file = STATIC_ROOT / static_relative
            try:
                static_file.relative_to(STATIC_ROOT)  # security check
            except ValueError:
                raise Http404("Invalid static path")
            if static_file.exists() and static_file.is_file():
                content_type, _ = mimetypes.guess_type(str(static_file))
                if content_type is None:
                    content_type = 'application/octet-stream'
                response = FileResponse(open(static_file, 'rb'), content_type=content_type)
                patch_cache_control(response, max_age=86400, public=True)
                return response
            logger.warning(f"Static file not found in STATIC_ROOT: {static_file}")

        # --- Serve from frontend_build for SPA assets ---
        file_path = FRONTEND_BUILD_DIR / path
        try:
            file_path.relative_to(FRONTEND_BUILD_DIR)
        except ValueError:
            raise Http404("Invalid path")

        if file_path.exists() and file_path.is_file():
            content_type, _ = mimetypes.guess_type(str(file_path))
            if content_type is None:
                content_type = 'application/octet-stream'
            response = FileResponse(open(file_path, 'rb'), content_type=content_type)
            # Static assets (JS/CSS with content hashes) can be cached aggressively
            # since the filename changes when content changes
            if path.startswith('assets/'):
                patch_cache_control(response, max_age=31536000, public=True)
            else:
                patch_cache_control(response, no_cache=True, must_revalidate=True)
            return response

    # Fall back to index.html (SPA client-side routing)
    # Never cache index.html so users always get the latest bundle reference
    index_path = FRONTEND_BUILD_DIR / 'index.html'
    if not index_path.exists():
        logger.error(f"SPA index.html not found at {index_path}")
        raise Http404("Frontend not built. Run the frontend build first.")

    response = FileResponse(open(index_path, 'rb'), content_type='text/html')
    patch_cache_control(response, no_cache=True, must_revalidate=True)
    return response
