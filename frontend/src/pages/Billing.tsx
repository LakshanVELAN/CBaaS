import { useState, useEffect } from 'react';
import { useAuth } from '../auth';
import * as api from '../api';

export default function Billing() {
  const { tenant } = useAuth();
  const [plans, setPlans] = useState<api.Plan[]>([]);
  const [subscription, setSubscription] = useState<api.SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getSubscriptionStatus();
        setPlans(data.plans);
        setSubscription(data.subscription);
      } catch {
        // Fallback: just get plans
        try {
          const data = await api.getPlans();
          setPlans(data.plans);
        } catch {
          // ignore
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleUpgrade = async (planId: string) => {
    if (planId === tenant?.plan) return;
    setActionLoading(planId);
    setError('');
    setSuccess('');
    try {
      const res = await api.createCheckout(planId);
      if (res.url) {
        window.open(res.url, '_blank');
        setSuccess(`Redirected to Stripe checkout for ${planId} plan.`);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handlePortal = async () => {
    setActionLoading('portal');
    setError('');
    try {
      const res = await api.getCustomerPortal();
      if (res.url) {
        window.open(res.url, '_blank');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const currentPlan = plans.find((p) => p.id === subscription?.plan || p.id === tenant?.plan);
  const isPaid = subscription?.plan && subscription.plan !== 'free';

  if (loading) {
    return (
      <div className="page">
        <p className="text-muted">Loading plans…</p>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>Billing & Plans</h2>
        <p>Manage your subscription and usage plan.</p>
      </div>

      {/* Current Plan Card */}
      {currentPlan && (
        <div className="card current-plan-card">
          <div className="current-plan-header">
            <div>
              <h3>Current Plan</h3>
              <p className="plan-name">
                <span className={`plan-badge plan-${currentPlan.id}`}>
                  {currentPlan.name}
                </span>
              </p>
            </div>
            <div className="current-plan-price">{currentPlan.price_display}</div>
          </div>
          <div className="current-plan-details">
            <div className="detail-row">
              <span className="detail-label">Status</span>
              <span className={`badge ${subscription?.status === 'active' ? 'badge-active' : 'badge-inactive'}`}>
                {subscription?.status || 'Active'}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Messages</span>
              <span>{subscription?.messages_limit?.toLocaleString() || '-'} / month</span>
            </div>
            {subscription?.period_end && (
              <div className="detail-row">
                <span className="detail-label">Period End</span>
                <span>{new Date(subscription.period_end).toLocaleDateString()}</span>
              </div>
            )}
          </div>
          {isPaid && (
            <button
              className="btn btn-secondary"
              onClick={handlePortal}
              disabled={actionLoading === 'portal'}
              style={{ marginTop: 12 }}
            >
              {actionLoading === 'portal' ? 'Opening…' : 'Manage Subscription →'}
            </button>
          )}
        </div>
      )}

      {error && <div className="form-message error">{error}</div>}
      {success && <div className="form-message success">{success}</div>}

      {/* Plan Comparison */}
      <h3 className="section-title" style={{ marginBottom: 16 }}>Compare Plans</h3>
      <div className="plans-grid">
        {plans.map((plan) => {
          const isCurrent = plan.id === subscription?.plan || plan.id === tenant?.plan;
          return (
            <div
              key={plan.id}
              className={`plan-card ${isCurrent ? 'plan-card-current' : ''}`}
            >
              {isCurrent && <div className="plan-card-badge">Current</div>}
              <div className="plan-card-header">
                <h3 className="plan-card-name">{plan.name}</h3>
                <div className="plan-card-price">{plan.price_display}</div>
              </div>
              <ul className="plan-card-features">
                {plan.features.map((f, i) => (
                  <li key={i} className="plan-card-feature">
                    <span className="feature-check">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                className={`btn ${isCurrent ? 'btn-secondary' : 'btn-primary'} btn-block`}
                disabled={isCurrent || actionLoading === plan.id}
                onClick={() => handleUpgrade(plan.id)}
              >
                {isCurrent
                  ? 'Current Plan'
                  : actionLoading === plan.id
                    ? 'Redirecting…'
                    : plan.price === 0
                      ? 'Get Started'
                      : `Upgrade to ${plan.name}`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
