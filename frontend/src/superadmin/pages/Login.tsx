import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useSuperAdminAuth } from '../auth';
import { isSuperAdminAuthenticated } from '../../api';
import { Shield, Eye, EyeOff, ArrowRight, ArrowLeft } from 'lucide-react';

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
        {/* Back to Homepage link */}
        <a href="/" className="login-back-link">
          <ArrowLeft size={14} />
          Return to Homepage
        </a>

        <div className="login-header">
          <div className="login-logo" style={{ background: 'linear-gradient(135deg, #1e293b, #334155)' }}>
            <Shield size={24} color="#fff" />
          </div>
          <h1>Admin Panel</h1>
          <p className="login-subtitle">Super admin login for platform management</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {(localError || error) && (
            <div className="form-error">
              {localError || error}
            </div>
          )}

          <div className="form-group">
            <label>Email address</label>
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
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingRight: '44px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', padding: '6px',
                  color: '#94a3b8', display: 'flex', alignItems: 'center',
                  borderRadius: '6px', transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f3f4f6')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={submitting}
          >
            {submitting ? 'Signing in…' : 'Sign In'}
            {!submitting && <ArrowRight size={16} />}
          </button>
        </form>

        <div className="login-footer-text">
          <p>
            Need tenant access?{' '}
            <a href="/login" style={{ color: '#6366f1', fontWeight: 600, textDecoration: 'none' }}>
              Go to user portal
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
