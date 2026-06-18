import { useState, useEffect } from 'react';
import * as api from '../../api';
import StatsCard from '../../components/StatsCard';

const planColors: Record<string, string> = {
  free: '#10b981',
  starter: '#f59e0b',
  pro: '#6366f1',
  enterprise: '#ec4899',
};

const planBadgeStyle = (plan: string) => ({
  backgroundColor: (planColors[plan] || '#6366f1') + '20',
  color: planColors[plan] || '#6366f1',
  padding: '2px 8px',
  borderRadius: '4px',
  fontSize: '0.75rem',
  fontWeight: 600,
  textTransform: 'capitalize' as const,
});

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: '50%',
        backgroundColor: active ? '#10b981' : '#ef4444',
        marginRight: 4,
      }}
    />
  );
}

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

  return (
    <div className="page">
      <div className="page-header">
        <h2>Platform Overview</h2>
        <p className="page-subtitle">Monitor all tenants and platform usage</p>
      </div>

      {/* Stats Cards */}
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
        <StatsCard
          title="API Keys Issued"
          value={stats.total_api_keys.toLocaleString()}
          subtitle="Total across all tenants"
          icon="🔑"
          color="#8b5cf6"
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

      {/* Recent Registrations */}
      {stats.recent_tenants.length > 0 && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <h3 style={{ marginBottom: '0.75rem' }}>Recent Registrations</h3>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Registered</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_tenants.map((t) => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 500 }}>{t.name}</td>
                    <td style={{ color: '#64748b' }}>{t.email}</td>
                    <td><span style={planBadgeStyle(t.plan)}>{t.plan}</span></td>
                    <td>
                      <StatusBadge active={t.is_active} />
                      {t.is_active ? 'Active' : 'Suspended'}
                    </td>
                    <td style={{ color: '#64748b', fontSize: '0.875rem' }}>
                      {new Date(t.created_at).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Top Tenants by Usage */}
      {stats.top_tenants.length > 0 && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <h3 style={{ marginBottom: '0.75rem' }}>Top Tenants by Message Count</h3>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Plan</th>
                  <th>Messages</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.top_tenants.map((t, i) => (
                  <tr key={t.id}>
                    <td style={{ color: '#64748b', width: 30 }}>{i + 1}</td>
                    <td style={{ fontWeight: 500 }}>{t.name}</td>
                    <td><span style={planBadgeStyle(t.plan)}>{t.plan}</span></td>
                    <td style={{ fontWeight: 600 }}>{t.total_messages.toLocaleString()}</td>
                    <td>
                      <StatusBadge active={t.is_active} />
                      {t.is_active ? 'Active' : 'Suspended'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
