from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse


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
]
