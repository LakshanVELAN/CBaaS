from django.urls import path
from . import views

urlpatterns = [
    # Chat endpoints
    path('message/', views.chat_message, name='chat-message'),
    path('train-page/', views.train_page, name='chat-train-page'),
    path('train-page-widget/', views.train_page_from_widget, name='chat-train-page-widget'),
    path('knowledge-base/', views.knowledge_base_list, name='knowledge-base-list'),
    path('knowledge-base/<uuid:entry_id>/', views.knowledge_base_delete, name='knowledge-base-delete'),
    path('upload-knowledge/', views.upload_knowledge_json, name='upload-knowledge-json'),
    path('graph-stats/', views.graph_stats, name='graph-stats'),

    # Route registry
    path('routes/', views.route_registry_list, name='route-registry-list'),
    path('routes/<uuid:entry_id>/', views.route_registry_detail, name='route-registry-detail'),

    # Role configs
    path('roles/', views.role_config_list, name='role-config-list'),
    path('roles/<uuid:entry_id>/', views.role_config_detail, name='role-config-detail'),

    # Neo4j config
    path('neo4j-config/', views.neo4j_config_view, name='neo4j-config'),
    path('neo4j-test/', views.neo4j_test_connection, name='neo4j-test-connection'),

    # Knowledge extraction guide
    path('extraction-guide/', views.extraction_guide, name='extraction-guide'),
]
