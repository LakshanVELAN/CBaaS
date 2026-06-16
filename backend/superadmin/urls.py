from django.urls import path
from . import views

urlpatterns = [
    path('stats/', views.platform_stats, name='superadmin-stats'),
    path('tenants/', views.tenant_list, name='superadmin-tenant-list'),
    path('tenants/<uuid:tenant_id>/toggle/', views.tenant_toggle, name='superadmin-tenant-toggle'),
]
