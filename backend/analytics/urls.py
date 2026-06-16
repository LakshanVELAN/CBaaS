from django.urls import path
from . import views

urlpatterns = [
    path('overview/', views.overview, name='analytics-overview'),
    path('daily/', views.daily_usage, name='analytics-daily'),
    path('usage/', views.usage_summary, name='analytics-usage'),
    path('messages/', views.message_logs, name='analytics-messages'),
    path('cost/', views.cost_breakdown, name='analytics-cost'),
]
