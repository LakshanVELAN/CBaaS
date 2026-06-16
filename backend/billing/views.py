import logging

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .stripe_helpers import (
    create_checkout_session,
    create_customer_portal_session,
    handle_webhook_event,
    get_or_create_customer,
)

logger = logging.getLogger(__name__)

PLANS = [
    {
        'id': 'free',
        'name': 'Free',
        'price': 0,
        'price_display': 'Free',
        'messages_per_month': 500,
        'rate_limit': '20 req/min',
        'neo4j_graph': False,
        'support': 'Community',
        'features': [
            '500 messages/month',
            '20 req/min rate limit',
            'Basic knowledge base',
            'Community support',
        ],
    },
    {
        'id': 'starter',
        'name': 'Starter',
        'price': 2900,
        'price_display': '$29/mo',
        'messages_per_month': 5000,
        'rate_limit': '60 req/min',
        'neo4j_graph': False,
        'support': 'Email',
        'features': [
            '5,000 messages/month',
            '60 req/min rate limit',
            'Full knowledge base',
            'Route & role management',
            'Email support',
        ],
    },
    {
        'id': 'pro',
        'name': 'Pro',
        'price': 9900,
        'price_display': '$99/mo',
        'messages_per_month': 25000,
        'rate_limit': '200 req/min',
        'neo4j_graph': True,
        'support': 'Priority',
        'features': [
            '25,000 messages/month',
            '200 req/min rate limit',
            'Neo4j knowledge graph',
            'Advanced analytics',
            'Priority support',
        ],
    },
    {
        'id': 'enterprise',
        'name': 'Enterprise',
        'price': 29900,
        'price_display': '$299/mo',
        'messages_per_month': 1000000,
        'rate_limit': 'Unlimited',
        'neo4j_graph': 'Multi-DB',
        'support': 'Dedicated',
        'features': [
            '1,000,000 messages/month',
            'Unlimited rate limit',
            'Multi-tenant Neo4j',
            'Custom integrations',
            'Dedicated support',
            'SLA guarantee',
        ],
    },
]


@api_view(['GET'])
def list_plans(request):
    """List available subscription plans with pricing, features, and tenant's current subscription."""
    tenant = request.tenant
    sub = getattr(tenant, 'subscription', None)

    subscription_info = {
        'plan': tenant.plan,
        'status': sub.status if sub else 'active',
        'messages_used': None,
        'messages_limit': tenant.monthly_message_quota,
        'stripe_customer_id': sub.stripe_customer_id if sub else None,
        'stripe_subscription_id': sub.stripe_subscription_id if sub else None,
        'period_end': sub.period_end.isoformat() if sub and sub.period_end else None,
        'created_at': sub.created_at.isoformat() if sub else None,
    }

    return Response({
        'subscription': subscription_info,
        'plans': PLANS,
    })


@api_view(['POST'])
def create_checkout(request):
    """
    Create a Stripe checkout session for a subscription upgrade.
    Accepts: { plan_id: "starter"|"pro"|"enterprise" }
    Returns: { url: "https://checkout.stripe.com/..." }
    """
    tenant = request.tenant
    plan_id = request.data.get('plan_id', '')

    if plan_id not in ('starter', 'pro', 'enterprise'):
        return Response(
            {'error': 'Invalid plan_id. Must be one of: starter, pro, enterprise'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if tenant.plan == plan_id:
        return Response(
            {'error': f'You are already on the {plan_id} plan'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Build success/cancel URLs
    base_url = request.build_absolute_uri('/').rstrip('/')
    success_url = f'{base_url}/billing?success=true&plan={plan_id}'
    cancel_url = f'{base_url}/billing?canceled=true'

    checkout_url = create_checkout_session(tenant, plan_id, success_url, cancel_url)

    if not checkout_url:
        return Response(
            {'error': 'Failed to create checkout session. Stripe may not be configured.'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    return Response({'url': checkout_url})


@api_view(['POST'])
def customer_portal(request):
    """
    Redirect to Stripe customer portal for managing subscription.
    Returns: { url: "https://billing.stripe.com/p/..." }
    """
    tenant = request.tenant
    base_url = request.build_absolute_uri('/').rstrip('/')
    return_url = f'{base_url}/billing'

    portal_url = create_customer_portal_session(tenant, return_url)

    if not portal_url:
        return Response(
            {'error': 'Failed to create portal session. Stripe may not be configured.'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    return Response({'url': portal_url})


@api_view(['GET'])
def subscription_status(request):
    """Get the current tenant's subscription details and available plans."""
    tenant = request.tenant
    sub = getattr(tenant, 'subscription', None)

    subscription_info = {
        'plan': tenant.plan,
        'status': sub.status if sub else 'active',
        'messages_used': None,  # Populated by analytics
        'messages_limit': tenant.monthly_message_quota,
        'stripe_customer_id': sub.stripe_customer_id if sub else None,
        'stripe_subscription_id': sub.stripe_subscription_id if sub else None,
        'period_end': sub.period_end.isoformat() if sub and sub.period_end else None,
        'created_at': sub.created_at.isoformat() if sub else None,
    }

    return Response({
        'subscription': subscription_info,
        'plans': PLANS,
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def stripe_webhook(request):
    """
    Handle Stripe webhook events.
    Stripe sends events like checkout.session.completed,
    customer.subscription.updated, invoice.payment_failed, etc.
    """
    payload = request.body
    sig_header = request.headers.get('Stripe-Signature', '')

    if not sig_header:
        return Response(
            {'error': 'Missing Stripe-Signature header'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    status_result, message = handle_webhook_event(payload, sig_header)

    if status_result == 'invalid':
        return Response({'error': message}, status=status.HTTP_400_BAD_REQUEST)

    return Response({'status': 'ok', 'message': message})
