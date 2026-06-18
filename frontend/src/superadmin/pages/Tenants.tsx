import { useState, useEffect } from 'react';
import * as api from '../../api';

export default function SuperAdminTenants() {
  const [tenants, setTenants] = useState<api.SuperAdminTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

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

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const planColors: Record<string, string> = {
    free: '#10b981',
    starter: '#f59e0b',
    pro: '#6366f1',
    enterprise: '#ec4899',
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
                <th>Name</th>
                <th>Plan</th>
                <th>Messages</th>
                <th>Status</th>
                <th>Registered</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant) => (
                <tr key={tenant.id}>
                  <td style={{ fontWeight: 500 }}>{tenant.name}</td>
                  <td>
                    <span
                      className="badge"
                      style={{
                        backgroundColor: (planColors[tenant.plan] || '#6366f1') + '20',
                        color: planColors[tenant.plan] || '#6366f1',
                        textTransform: 'capitalize',
                      }}
                    >
                      {tenant.plan}
                    </span>
                  </td>
                  <td>{tenant.total_messages.toLocaleString()}</td>
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
                  <td style={{ color: '#64748b', fontSize: '0.875rem' }}>
                    {formatDate(tenant.created_at)}
                  </td>
                  <td>
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
