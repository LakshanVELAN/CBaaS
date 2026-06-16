import { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '../auth';
import * as api from '../api';

export default function Settings() {
  const { tenant, refresh } = useAuth();
  const [name, setName] = useState('');
  const [allowedOrigins, setAllowedOrigins] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (tenant) {
      setName(tenant.name);
      setAllowedOrigins(tenant.allowed_origins || '');
      setCustomPrompt(tenant.custom_system_prompt_override || '');
    }
  }, [tenant]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await api.updateProfile({
        name,
        allowed_origins: allowedOrigins,
        custom_system_prompt_override: customPrompt,
      });
      await refresh();
      setMessage({ type: 'success', text: 'Settings saved successfully.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>Settings</h2>
        <p>Manage your tenant account and chatbot configuration.</p>
      </div>

      <form onSubmit={handleSave}>
        <div className="card">
          <h3>Tenant Profile</h3>
          <div className="form-grid">
            <div className="form-group form-group-wide">
              <label>Organization Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
              />
            </div>
            <div className="form-group">
              <label>Plan</label>
              <div className="input-plain">
                <span className={`plan-badge plan-${tenant?.plan || 'free'}`}>
                  {(tenant?.plan || 'free').charAt(0).toUpperCase() + (tenant?.plan || 'free').slice(1)}
                </span>
              </div>
            </div>
            <div className="form-group">
              <label>Monthly Quota</label>
              <div className="input-plain">
                <span className="text-muted">
                  {(tenant?.monthly_message_quota || 0).toLocaleString()} messages
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3>Allowed CORS Origins</h3>
          <p className="card-desc">
            One origin per line. Only requests from these origins will be accepted.
            Leave empty to allow all origins (dev only).
          </p>
          <div className="form-group form-group-wide">
            <textarea
              value={allowedOrigins}
              onChange={(e) => setAllowedOrigins(e.target.value)}
              className="input textarea"
              rows={4}
              placeholder="https://mywebsite.com"
            />
          </div>
        </div>

        <div className="card">
          <h3>Custom System Prompt</h3>
          <p className="card-desc">
            Override the default AI system prompt for your chatbot. Leave empty to use the default.
          </p>
          <div className="form-group form-group-wide">
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="input textarea"
              rows={6}
              placeholder="You are a helpful assistant for my website..."
            />
          </div>
        </div>

        {message && (
          <div className={`form-message ${message.type}`}>
            {message.type === 'success' ? '✅ ' : '❌ '}
            {message.text}
          </div>
        )}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
