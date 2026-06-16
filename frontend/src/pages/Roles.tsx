import { useState, useEffect } from 'react';
import * as api from '../api';
import ConfirmDialog from '../components/ConfirmDialog';

export default function RolesPage() {
  const [roles, setRoles] = useState<api.RoleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', display_name: '', description: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fetchRoles = () => {
    setLoading(true);
    api.getRoles().then(setRoles).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchRoles(); }, []);

  const resetForm = () => {
    setForm({ name: '', display_name: '', description: '' });
    setEditingId(null);
    setError('');
  };

  const openEdit = (r: api.RoleEntry) => {
    setForm({ name: r.name, display_name: r.display_name, description: r.description });
    setEditingId(r.id);
  };

  const handleSave = async () => {
    if (!form.name) {
      setError('Name is required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const data = {
        name: form.name,
        display_name: form.display_name || form.name,
        description: form.description,
      };
      if (editingId) {
        await api.updateRole(editingId, data);
      } else {
        await api.createRole(data);
      }
      resetForm();
      fetchRoles();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteRole(id);
      setRoles((prev) => prev.filter((r) => r.id !== id));
    } catch {
      // ignore
    }
    setConfirmDelete(null);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>Roles</h2>
        <p>Define user roles and their descriptions for the chatbot.</p>
      </div>

      <div className="card">
        <h3>{editingId ? 'Edit Role' : 'Add Role'}</h3>
        <div className="form-grid">
          <div className="form-group">
            <label>Role ID *</label>
            <input
              type="text"
              placeholder="admin"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input"
              disabled={!!editingId}
            />
            <span className="form-hint">Unique identifier used in API</span>
          </div>
          <div className="form-group">
            <label>Display Name</label>
            <input
              type="text"
              placeholder="Administrator"
              value={form.display_name}
              onChange={(e) => setForm({ ...form, display_name: e.target.value })}
              className="input"
            />
          </div>
          <div className="form-group form-group-wide">
            <label>Description</label>
            <textarea
              placeholder="Full system access with all administrative privileges"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input textarea"
              rows={3}
            />
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
            {saving ? 'Saving…' : editingId ? 'Update Role' : 'Add Role'}
          </button>
        </div>
      </div>

      <div className="card">
        <h3>All Roles ({roles.length})</h3>
        {loading ? (
          <p className="text-muted">Loading…</p>
        ) : roles.length === 0 ? (
          <p className="text-muted">No roles yet. Add one above.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Role ID</th>
                  <th>Display Name</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {roles.map((r) => (
                  <tr key={r.id}>
                    <td><code className="code-sm">{r.name}</code></td>
                    <td className="td-name">{r.display_name}</td>
                    <td className="td-desc">{r.description || <span className="text-muted">—</span>}</td>
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
        title="Delete Role"
        message="This role will be deactivated. Routes and permissions referencing it will still exist."
        confirmLabel="Delete"
        destructive
        onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
