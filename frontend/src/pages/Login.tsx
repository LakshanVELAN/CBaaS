import { useState, FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth';
import { MessageSquare, KeyRound, Copy, Check, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<'login' | 'register'>(
    searchParams.get('register') === '1' ? 'register' : 'login'
  );
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setNewKey(null);
    try {
      if (mode === 'login') {
        await login(email, password);
        navigate('/dashboard');
      } else {
        const res = await register(name, email, password);
        if (res?.raw_key) {
          setNewKey(res.raw_key);
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const copyKey = () => {
    navigator.clipboard.writeText(newKey || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Header */}
        <div className="login-header">
          <div className="login-logo">
            <MessageSquare size={28} color="#fff" />
          </div>
          <h1 className="login-title">Chatbot SaaS</h1>
          <p className="login-subtitle">
            {mode === 'login'
              ? 'Sign in to your dashboard'
              : 'Create your tenant account'}
          </p>
        </div>

        {/* Tab switcher */}
        <div className="login-tabs">
          <button
            className={`tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setNewKey(null); setError(''); }}
          >
            Sign In
          </button>
          <button
            className={`tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => { setMode('register'); setNewKey(null); setError(''); }}
          >
            Register
          </button>
        </div>

        {/* API Key reveal after registration */}
        {newKey ? (
          <div className="key-reveal">
            <div className="key-reveal-icon">
              <KeyRound size={32} color="#6366f1" />
            </div>
            <h3 style={{ margin: '12px 0 4px', fontSize: '1.1rem', fontWeight: 600 }}>Account Created!</h3>
            <p className="key-reveal-desc">
              Save this API key — it will <strong>never</strong> be shown again.
            </p>
            <div className="key-display">
              <code>{newKey}</code>
              <button className="btn btn-sm" onClick={copyKey}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/dashboard')}
              style={{ marginTop: 16, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              Go to Dashboard <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="login-form">
            {mode === 'register' && (
              <div className="form-group">
                <label htmlFor="name">Organization Name</label>
                <input
                  id="name"
                  type="text"
                  placeholder="Acme Corp"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={mode === 'register' ? 'Min 8 characters' : 'Your password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={mode === 'register' ? 8 : 1}
                  required
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

            {error && <div className="form-error">{error}</div>}

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              {loading
                ? 'Please wait…'
                : mode === 'login'
                  ? 'Sign In'
                  : 'Create Account'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>
        )}

        {/* Footer */}
        {!newKey && (
          <div className="login-footer" style={{ marginTop: '1.25rem', textAlign: 'center' }}>
            {mode === 'login' ? (
              <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
                Don't have an account?{' '}
                <button
                  onClick={() => { setMode('register'); setError(''); }}
                  style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontWeight: 500, fontSize: '0.875rem', padding: 0 }}
                >
                  Sign up free
                </button>
              </p>
            ) : (
              <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
                Already have an account?{' '}
                <button
                  onClick={() => { setMode('login'); setError(''); }}
                  style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontWeight: 500, fontSize: '0.875rem', padding: 0 }}
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
