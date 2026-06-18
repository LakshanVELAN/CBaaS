from django.contrib import admin
from django.urls import path, include, re_path
from django.http import JsonResponse

from config.spa_views import serve_spa


def health_check(request):
    """Health check endpoint."""
    return JsonResponse({'status': 'ok', 'service': 'chatbot-saas'})


urlpatterns = [
    # Health check
    path('health/', health_check, name='health-check'),

    # Admin
    path('admin/', admin.site.urls),

    # API v1
    path('api/v1/', include('api_gateway.urls')),
    path('api/v1/tenants/', include('tenant_manager.urls')),
    path('api/v1/chat/', include('chat_proxy.urls')),
    path('api/v1/analytics/', include('analytics.urls')),
    path('api/v1/billing/', include('billing.urls')),
    path('api/v1/superadmin/', include('superadmin.urls')),

    # Catch-all: Serve React SPA for all other routes
    # This must be the LAST pattern in urlpatterns
    re_path(r'^(?P<path>.*)$', serve_spa, name='spa-catch-all'),
]
