import { useState, useEffect } from 'react';
import * as api from '../api';
import ConfirmDialog from '../components/ConfirmDialog';
import { KeyRound, Copy, Check } from 'lucide-react';

export default function ApiKeys() {
  const [keys, setKeys] = useState<api.ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null);

  useEffect(() => {
    api.getApiKeys().then(setKeys).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    setError('');
    try {
      const res = await api.createApiKey(newName.trim());
      setRevealedKey(res.raw_key);
      setNewName('');
      // Refresh list
      const updated = await api.getApiKeys();
      setKeys(updated);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      await api.revokeApiKey(id);
      setKeys((prev) => prev.filter((k) => k.id !== id));
    } catch {
      // ignore
    }
    setConfirmRevoke(null);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>API Keys</h2>
        <p>Manage API keys for widget integration.</p>
      </div>

      <div className="card create-key-card">
        <h3>Generate New Key</h3>
        <div className="create-key-row">
          <input
            type="text"
            placeholder="e.g. Production Widget"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="input"
          />
          <button
            className="btn btn-primary"
            onClick={handleCreate}
            disabled={creating || !newName.trim()}
          >
            {creating ? 'Generating…' : 'Generate Key'}
          </button>
        </div>
        {error && <div className="form-error">{error}</div>}
      </div>

      {revealedKey && (
        <div className="card key-reveal-card">
          <div className="key-reveal-content">
            <span className="key-reveal-icon"><KeyRound size={24} color="#6366f1" /></span>
            <div>
              <strong>Key Generated!</strong>
              <p>Save this key — it will never be shown again.</p>
              <div className="key-display">
                <code>{revealedKey}</code>
                <button
                  className="btn btn-sm"
                  onClick={() => {
                    navigator.clipboard.writeText(revealedKey);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            </div>
            <button className="btn btn-secondary" onClick={() => setRevealedKey(null)}>
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="card">
        <h3>Your API Keys</h3>
        {loading ? (
          <p className="text-muted">Loading…</p>
        ) : keys.length === 0 ? (
          <p className="text-muted">No API keys yet. Generate one above.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Key Prefix</th>
                  <th>Status</th>
                  <th>Last Used</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {keys.map((key) => (
                  <tr key={key.id}>
                    <td className="td-name">{key.name}</td>
                    <td><code className="code-sm">{key.prefix}•••</code></td>
                    <td>
                      <span className={`badge ${key.is_active ? 'badge-active' : 'badge-inactive'}`}>
                        {key.is_active ? 'Active' : 'Revoked'}
                      </span>
                    </td>
                    <td className="text-muted">
                      {key.last_used_at
                        ? new Date(key.last_used_at).toLocaleDateString()
                        : 'Never'}
                    </td>
                    <td className="text-muted">
                      {new Date(key.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      {key.is_active && (
                        <button
                          className="btn btn-sm btn-danger-outline"
                          onClick={() => setConfirmRevoke(key.id)}
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!confirmRevoke}
        title="Revoke API Key"
        message="This key will stop working immediately. Widgets using this key will lose access. Are you sure?"
        confirmLabel="Revoke"
        destructive
        onConfirm={() => confirmRevoke && handleRevoke(confirmRevoke)}
        onCancel={() => setConfirmRevoke(null)}
      />
    </div>
  );
}
