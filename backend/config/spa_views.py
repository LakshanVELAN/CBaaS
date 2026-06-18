import os
import mimetypes
import logging
from pathlib import Path
from django.http import FileResponse, Http404
from django.conf import settings
from django.utils.cache import patch_cache_control

logger = logging.getLogger(__name__)

FRONTEND_BUILD_DIR = settings.BASE_DIR / 'frontend_build'


def serve_spa(request, path=''):
    """
    Serve the React SPA's build files and fall back to index.html
    for client-side routing.
    """
    # Try to serve the exact file requested
    if path:
        file_path = FRONTEND_BUILD_DIR / path
        # Security: ensure we don't serve files outside the build directory
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
