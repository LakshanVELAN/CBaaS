import { useState, useEffect } from 'react';
import * as api from '../../api';
import StatsCard from '../../components/StatsCard';

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<api.PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getSuperAdminStats()
      .then(setStats)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="page" style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <span>Loading stats…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="card" style={{ padding: '2rem', color: '#ef4444' }}>
          Failed to load stats: {error}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const planColors: Record<string, string> = {
    free: '#10b981',
    starter: '#f59e0b',
    pro: '#6366f1',
    enterprise: '#ec4899',
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>Platform Overview</h2>
        <p className="page-subtitle">Monitor all tenants and platform usage</p>
      </div>

      <div className="dashboard-grid">
        <StatsCard
          title="Total Tenants"
          value={stats.total_tenants.toLocaleString()}
          subtitle={`${stats.active_tenants} active · ${stats.suspended_tenants} suspended`}
          icon="🏢"
          color="#6366f1"
        />
        <StatsCard
          title="New Tenants (30d)"
          value={stats.recent_tenants_30d.toLocaleString()}
          subtitle="Registered in last 30 days"
          icon="📈"
          color="#10b981"
        />
        <StatsCard
          title="Total Messages"
          value={stats.total_messages.toLocaleString()}
          subtitle="Across all tenants"
          icon="💬"
          color="#06b6d4"
        />
        <StatsCard
          title="Tokens Used"
          value={stats.total_tokens.toLocaleString()}
          subtitle={`≈ $${stats.total_cost.toFixed(4)} total cost`}
          icon="🔤"
          color="#f59e0b"
        />
      </div>

      {/* Plan Breakdown */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Plan Breakdown</h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {Object.entries(stats.plan_breakdown).map(([plan, count]) => (
            <div
              key={plan}
              className="card"
              style={{
                flex: '1',
                minWidth: '140px',
                textAlign: 'center',
                padding: '1.25rem',
              }}
            >
              <div
                style={{
                  fontSize: '2rem',
                  fontWeight: 700,
                  color: planColors[plan] || '#6366f1',
                }}
              >
                {count}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#64748b', textTransform: 'capitalize', marginTop: '0.25rem' }}>
                {plan}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ marginTop: '2rem' }}>
        <h3 style={{ marginBottom: '0.75rem' }}>Quick Actions</h3>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <a href="/superadmin/tenants" className="btn btn-primary">
            🏢 Manage Tenants
          </a>
        </div>
      </div>
    </div>
  );
}
