import { useState, useEffect } from 'react';
import * as api from '../../api';

function formatDate(iso: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatDateTime(iso: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

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

function UsageBar({ used, quota, percent }: { used: number; quota: number; percent: number }) {
  const color = percent > 80 ? '#ef4444' : percent > 50 ? '#f59e0b' : '#10b981';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, backgroundColor: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(percent, 100)}%`, height: '100%', backgroundColor: color, borderRadius: 3, transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontSize: '0.75rem', color: '#64748b', whiteSpace: 'nowrap' }}>
        {used.toLocaleString()} / {quota.toLocaleString()}
      </span>
    </div>
  );
}

/* ── Tenant Detail Modal ── */
function TenantDetailModal({ tenantId, onClose }: { tenantId: string; onClose: () => void }) {
  const [detail, setDetail] = useState<api.TenantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getSuperAdminTenantDetail(tenantId)
      .then(setDetail)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [tenantId]);

  return (
    <div className="modal-overlay" onClick={onClose} style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      padding: '1rem',
    }}>
      <div className="card" onClick={(e) => e.stopPropagation()} style={{
        maxWidth: 800, width: '100%', maxHeight: '90vh', overflow: 'auto',
        padding: '2rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            {loading ? (
              <h3>Loading…</h3>
            ) : error ? (
              <div style={{ color: '#ef4444' }}>{error}</div>
            ) : detail ? (
              <>
                <h3 style={{ margin: 0 }}>{detail.name}</h3>
                <p style={{ margin: '0.25rem 0 0', color: '#64748b' }}>{detail.email} · <span style={planBadgeStyle(detail.plan)}>{detail.plan}</span></p>
              </>
            ) : null}
          </div>
          <button className="btn btn-sm btn-secondary" onClick={onClose}>✕</button>
        </div>

        {detail && (
          <>
            {/* Summary stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{detail.total_messages.toLocaleString()}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Total Messages</div>
              </div>
              <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{detail.total_tokens.toLocaleString()}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Total Tokens</div>
              </div>
              <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>${detail.total_cost.toFixed(4)}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Total Cost</div>
              </div>
              <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{detail.current_month_usage.toLocaleString()}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>This Month</div>
              </div>
            </div>

            {/* Monthly usage bar */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ marginBottom: '0.5rem', fontSize: '0.875rem', color: '#334155' }}>Monthly Quota Usage</h4>
              <UsageBar used={detail.current_month_usage} quota={detail.monthly_quota} percent={detail.usage_percent} />
            </div>

            {/* Daily usage (last 7 days) */}
            {detail.daily_usage.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ marginBottom: '0.5rem', fontSize: '0.875rem', color: '#334155' }}>Daily Usage (Last 7 Days)</h4>
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Messages</th>
                        <th>Tokens</th>
                        <th>Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.daily_usage.map((d) => (
                        <tr key={d.date}>
                          <td>{formatDate(d.date)}</td>
                          <td>{d.messages.toLocaleString()}</td>
                          <td>{d.tokens.toLocaleString()}</td>
                          <td>${d.cost.toFixed(4)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Monthly history */}
            {detail.monthly_usage.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ marginBottom: '0.5rem', fontSize: '0.875rem', color: '#334155' }}>Monthly Usage History</h4>
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Period</th>
                        <th>Messages</th>
                        <th>Tokens</th>
                        <th>Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.monthly_usage.map((m) => (
                        <tr key={`${m.year}-${m.month}`}>
                          <td>{new Date(m.year, m.month - 1).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}</td>
                          <td>{m.total_messages.toLocaleString()}</td>
                          <td>{m.total_tokens.toLocaleString()}</td>
                          <td>${parseFloat(m.total_cost_usd).toFixed(4)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* API Keys */}
            {detail.api_keys.length > 0 && (
              <div>
                <h4 style={{ marginBottom: '0.5rem', fontSize: '0.875rem', color: '#334155' }}>API Keys ({detail.api_keys.length})</h4>
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Prefix</th>
                        <th>Status</th>
                        <th>Last Used</th>
                        <th>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.api_keys.map((ak) => (
                        <tr key={ak.id}>
                          <td>{ak.name}</td>
                          <td style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>{ak.prefix}***</td>
                          <td>
                            <span style={{ color: ak.is_active ? '#10b981' : '#ef4444', fontSize: '0.875rem' }}>
                              {ak.is_active ? 'Active' : 'Revoked'}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.8125rem', color: '#64748b' }}>{formatDateTime(ak.last_used_at)}</td>
                          <td style={{ fontSize: '0.8125rem', color: '#64748b' }}>{formatDate(ak.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ── Main Tenants Page ── */
export default function SuperAdminTenants() {
  const [tenants, setTenants] = useState<api.SuperAdminTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);

  const fetchTenants = () => {
    setLoading(true);
    setError(null);
    api.getSuperAdminTenants()
      .then(setTenants)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const handleToggle = async (tenant: api.SuperAdminTenant) => {
    setTogglingId(tenant.id);
    setError(null);
    try {
      const res = await api.toggleSuperAdminTenant(tenant.id, !tenant.is_active);
      setTenants((prev) =>
        prev.map((t) =>
          t.id === tenant.id ? { ...t, is_active: res.is_active } : t,
        ),
      );
    } catch (err: any) {
      setError(err.message);
    } finally {
      setTogglingId(null);
    }
  };

  if (loading && tenants.length === 0) {
    return (
      <div className="page" style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <span>Loading tenants…</span>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>Tenants</h2>
        <p className="page-subtitle">
          {tenants.length} registered {tenants.length === 1 ? 'tenant' : 'tenants'} on the platform
        </p>
      </div>

      {error && (
        <div className="form-error" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {tenants.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
          No tenants registered yet.
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Name / Email</th>
                <th>Plan</th>
                <th>Monthly Usage</th>
                <th>Messages</th>
                <th>API Keys</th>
                <th>Last Active</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant) => (
                <tr key={tenant.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{tenant.name}</div>
                    <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>{tenant.email}</div>
                  </td>
                  <td>
                    <span style={planBadgeStyle(tenant.plan)}>{tenant.plan}</span>
                  </td>
                  <td style={{ minWidth: 180 }}>
                    <div style={{ marginBottom: 2, fontSize: '0.75rem', color: '#64748b' }}>
                      {tenant.usage_percent}% of quota
                    </div>
                    <UsageBar
                      used={tenant.current_month_usage}
                      quota={tenant.monthly_quota}
                      percent={tenant.usage_percent}
                    />
                  </td>
                  <td style={{ fontWeight: 600 }}>{tenant.total_messages.toLocaleString()}</td>
                  <td style={{ textAlign: 'center' }}>{tenant.api_key_count}</td>
                  <td style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                    {formatDateTime(tenant.last_active)}
                  </td>
                  <td>
                    <span
                      className={`badge ${tenant.is_active ? 'badge-success' : 'badge-error'}`}
                      style={{
                        backgroundColor: tenant.is_active ? '#10b98120' : '#ef444420',
                        color: tenant.is_active ? '#10b981' : '#ef4444',
                      }}
                    >
                      {tenant.is_active ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => setSelectedTenantId(tenant.id)}
                        title="View Details"
                      >
                        📋
                      </button>
                      <button
                        className={`btn btn-sm ${tenant.is_active ? 'btn-danger-outline' : 'btn-primary'}`}
                        onClick={() => handleToggle(tenant)}
                        disabled={togglingId === tenant.id}
                      >
                        {togglingId === tenant.id
                          ? '…'
                          : tenant.is_active
                            ? 'Suspend'
                            : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tenant Detail Modal */}
      {selectedTenantId && (
        <TenantDetailModal
          tenantId={selectedTenantId}
          onClose={() => setSelectedTenantId(null)}
        />
      )}
    </div>
  );
}
