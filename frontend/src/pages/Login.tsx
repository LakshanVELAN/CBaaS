import { useState, FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth';
import { MessageSquare, KeyRound, Copy, Check, ArrowRight, ArrowLeft, Eye, EyeOff, Sparkles } from 'lucide-react';

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
        {/* Back to Homepage link */}
        <a href="/" className="login-back-link">
          <ArrowLeft size={14} />
          Return to Homepage
        </a>

        {/* Header */}
        <div className="login-header">
          <div className="login-logo">
            <MessageSquare size={24} color="#fff" />
          </div>
          <h1>Chatbot SaaS</h1>
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
            Create Account
          </button>
        </div>

        {/* API Key reveal after registration */}
        {newKey ? (
          <div className="key-reveal">
            <div className="key-reveal-icon">
              <Sparkles size={28} color="#6366f1" />
            </div>
            <h3>Account Created!</h3>
            <p className="key-reveal-desc">
              Your workspace is ready. Save this API key — it will <strong>never</strong> be shown again.
            </p>
            <div className="key-display">
              <code>{newKey}</code>
              <button className="btn btn-secondary btn-sm" onClick={copyKey}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/dashboard')}
              style={{ marginTop: 16, width: '100%' }}
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
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                placeholder="you@company.com"
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
                  placeholder={mode === 'register' ? 'Minimum 8 characters' : 'Enter your password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={mode === 'register' ? 8 : 1}
                  required
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

            {error && <div className="form-error">{error}</div>}

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading}
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
          <div className="login-footer-text">
            {mode === 'login' ? (
              <p>
                Don't have an account?{' '}
                <button onClick={() => { setMode('register'); setError(''); }}>
                  Sign up free
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button onClick={() => { setMode('login'); setError(''); }}>
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
