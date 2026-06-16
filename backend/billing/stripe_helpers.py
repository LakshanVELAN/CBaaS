"""
Stripe integration helpers for subscription management.
"""
import os
import json
import logging

import stripe
from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)

stripe.api_key = settings.STRIPE_SECRET_KEY

# Map our plan IDs to Stripe price IDs (set via env)
STRIPE_PRICE_IDS = {
    'starter': os.environ.get('STRIPE_PRICE_STARTER', ''),
    'pro': os.environ.get('STRIPE_PRICE_PRO', ''),
    'enterprise': os.environ.get('STRIPE_PRICE_ENTERPRISE', ''),
}

PLAN_QUOTA_MAP = {
    'free': 500,
    'starter': 5000,
    'pro': 25000,
    'enterprise': 1000000,
}


def get_or_create_customer(tenant):
    """Get existing Stripe customer ID or create a new one."""
    from .models import Subscription

    try:
        # Check if we already have a customer ID
        sub, created = Subscription.objects.get_or_create(
            tenant=tenant,
            defaults={'plan': tenant.plan, 'status': 'active'},
        )
        if sub.stripe_customer_id:
            return sub.stripe_customer_id

        # Create Stripe customer
        customer = stripe.Customer.create(
            name=tenant.name,
            metadata={'tenant_id': str(tenant.id)},
        )
        sub.stripe_customer_id = customer.id
        sub.save(update_fields=['stripe_customer_id'])
        return customer.id

    except stripe.error.StripeError as e:
        logger.error(f"Stripe customer creation failed: {e}")
        return None


def create_checkout_session(tenant, plan_id, success_url, cancel_url):
    """
    Create a Stripe checkout session for a subscription.
    Returns the checkout URL.
    """
    price_id = STRIPE_PRICE_IDS.get(plan_id)
    if not price_id:
        logger.error(f"No Stripe price ID configured for plan: {plan_id}")
        return None

    customer_id = get_or_create_customer(tenant)
    if not customer_id:
        return None

    try:
        checkout = stripe.checkout.Session.create(
            customer=customer_id,
            payment_method_types=['card'],
            line_items=[{'price': price_id, 'quantity': 1}],
            mode='subscription',
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                'tenant_id': str(tenant.id),
                'plan_id': plan_id,
            },
            subscription_data={
                'metadata': {
                    'tenant_id': str(tenant.id),
                    'plan_id': plan_id,
                },
            },
        )
        return checkout.url
    except stripe.error.StripeError as e:
        logger.error(f"Checkout session creation failed: {e}")
        return None


def create_customer_portal_session(tenant, return_url):
    """Create a Stripe customer portal session for managing subscription."""
    customer_id = get_or_create_customer(tenant)
    if not customer_id:
        return None

    try:
        portal = stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url=return_url,
        )
        return portal.url
    except stripe.error.StripeError as e:
        logger.error(f"Portal session creation failed: {e}")
        return None


def handle_webhook_event(payload, sig_header):
    """
    Process a Stripe webhook event.
    Returns (status, message) tuple.
    """
    from .models import Subscription
    from tenant_manager.models import Tenant

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except (ValueError, stripe.error.SignatureVerificationError) as e:
        logger.warning(f"Invalid webhook signature: {e}")
        return ('invalid', str(e))

    event_type = event.get('type', '')
    event_data = event.get('data', {}).get('object', {})

    logger.info(f"Stripe webhook received: {event_type}")

    if event_type == 'checkout.session.completed':
        metadata = event_data.get('metadata', {})
        tenant_id = metadata.get('tenant_id')
        plan_id = metadata.get('plan_id', 'free')
        subscription_id = event_data.get('subscription', '')

        if tenant_id:
            try:
                tenant = Tenant.objects.get(id=tenant_id)
                sub, _ = Subscription.objects.get_or_create(
                    tenant=tenant,
                    defaults={
                        'plan': plan_id,
                        'status': 'active',
                        'stripe_subscription_id': subscription_id,
                    },
                )
                if subscription_id:
                    sub.stripe_subscription_id = subscription_id
                sub.plan = plan_id
                sub.status = 'active'
                sub.save()

                # Update tenant plan and quota
                tenant.plan = plan_id
                tenant.monthly_message_quota = PLAN_QUOTA_MAP.get(plan_id, 500)
                tenant.save(update_fields=['plan', 'monthly_message_quota'])

                logger.info(f"Tenant {tenant_id} upgraded to {plan_id}")
            except Tenant.DoesNotExist:
                logger.warning(f"Webhook: tenant not found: {tenant_id}")

    elif event_type == 'customer.subscription.updated':
        subscription_id = event_data.get('id', '')
        status = event_data.get('status', '')
        metadata = event_data.get('metadata', {})
        tenant_id = metadata.get('tenant_id')

        try:
            # Look up subscription by stripe_subscription_id or tenant_id
            sub = None
            if subscription_id:
                sub = Subscription.objects.filter(
                    stripe_subscription_id=subscription_id
                ).first()
            if not sub and tenant_id:
                sub = Subscription.objects.filter(
                    tenant_id=tenant_id
                ).first()

            if sub:
                sub.status = status
                if event_data.get('current_period_end'):
                    import datetime
                    sub.period_end = timezone.make_aware(
                        datetime.datetime.fromtimestamp(
                            event_data['current_period_end'],
                            tz=datetime.timezone.utc,
                        )
                    )
                sub.save()
                logger.info(
                    f"Subscription {subscription_id} updated to status={status}"
                )
        except Exception as e:
            logger.error(f"Failed to update subscription: {e}")

    elif event_type == 'customer.subscription.deleted':
        subscription_id = event_data.get('id', '')
        try:
            sub = Subscription.objects.filter(
                stripe_subscription_id=subscription_id
            ).first()
            if sub:
                sub.status = 'canceled'
                sub.save(update_fields=['status'])
                # Downgrade tenant to free
                tenant = sub.tenant
                tenant.plan = 'free'
                tenant.monthly_message_quota = 500
                tenant.save(update_fields=['plan', 'monthly_message_quota'])
                logger.info(f"Tenant {tenant.id} downgraded to free")
        except Exception as e:
            logger.error(f"Failed to process subscription deletion: {e}")

    elif event_type == 'invoice.payment_failed':
        subscription_id = event_data.get('subscription', '')
        try:
            sub = Subscription.objects.filter(
                stripe_subscription_id=subscription_id
            ).first()
            if sub:
                sub.status = 'past_due'
                sub.save(update_fields=['status'])
                logger.warning(
                    f"Payment failed for subscription {subscription_id}"
                )
        except Exception as e:
            logger.error(f"Failed to mark subscription past_due: {e}")

    return ('ok', f'Processed {event_type}')
