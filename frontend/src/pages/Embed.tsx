import { useState, useEffect } from 'react';
import { useAuth } from '../auth';
import * as api from '../api';
import { Plug, Eye, EyeOff, MessageSquare, Copy, Check, KeyRound, AlertTriangle } from 'lucide-react';

type WidgetPosition = 'bottom-right' | 'bottom-left';

const PRESET_COLORS = [
  '#6366f1', // Indigo (default)
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
];

export default function Embed() {
  const { tenant } = useAuth();
  const [apiKey, setApiKey] = useState('');
  const [loadingKeys, setLoadingKeys] = useState(true);
  const [position, setPosition] = useState<WidgetPosition>('bottom-right');
  const [primaryColor, setPrimaryColor] = useState(PRESET_COLORS[0]);
  const [botName, setBotName] = useState('Assistant');
  const [welcomeMessage, setWelcomeMessage] = useState('Hi! How can I help you today?');
  const [suggestionChipsText, setSuggestionChipsText] = useState('What can I do here?, Tell me about this site');
  const [copied, setCopied] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);

  useEffect(() => {
    async function loadKeys() {
      try {
        const keys = await api.getApiKeys();
        const activeKey = keys.find((k) => k.is_active);
        if (activeKey) {
          setApiKey(activeKey.prefix + '***');
        }
      } catch {
        // ignore
      } finally {
        setLoadingKeys(false);
      }
    }
    loadKeys();
  }, []);

  const backendUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8000'
    : window.location.origin;

  const suggestionChips = suggestionChipsText
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const embedCode = `<!-- Chatbot SaaS Widget — https://cbaas-production.up.railway.app -->
<script>
// ═══════════════════════════════════════════════════════════
// 📋 CONFIGURATION — Customize the widget for your brand
// ═══════════════════════════════════════════════════════════
window.ChatbotConfig = {
  // 🔑 Required: Your unique API key from the dashboard
  apiKey: '${apiKey || 'YOUR_API_KEY'}',

  // 🌐 Required: Your backend URL (auto-detected, change if needed)
  baseUrl: '${backendUrl}',

  // 🤖 Bot display name shown in the chat header
  botName: '${botName || 'Assistant'}',

  // 🎨 Primary color — applies to header, buttons, and message bubbles
  primaryColor: '${primaryColor}',

  // 📍 Position on the page
  position: '${position}',

  // 👋 Welcome message shown when the widget opens
  welcomeMessage: '${welcomeMessage.replace(/'/g, "\\'")}',

  // 💡 Suggested questions shown as clickable chips
  suggestionChips: ${JSON.stringify(suggestionChips)}
};

// ═══════════════════════════════════════════════════════════
// 🔐 DYNAMIC ROLE DETECTION (Recommended)
// Uncomment and set this to your logged-in user's role to
// get role-aware responses. Options depend on your Neo4j
// knowledge graph setup (e.g. 'admin', 'student', 'manager').
// Defaults to 'guest' if not set.
// ═══════════════════════════════════════════════════════════
// window.SaaS_User_Role = 'admin';  // set dynamically from auth
</script>
<script src="${backendUrl}/static/widget/chatbot-widget.js" async></script>
<!-- ═══════════════════════════════════════════════════════════ -->
<!-- End Chatbot SaaS Widget -->`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="page embed-page">
      <div className="page-header">
        <h2>Embed Widget</h2>
        <p>Add the chatbot widget to your website with a simple script tag. Customize the look and feel below.</p>
      </div>

      <div className="embed-layout">
        {/* Configuration Panel */}
        <div className="embed-config">
          {/* API Key */}
          <div className="card">
            <h3>API Key</h3>
            <p className="card-desc">Select an active API key for the widget to authenticate with your backend.</p>
            {loadingKeys ? (
              <div className="spinner-sm" />
            ) : (
              <div className="embed-api-key-row">
                <input
                  className="input"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your API key"
                />
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => window.open('/api-keys', '_self')}
                >
                  Manage Keys
                </button>
              </div>
            )}
            {!apiKey && !loadingKeys && (
              <p className="embed-hint-warning">
                ⚠️ No API key set. Create one in the <a href="/api-keys" className="link">API Keys</a> page.
              </p>
            )}
          </div>

          {/* Appearance */}
          <div className="card">
            <h3>Appearance</h3>

            <div className="embed-field">
              <label>Bot Name</label>
              <input
                className="input"
                value={botName}
                onChange={(e) => setBotName(e.target.value)}
                placeholder="Assistant"
              />
            </div>

            <div className="embed-field">
              <label>Position</label>
              <div className="embed-chip-group">
                {([['bottom-right', '↘ Bottom Right'], ['bottom-left', '↙ Bottom Left']] as [WidgetPosition, string][]).map(([val, label]) => (
                  <button
                    key={val}
                    className={`chip ${position === val ? 'chip-active' : ''}`}
                    onClick={() => setPosition(val)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="embed-field">
              <label>Primary Color</label>
              <div className="embed-color-picker">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    className={`color-swatch ${primaryColor === c ? 'color-swatch-active' : ''}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setPrimaryColor(c)}
                    title={c}
                  />
                ))}
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="color-input"
                  title="Custom color"
                />
              </div>
            </div>

            <div className="embed-field">
              <label>Welcome Message</label>
              <input
                className="input"
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                placeholder="Hi! How can I help you today?"
              />
            </div>

            <div className="embed-field">
              <label>Suggestion Chips (comma separated)</label>
              <input
                className="input"
                value={suggestionChipsText}
                onChange={(e) => setSuggestionChipsText(e.target.value)}
                placeholder="What can I do here?, Tell me about this site"
              />
            </div>
          </div>

          {/* Preview Toggle */}
          <div className="card">
            <div className="embed-preview-toggle">
              <h3><Eye size={18} /> Live Preview</h3>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setPreviewVisible(!previewVisible)}
              >
                {previewVisible ? 'Hide Preview' : 'Show Preview'}
              </button>
            </div>
            {previewVisible && (
              <div className="embed-preview-container">
                <div className="widget-preview">
                  <div className="widget-preview-header" style={{ backgroundColor: primaryColor }}>
                    <span className="widget-preview-icon"><MessageSquare size={18} color="#fff" /></span>
                    <span className="widget-preview-name">{botName || 'Assistant'}</span>
                    <span className="widget-preview-status">● Online</span>
                  </div>
                  <div className="widget-preview-body" style={{ background: '#ffffff' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px 0' }}>
                      <div style={{ fontSize: '18px', fontWeight: 400, color: '#1f1f1f', marginBottom: '4px', lineHeight: 1.3 }}>
                        <span style={{ background: 'linear-gradient(90deg, #4285F4, #9b51e0, #ea4335)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 500 }}>Hello!</span>
                        <br />
                        {welcomeMessage}
                      </div>
                      <div style={{ fontSize: '12px', color: '#5f6368', marginBottom: '8px' }}>
                        Ask about features, navigation, or anything on this site.
                      </div>
                      {suggestionChips.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {suggestionChips.map((chip, idx) => (
                            <div
                              key={idx}
                              style={{
                                padding: '6px 10px',
                                background: 'white',
                                color: '#333',
                                border: '1px solid #dadce0',
                                borderRadius: '6px',
                                fontSize: '11px',
                                cursor: 'pointer',
                              }}
                            >
                              {chip}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="widget-preview-footer">
                    <input className="widget-preview-input" disabled placeholder="Type a message..." />
                    <button className="widget-preview-send" style={{ backgroundColor: primaryColor }}>
                      ➤
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Code Output Panel */}
        <div className="embed-output">
          <div className="card embed-code-card">
            <div className="embed-code-header">
              <h3>Embed Code</h3>
              <div className="embed-code-actions">
                <button
                  className={`btn ${copied ? 'btn-secondary' : 'btn-primary'} btn-sm`}
                  onClick={handleCopy}
                >
                  {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Code</>}
                </button>
              </div>
            </div>
            <p className="card-desc">
              Copy and paste this script tag just before the closing <code className="code-sm">&lt;/body&gt;</code> tag on your website.
            </p>
            <pre className="embed-code-block">
              <code>{embedCode}</code>
            </pre>
            <div className="embed-instructions">
              <h4>Installation Guide</h4>
              <ol className="embed-steps">
                <li><strong>Copy</strong> the embed code above</li>
                <li><strong>Paste</strong> it just before the <code className="code-sm">&lt;/body&gt;</code> tag on your website</li>
                <li><strong>Replace</strong> <code className="code-sm">YOUR_API_KEY</code> with an actual API key from your account</li>
                <li><strong>Customize</strong> the appearance options on the left to match your brand</li>
                <li><strong>Save</strong> and reload your website — the chatbot widget will appear!</li>
              </ol>
              <div className="embed-tip">
                💡 <strong>Tip:</strong> The widget renders for all visitors and tailors responses based on the user's role. Set <code className="code-sm">window.SaaS_User_Role</code> before <code className="code-sm">ChatbotConfig</code> to dynamically detect logged-in users (e.g. <code className="code-sm">'admin'</code>, <code className="code-sm">'student'</code>). Defaults to <code className="code-sm">'guest'</code> if not set.
              </div>
            </div>
          </div>

          {/* API Key List */}
          <div className="card">
            <h3>Your API Keys</h3>
            <p className="card-desc">Use one of these keys in the embed code above.</p>
            <ApiKeyListWidget onSelect={setApiKey} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ApiKeyListWidget({ onSelect }: { onSelect: (key: string) => void }) {
  const [keys, setKeys] = useState<api.ApiKey[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getApiKeys().then(setKeys).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner-sm" />;

  if (keys.length === 0) {
    return (
      <p className="text-muted">
        No API keys yet.{' '}
        <a href="/api-keys" className="link">Create one →</a>
      </p>
    );
  }

  return (
    <div className="embed-key-list">
      {keys.map((key) => (
        <div key={key.id} className="embed-key-item">
          <div>
            <span className="embed-key-prefix">{key.prefix}…</span>
            <span className={`badge ${key.is_active ? 'badge-active' : 'badge-inactive'}`}>
              {key.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => {
              onSelect(key.prefix);
              navigator.clipboard.writeText(key.prefix);
            }}
          >
            Use
          </button>
        </div>
      ))}
    </div>
  );
}
