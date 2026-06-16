import { useState, FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth';

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
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);

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

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">💬</div>
          <h1>Chatbot SaaS</h1>
          <p className="login-subtitle">
            {mode === 'login'
              ? 'Sign in to your dashboard'
              : 'Create your tenant account'}
          </p>
        </div>

        <div className="login-tabs">
          <button
            className={`tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setNewKey(null); }}
          >
            Sign In
          </button>
          <button
            className={`tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => { setMode('register'); setNewKey(null); }}
          >
            Register
          </button>
        </div>

        {newKey ? (
          <div className="key-reveal">
            <div className="key-reveal-icon">🔑</div>
            <h3>Account Created!</h3>
            <p className="key-reveal-desc">
              Save this API key — it will <strong>never</strong> be shown again.
            </p>
            <div className="key-display">
              <code>{newKey}</code>
              <button
                className="btn btn-sm"
                onClick={() => {
                  navigator.clipboard.writeText(newKey);
                }}
              >
                📋 Copy
              </button>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/dashboard')}
              style={{ marginTop: 16, width: '100%' }}
            >
              Go to Dashboard →
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
              <input
                id="password"
                type="password"
                placeholder={mode === 'register' ? 'Min 8 characters' : 'Your password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={mode === 'register' ? 8 : 1}
                required
              />
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
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
