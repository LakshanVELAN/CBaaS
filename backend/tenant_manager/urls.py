from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register, name='tenant-register'),
    path('login/', views.login, name='tenant-login'),
    path('me/', views.profile, name='tenant-profile'),
    path('api-keys/', views.api_keys_list_create, name='api-key-list-create'),
    path('api-keys/<uuid:key_id>/', views.api_keys_delete, name='api-key-delete'),
]
