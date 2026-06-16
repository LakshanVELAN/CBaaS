from django.urls import path
from . import views

urlpatterns = [
    path('plans/', views.list_plans, name='billing-plans'),
    path('checkout/', views.create_checkout, name='billing-checkout'),
    path('portal/', views.customer_portal, name='billing-portal'),
    path('webhook/', views.stripe_webhook, name='billing-webhook'),
]
