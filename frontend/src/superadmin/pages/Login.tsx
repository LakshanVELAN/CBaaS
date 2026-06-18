import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useSuperAdminAuth } from '../auth';
import { isSuperAdminAuthenticated } from '../../api';
import { Shield, Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function SuperAdminLogin() {
  const { login, error } = useSuperAdminAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  if (isSuperAdminAuthenticated()) {
    return <Navigate to="/superadmin/dashboard" replace />;
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
      navigate('/superadmin/dashboard', { replace: true });
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
          <div className="login-logo login-logo-admin">
            <Shield size={28} color="#fff" />
          </div>
          <h1 className="login-title">Admin Panel</h1>
          <p className="login-subtitle">Super admin login for platform management</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {(localError || error) && (
            <div className="form-error">
              {localError || error}
            </div>
          )}

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                  color: '#94a3b8', display: 'flex', alignItems: 'center',
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={submitting}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            {submitting ? 'Signing in…' : 'Sign In'}
            {!submitting && <ArrowRight size={16} />}
          </button>
        </form>

        <div className="login-footer">
          <a href="/login" className="link" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            ← Back to tenant login
          </a>
        </div>
      </div>
    </div>
  );
}
