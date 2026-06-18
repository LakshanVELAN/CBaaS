import { useState } from 'react';

const BASIC_EMBED = `<!-- Chatbot SaaS Widget -->
<script>
window.ChatbotConfig = {
  apiKey: 'YOUR_API_KEY',
  baseUrl: 'https://your-backend.com',
  botName: 'Assistant',
  primaryColor: '#6366f1',
  position: 'bottom-right',
  welcomeMessage: 'Hi! How can I help you today?',
  suggestionChips: ["What can I do here?", "Tell me about this site"]
};
</script>
<script src="https://your-backend.com/static/widget/chatbot-widget.js" async></script>
<!-- End Chatbot SaaS Widget -->`;

const DYNAMIC_ROLE_EMBED = `<!-- Chatbot SaaS Widget -->
<script>
// ⬇️ SET THE USER'S ROLE FROM YOUR AUTH SYSTEM
// Replace 'admin' with the actual role of the logged-in user
window.SaaS_User_Role = 'admin';  // options: 'admin', 'student', 'manager', etc.

window.ChatbotConfig = {
  apiKey: 'YOUR_API_KEY',
  baseUrl: 'https://your-backend.com',
  botName: 'Assistant',
  primaryColor: '#6366f1',
  position: 'bottom-right',
  welcomeMessage: 'Hi! How can I help you today?',
  suggestionChips: ["What can I do here?", "Tell me about this site"]
};
</script>
<script src="https://your-backend.com/static/widget/chatbot-widget.js" async></script>
<!-- End Chatbot SaaS Widget -->`;

const REACT_EXAMPLE = `// Example: React app with auth context
// In your App.jsx or layout component:

import { useEffect } from 'react';

function App() {
  const { user } = useAuth(); // your auth hook

  useEffect(() => {
    // Tell the chatbot widget what role this user has
    window.SaaS_User_Role = user?.role || 'guest';
  }, [user]);

  return (
    <div className="app">
      {/* Your app content */}
      {/* The widget script loads and reads SaaS_User_Role automatically */}
    </div>
  );
}`;

const DJANGO_EXAMPLE = `<!-- Django template example -->
<!-- In your base.html or layout template -->

{% if user.is_authenticated %}
<script>
  window.SaaS_User_Role = '{{ user.profile.role|default:"guest" }}';
</script>
{% endif %}

<!-- Then your normal widget embed code -->`;

const JWT_EXAMPLE = `// Example: After decoding a JWT token
import { jwtDecode } from 'jwt-decode';

function onLogin(token) {
  const decoded = jwtDecode(token);
  // decoded might have: { role: 'admin', sub: 'user123', ... }

  window.SaaS_User_Role = decoded.role || 'guest';

  // Now load the widget (or it will pick it up on next page load)
}`;

const API_EXAMPLE = `// Example: Fetch user profile after login
async function onLogin() {
  const response = await fetch('/api/auth/login', { ... });
  const user = await response.json();
  // user might be: { id: 1, name: 'John', role: 'manager', ... }

  window.SaaS_User_Role = user.role || 'guest';
}`;

export default function ClientGuide() {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyCode = (code: string, section: string) => {
    navigator.clipboard.writeText(code.trim());
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const CodeBlock = ({ code, section }: { code: string; section: string }) => (
    <div className="code-block-wrap">
      <pre className="code-block">
        <code>{code}</code>
      </pre>
      <button
        className="btn btn-sm btn-secondary code-copy-btn"
        onClick={() => copyCode(code, section)}
      >
        {copiedSection === section ? '✅ Copied!' : '📋 Copy'}
      </button>
    </div>
  );

  return (
    <div className="page guide-page">
      <div className="page-header">
        <h2>📖 Client Integration Guide</h2>
        <p>
          Step-by-step instructions for adding the chatbot widget to your client's
          website with role-based responses.
        </p>
      </div>

      {/* ── Step 1 ── */}
      <div className="card guide-step">
        <div className="guide-step-number">1</div>
        <div>
          <h3>Get Your API Key</h3>
          <p className="card-desc">
            Go to the <strong>API Keys</strong> page and create a new API key.
            Your client will use this key to authenticate the widget with your backend.
          </p>
          <div className="guide-tip">
            💡 <strong>Tip:</strong> Create separate API keys for each client site so you
            can revoke them individually if needed.
          </div>
        </div>
      </div>

      {/* ── Step 2 ── */}
      <div className="card guide-step">
        <div className="guide-step-number">2</div>
        <div>
          <h3>Copy the Embed Code</h3>
          <p className="card-desc">
            Go to the <strong>Embed</strong> page, customize the appearance, and copy the
            generated embed code. Paste it just before the <code>&lt;/body&gt;</code> tag
            on your client's website.
          </p>

          <h4 className="guide-subheading">Basic embed (guest-only):</h4>
          <CodeBlock code={BASIC_EMBED} section="basic" />
          <div className="guide-note">
            ⚠️ With this option, the bot will treat ALL visitors as <strong>guest</strong>
            and answer only about guest-accessible content.
          </div>
        </div>
      </div>

      {/* ── Step 3 ── */}
      <div className="card guide-step">
        <div className="guide-step-number">3</div>
        <div>
          <h3>Enable Dynamic Role Detection 🔐</h3>
          <p className="card-desc">
            To make the bot answer based on each user's actual role, set the
            <code> window.SaaS_User_Role</code> variable <strong>before</strong> the
            widget loads. This tells the widget what role the currently logged-in user has.
          </p>

          <h4 className="guide-subheading">Dynamic role embed code:</h4>
          <div className="guide-highlight">
            <strong>Key change:</strong> Add <code>window.SaaS_User_Role</code> before
            <code> ChatbotConfig</code>
          </div>
          <CodeBlock code={DYNAMIC_ROLE_EMBED} section="dynamic" />
          <div className="guide-note">
            ✅ Now the bot will only answer about what <strong>admin</strong> can access.
            Change the value for different roles.
          </div>
        </div>
      </div>

      {/* ── Step 4 ── */}
      <div className="card guide-step">
        <div className="guide-step-number">4</div>
        <div>
          <h3>Integrate with Your Auth System</h3>
          <p className="card-desc">
            Instead of hardcoding <code>'admin'</code>, pull the role from your
            authentication system. Here are examples for different setups:
          </p>

          <details className="guide-accordion" open>
            <summary className="guide-accordion-header">
              <span className="guide-accordion-icon">⚛️</span>
              React / Vue / Angular (SPA)
            </summary>
            <div className="guide-accordion-body">
              <p>
                Set <code>window.SaaS_User_Role</code> in a <code>useEffect</code> or
                lifecycle hook when the user state changes:
              </p>
              <CodeBlock code={REACT_EXAMPLE} section="react" />
            </div>
          </details>

          <details className="guide-accordion">
            <summary className="guide-accordion-header">
              <span className="guide-accordion-icon">🐍</span>
              Django / Rails / PHP (Server-rendered)
            </summary>
            <div className="guide-accordion-body">
              <p>
                Inject the user's role directly into the template:
              </p>
              <CodeBlock code={DJANGO_EXAMPLE} section="django" />
            </div>
          </details>

          <details className="guide-accordion">
            <summary className="guide-accordion-header">
              <span className="guide-accordion-icon">🔐</span>
              JWT Token Authentication
            </summary>
            <div className="guide-accordion-body">
              <p>
                Decode the JWT token on login and extract the role:
              </p>
              <CodeBlock code={JWT_EXAMPLE} section="jwt" />
            </div>
          </details>

          <details className="guide-accordion">
            <summary className="guide-accordion-header">
              <span className="guide-accordion-icon">🌐</span>
              After API Login Call
            </summary>
            <div className="guide-accordion-body">
              <p>
                Fetch the user profile after login and set the role:
              </p>
              <CodeBlock code={API_EXAMPLE} section="api" />
            </div>
          </details>
        </div>
      </div>

      {/* ── Step 5 ── */}
      <div className="card guide-step">
        <div className="guide-step-number">5</div>
        <div>
          <h3>Verify It's Working</h3>
          <p className="card-desc">
            Open your client's website in the browser and open the Developer Console
            (<kbd>F12</kbd> → Console tab). You should see:
          </p>
          <div className="guide-console-output">
            <code>[Chatbot Widget] Initializing with baseUrl: https://... tenant: ...</code><br />
            <code className="guide-console-role">[Chatbot Widget] User role: admin</code>
          </div>
          <p className="card-desc" style={{ marginTop: '12px' }}>
            The second line confirms the widget detected the correct role. If it shows
            <strong> guest</strong>, then <code>SaaS_User_Role</code> is not being set
            correctly.
          </p>
        </div>
      </div>

      {/* ── Troubleshooting ── */}
      <div className="card">
        <h3>⚠️ Troubleshooting</h3>
        <div className="guide-faq">
          <div className="guide-faq-item">
            <strong>Q: The widget shows "User role: guest" even though I set SaaS_User_Role.</strong>
            <p>Make sure <code>window.SaaS_User_Role</code> is set <strong>before</strong> the widget script loads. The order in the HTML matters — set the role first, then define ChatbotConfig, then load the script.</p>
          </div>
          <div className="guide-faq-item">
            <strong>Q: Can I change the role dynamically without reloading the page?</strong>
            <p>Yes! The widget checks <code>window.SaaS_User_Role</code> on every message send. You can update it at any time (e.g., when a user switches roles) and the next message will use the new role.</p>
          </div>
          <div className="guide-faq-item">
            <strong>Q: The bot is answering about things my role shouldn't know about.</strong>
            <p>Make sure the Neo4j knowledge graph is configured correctly in the <strong>Knowledge Base</strong> page. The bot's answers come from Neo4j, so only the data uploaded for that role will be visible.</p>
          </div>
          <div className="guide-faq-item">
            <strong>Q: What if my client doesn't set any role?</strong>
            <p>The widget defaults to <strong>guest</strong>. The bot will still render and answer questions, but only based on guest-accessible content. If no guest role is configured in Neo4j, the bot will answer based on general knowledge only.</p>
          </div>
        </div>
      </div>

      {/* ── Architecture Diagram ── */}
      <div className="card">
        <h3>🔁 How It All Connects</h3>
        <div className="guide-flow">
          <div className="guide-flow-step">
            <span className="guide-flow-icon">👤</span>
            <strong>User logs in</strong>
            <span className="guide-flow-arrow">→</span>
          </div>
          <div className="guide-flow-step">
            <span className="guide-flow-icon">🔑</span>
            <strong>Client sets</strong>
            <code>SaaS_User_Role</code>
            <span className="guide-flow-arrow">→</span>
          </div>
          <div className="guide-flow-step">
            <span className="guide-flow-icon">💬</span>
            <strong>Widget sends</strong>
            <code>role</code> with message
            <span className="guide-flow-arrow">→</span>
          </div>
          <div className="guide-flow-step">
            <span className="guide-flow-icon">🗄️</span>
            <strong>Neo4j queries</strong>
            for that role only
            <span className="guide-flow-arrow">→</span>
          </div>
          <div className="guide-flow-step">
            <span className="guide-flow-icon">🤖</span>
            <strong>Bot answers</strong>
            within role's scope
          </div>
        </div>
      </div>
    </div>
  );
}
