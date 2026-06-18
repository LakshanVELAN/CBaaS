import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useSuperAdminAuth } from '../auth';
import { isSuperAdminAuthenticated } from '../../api';

export default function SuperAdminLogin() {
  const { login, error } = useSuperAdminAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  if (isSuperAdminAuthenticated()) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!email || !password) {
      setLocalError('Email and password are required.');
      return;
    }

    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/admin/dashboard', { replace: true });
    } catch (err: any) {
      setLocalError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <span style={{ fontSize: '2rem' }}>⚙️</span>
          </div>
          <h1>Admin Panel</h1>
          <p className="login-desc">Super admin login for platform management</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {(localError || error) && (
            <div className="form-error">
              {localError || error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="input"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="input"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={submitting}
          >
            {submitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="login-footer">
          <a href="/login" className="link">← Back to tenant login</a>
        </div>
      </div>
    </div>
  );
}
