import { useState, useEffect } from 'react';
import * as api from '../api';
import ConfirmDialog from '../components/ConfirmDialog';

export default function RoutesPage() {
  const [routes, setRoutes] = useState<api.RouteEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ path: '', name: '', description: '', allowed_roles: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fetchRoutes = () => {
    setLoading(true);
    api.getRoutes().then(setRoutes).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchRoutes(); }, []);

  const resetForm = () => {
    setForm({ path: '', name: '', description: '', allowed_roles: '' });
    setEditingId(null);
    setError('');
  };

  const openEdit = (r: api.RouteEntry) => {
    setForm({
      path: r.path,
      name: r.name,
      description: r.description,
      allowed_roles: (r.allowed_roles || []).join(', '),
    });
    setEditingId(r.id);
  };

  const handleSave = async () => {
    if (!form.path || !form.name) {
      setError('Path and name are required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const data = {
        path: form.path,
        name: form.name,
        description: form.description,
        allowed_roles: form.allowed_roles.split(',').map((s) => s.trim()).filter(Boolean),
      };
      if (editingId) {
        await api.updateRoute(editingId, data);
      } else {
        await api.createRoute(data);
      }
      resetForm();
      fetchRoutes();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteRoute(id);
      setRoutes((prev) => prev.filter((r) => r.id !== id));
    } catch {
      // ignore
    }
    setConfirmDelete(null);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>Routes</h2>
        <p>Manage routes the chatbot uses to suggest navigation.</p>
      </div>

      <div className="card">
        <h3>{editingId ? 'Edit Route' : 'Add Route'}</h3>
        <div className="form-grid">
          <div className="form-group">
            <label>Path *</label>
            <input
              type="text"
              placeholder="/dashboard"
              value={form.path}
              onChange={(e) => setForm({ ...form, path: e.target.value })}
              className="input"
            />
          </div>
          <div className="form-group">
            <label>Name *</label>
            <input
              type="text"
              placeholder="Dashboard"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input"
            />
          </div>
          <div className="form-group form-group-wide">
            <label>Description</label>
            <input
              type="text"
              placeholder="Main admin overview page"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input"
            />
          </div>
          <div className="form-group form-group-wide">
            <label>Allowed Roles</label>
            <input
              type="text"
              placeholder="admin, editor, viewer"
              value={form.allowed_roles}
              onChange={(e) => setForm({ ...form, allowed_roles: e.target.value })}
              className="input"
            />
            <span className="form-hint">Comma-separated role names</span>
          </div>
        </div>
        {error && <div className="form-error">{error}</div>}
        <div className="form-actions">
          {editingId && (
            <button className="btn btn-secondary" onClick={resetForm}>
              Cancel
            </button>
          )}
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : editingId ? 'Update Route' : 'Add Route'}
          </button>
        </div>
      </div>

      <div className="card">
        <h3>All Routes ({routes.length})</h3>
        {loading ? (
          <p className="text-muted">Loading…</p>
        ) : routes.length === 0 ? (
          <p className="text-muted">No routes yet. Add one above.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Path</th>
                  <th>Roles</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {routes.map((r) => (
                  <tr key={r.id}>
                    <td className="td-name">{r.name}</td>
                    <td><code className="code-sm">{r.path}</code></td>
                    <td>
                      {(r.allowed_roles || []).length > 0
                        ? (r.allowed_roles || []).map((role) => (
                            <span key={role} className="badge badge-role">
                              {role}
                            </span>
                          ))
                        : <span className="text-muted">Any</span>}
                    </td>
                    <td>
                      <span className={`badge ${r.is_active ? 'badge-active' : 'badge-inactive'}`}>
                        {r.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="td-actions">
                      <button className="btn btn-sm" onClick={() => openEdit(r)}>
                        ✏️
                      </button>
                      <button
                        className="btn btn-sm btn-danger-outline"
                        onClick={() => setConfirmDelete(r.id)}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete Route"
        message="This route will be deactivated and the chatbot will stop suggesting it."
        confirmLabel="Delete"
        destructive
        onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
