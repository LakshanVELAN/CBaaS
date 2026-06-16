import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../auth';
import * as api from '../api';

interface ChatMessage {
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
  tokenUsage?: api.ChatMessageResponse['token_usage'];
}

function generateSessionId(): string {
  return `playground_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const SUGGESTED_PROMPTS = [
  'What can you help me with?',
  'How does this platform work?',
  'Show me what features are available',
  'Help me get started',
];

export default function Playground() {
  const { tenant } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'bot',
      content: `Hello! I'm your AI assistant. I'm connected to your knowledge base and can help answer questions about your platform. Try asking me something below! 👋`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sessionId] = useState(generateSessionId);
  const [selectedRole, setSelectedRole] = useState('guest');
  const [showRolePicker, setShowRolePicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (prompt?: string) => {
    const text = (prompt || input).trim();
    if (!text || sending) return;

    setInput('');
    const userMsg: ChatMessage = {
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setSending(true);

    try {
      const history = messages
        .slice(-20)
        .map((m) => ({
          role: m.role === 'user' ? 'user' : 'model',
          content: m.content,
        }));

      const res = await api.sendChatMessage({
        message: text,
        session_id: sessionId,
        history,
        role: selectedRole,
      });

      const botMsg: ChatMessage = {
        role: 'bot',
        content: res.message,
        timestamp: new Date(),
        tokenUsage: res.token_usage,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const botMsg: ChatMessage = {
        role: 'bot',
        content: `⚠️ **Error:** ${err.message || 'Failed to get a response. Please try again.'}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: 'bot',
        content: 'Chat cleared. How can I help you?',
        timestamp: new Date(),
      },
    ]);
  };

  const formatTime = (d: Date) =>
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  return (
    <div className="page playground-page">
      <div className="page-header playground-header">
        <div>
          <h2>🧪 Chat Playground</h2>
          <p>Test your chatbot in real-time. Messages use your knowledge base and Neo4j graph for context-aware responses.</p>
        </div>
        <div className="playground-actions-top">
          <div className="playground-role-selector">
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowRolePicker(!showRolePicker)}
            >
              👤 {selectedRole}
            </button>
            {showRolePicker && (
              <div className="playground-role-dropdown">
                {['guest', 'user', 'admin', 'editor', 'viewer'].map((role) => (
                  <button
                    key={role}
                    className={`dropdown-item ${role === selectedRole ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedRole(role);
                      setShowRolePicker(false);
                    }}
                  >
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className="btn btn-secondary btn-sm" onClick={clearChat}>
            🗑️ Clear Chat
          </button>
        </div>
      </div>

      {tenant?.plan === 'free' && (
        <div className="playground-banner">
          ⚡ You're on the <strong>Free</strong> plan. Upgrade to increase your message quota.
        </div>
      )}

      <div className="playground-layout">
        {/* Chat Area */}
        <div className="playground-chat">
          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`chat-msg ${msg.role === 'user' ? 'chat-msg-user' : 'chat-msg-bot'}`}
              >
                <div className="chat-msg-avatar">
                  {msg.role === 'user' ? '🧑' : '🤖'}
                </div>
                <div className="chat-msg-content">
                  <div className="chat-msg-header">
                    <span className="chat-msg-role">
                      {msg.role === 'user' ? 'You' : 'Assistant'}
                    </span>
                    <span className="chat-msg-time">{formatTime(msg.timestamp)}</span>
                  </div>
                  <div className="chat-msg-text">
                    {msg.content}
                  </div>
                  <div className="chat-msg-footer">
                    {msg.tokenUsage && (
                      <span className="chat-msg-tokens" title={`Prompt: ${msg.tokenUsage.prompt_tokens} · Completion: ${msg.tokenUsage.completion_tokens} · Cost: $${msg.tokenUsage.cost.toFixed(6)}`}>
                        ⚡ {msg.tokenUsage.total_tokens} tokens · ${msg.tokenUsage.cost.toFixed(6)}
                      </span>
                    )}
                    <button
                      className="chat-msg-copy"
                      onClick={() => copyMessage(msg.content)}
                      title="Copy message"
                    >
                      📋
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {sending && (
              <div className="chat-msg chat-msg-bot">
                <div className="chat-msg-avatar">🤖</div>
                <div className="chat-msg-content">
                  <div className="chat-msg-header">
                    <span className="chat-msg-role">Assistant</span>
                  </div>
                  <div className="chat-typing">
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-area">
            <div className="chat-session-info">
              Session: <code>{sessionId.slice(0, 20)}…</code>
            </div>
            <div className="chat-input-row">
              <textarea
                ref={inputRef}
                className="chat-input"
                placeholder="Type your message…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                disabled={sending}
              />
              <button
                className="btn btn-primary chat-send-btn"
                onClick={() => handleSend()}
                disabled={sending || !input.trim()}
              >
                {sending ? '…' : 'Send'}
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="playground-sidebar">
          {/* Stats */}
          <div className="playground-card">
            <h4>Session Stats</h4>
            <div className="playground-stat-row">
              <span>Messages</span>
              <strong>{messages.filter((m) => m.role === 'user').length}</strong>
            </div>
            <div className="playground-stat-row">
              <span>Total Tokens</span>
              <strong>
                {messages.reduce((sum, m) => sum + (m.tokenUsage?.total_tokens || 0), 0).toLocaleString()}
              </strong>
            </div>
            <div className="playground-stat-row">
              <span>Total Cost</span>
              <strong>
                ${messages.reduce((sum, m) => sum + (m.tokenUsage?.cost || 0), 0).toFixed(6)}
              </strong>
            </div>
          </div>

          {/* Suggested Prompts */}
          <div className="playground-card">
            <h4>Suggested Prompts</h4>
            <div className="playground-prompts">
              {SUGGESTED_PROMPTS.map((p, i) => (
                <button
                  key={i}
                  className="playground-prompt-btn"
                  onClick={() => handleSend(p)}
                  disabled={sending}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Role Info */}
          <div className="playground-card">
            <h4>Current Role</h4>
            <p className="playground-role-info">
              Testing as <strong>{selectedRole}</strong>. The chatbot tailors responses based on this role's configured knowledge and accessible routes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
