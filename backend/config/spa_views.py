import os
import mimetypes
import logging
from pathlib import Path
from django.http import FileResponse, Http404
from django.conf import settings

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
            return FileResponse(open(file_path, 'rb'), content_type=content_type)

    # Fall back to index.html (SPA client-side routing)
    index_path = FRONTEND_BUILD_DIR / 'index.html'
    if not index_path.exists():
        logger.error(f"SPA index.html not found at {index_path}")
        raise Http404("Frontend not built. Run the frontend build first.")

    return FileResponse(open(index_path, 'rb'), content_type='text/html')
