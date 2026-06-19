/**
 * Chatbot SaaS Widget
 * Injects a floating chat bubble into any website.
 * Configuration is read from the script tag's data-* attributes.
 *
 * Usage:
 *   <script src="https://yourdomain.com/widget.js"
 *           data-apiKey="YOUR_API_KEY"
 *           data-tenantId="TENANT_ID"
 *           data-theme="light|dark|auto"
 *           data-position="bottom-right|bottom-left"
 *           data-primaryColor="#6366f1"
 *           data-botName="Assistant"
 *           data-size="sm|md|lg"
 *           async></script>
 */
(function () {
  'use strict';

  // ── Configuration ──
  function getConfig() {
    // Find the script tag that loaded us.
    // Strategy 1: look at src attribute (most reliable for async scripts)
    var scripts = document.querySelectorAll('script');
    var script = null;
    for (var i = 0; i < scripts.length; i++) {
      var src = scripts[i].src || '';
      if (src.indexOf('widget.js') !== -1) {
        script = scripts[i];
        break;
      }
    }
    // Fallback: find by data-api-key attribute (works with any filename)
    if (!script) {
      var byKey = document.querySelectorAll('script[data-api-key], script[data-apikey]');
      script = byKey[byKey.length - 1] || null;
    }
    if (!script) {
      console.warn('[Chatbot Widget] Could not find the widget script tag.');
      return null;
    }

    // Use fully resolved src (includes origin for absolute URLs)
    var src = script.src || '';
    var baseUrl = src.substring(0, Math.max(0, src.lastIndexOf('/'))) || '';

    // Use dataset API which handles kebab→camelCase conversion
    return {
      apiKey: script.dataset.apiKey || script.dataset.apikey || '',
      tenantId: script.dataset.tenantId || script.dataset.tenantid || '',
      theme: script.dataset.theme || 'light',
      position: script.dataset.position || 'bottom-right',
      primaryColor: script.dataset.primaryColor || script.dataset.primarycolor || '#6366f1',
      botName: script.dataset.botName || script.dataset.botname || 'Assistant',
      size: script.dataset.size || 'md',
      baseUrl: (script.dataset.baseUrl || script.dataset.baseurl || baseUrl || window.location.origin).replace(/\/+$/, ''),
    };
  }

  var config = getConfig();
  if (!config || !config.apiKey) {
    console.warn('[Chatbot Widget] No API key found. Add data-apiKey to the script tag.');
    return;
  }

  console.log('[Chatbot Widget] Initializing with baseUrl:', config.baseUrl, 'tenant:', config.tenantId);

  // ── Role Detection ──
  // Read the user's role from the client's site (set by their auth system)
  // Falls back to 'guest' if not available
  function getCurrentRole() {
    return window.ChatbotConfig && window.ChatbotConfig.role
      || window.SaaS_User_Role
      || 'guest';
  }

  console.log('[Chatbot Widget] User role:', getCurrentRole());

  // ── State ──
  var state = {
    open: false,
    sessionId: 'widget_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
    messages: [],
    sending: false,
    unread: 0,
    abortController: null,
  };

  // ── DOM Helpers ──
  function createElement(tag, attrs, children) {
    var el = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        if (key === 'style' && typeof attrs[key] === 'object') {
          Object.assign(el.style, attrs[key]);
        } else if (key === 'className') {
          el.className = attrs[key];
        } else if (key === 'innerHTML') {
          el.innerHTML = attrs[key];
        } else if (key === 'disabled') {
          if (attrs[key]) { el.disabled = true; }
        } else {
          el.setAttribute(key, attrs[key]);
        }
      });
    }
    if (children) {
      children.forEach(function (c) {
        if (typeof c === 'string') {
          el.appendChild(document.createTextNode(c));
        } else if (c instanceof HTMLElement) {
          el.appendChild(c);
        }
      });
    }
    return el;
  }

  // ── Colors ──
  function hexToRgba(hex, alpha) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
  }

  // ── Theme Detection ──
  var isDark = config.theme === 'dark' || (config.theme === 'auto' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);

  // ── Sizing ──
  var sizeMap = {
    sm: { bubble: '48px', popup: '320px', fontSize: '13px' },
    md: { bubble: '56px', popup: '360px', fontSize: '14px' },
    lg: { bubble: '64px', popup: '400px', fontSize: '15px' },
  };
  var sizes = sizeMap[config.size] || sizeMap.md;

  // ── Styles ──
  var styles = {
    bg: isDark ? '#1e293b' : '#ffffff',
    text: isDark ? '#e2e8f0' : '#1f2937',
    muted: isDark ? '#94a3b8' : '#6b7280',
    border: isDark ? '#334155' : '#e5e7eb',
    inputBg: isDark ? '#0f172a' : '#f9fafb',
    bubbleBg: isDark ? '#334155' : '#f3f4f6',
    shadow: '0 8px 32px rgba(0,0,0,0.18)',
  };

  var container = null;
  var bubble = null;
  var popup = null;
  var messagesArea = null;
  var inputField = null;
  var bubbleIcon = null;
  var unreadBadge = null;

  // ── Build Widget DOM ──
  function buildWidget() {
    container = createElement('div', {
      id: 'chatbot-saas-widget-container',
      style: {
        all: 'initial',
        display: 'block',
        position: 'fixed',
        bottom: '0',
        right: '0',
        width: '0',
        height: '0',
        zIndex: '2147483647',
      },
    });

    // Adjust container position for bottom-left
    if (config.position === 'bottom-left') {
      container.style.right = 'auto';
      container.style.left = '0';
    }

    // Font styles go on a wrapper inside the container (all:initial resets everything)
    var wrapper = createElement('div', {
      style: {
        position: 'absolute',
        bottom: '0',
        right: '0',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        fontSize: sizes.fontSize,
        lineHeight: '1.5',
        color: styles.text,
      },
    });

    if (config.position === 'bottom-left') {
      wrapper.style.right = 'auto';
      wrapper.style.left = '0';
    }

    // ── Bubble Button ──
    bubble = createElement('button', {
      id: 'chatbot-saas-bubble',
      'aria-label': 'Open chat',
      style: {
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        width: sizes.bubble,
        height: sizes.bubble,
        borderRadius: '50%',
        backgroundColor: config.primaryColor,
        border: 'none',
        cursor: 'pointer',
        boxShadow: styles.shadow,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'transform 0.2s ease, opacity 0.2s ease',
        transform: 'scale(1)',
      },
    });

    if (config.position === 'bottom-left') {
      bubble.style.right = 'auto';
      bubble.style.left = '20px';
    }

    bubbleIcon = createElement('span', {
      style: {
        fontSize: 'calc(' + sizes.bubble + ' * 0.48)',
        lineHeight: '1',
        transition: 'transform 0.3s ease',
      },
      innerHTML: '💬',
    });
    bubble.appendChild(bubbleIcon);

    // Unread badge
    unreadBadge = createElement('span', {
      id: 'chatbot-saas-unread',
      style: {
        position: 'absolute',
        top: '-2px',
        right: '-2px',
        backgroundColor: '#ef4444',
        color: 'white',
        fontSize: '11px',
        fontWeight: '700',
        minWidth: '18px',
        height: '18px',
        borderRadius: '9px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 4px',
        opacity: '0',
        transform: 'scale(0)',
        transition: 'opacity 0.2s ease, transform 0.2s ease',
      },
      innerHTML: '0',
    });
    bubble.appendChild(unreadBadge);

    // Hover effect
    bubble.addEventListener('mouseenter', function () {
      bubble.style.transform = 'scale(1.08)';
    });
    bubble.addEventListener('mouseleave', function () {
      bubble.style.transform = 'scale(1)';
    });

    // ── Popup ──
    var popupBottom = 'calc(' + sizes.bubble + ' + 24px)';
    popup = createElement('div', {
      id: 'chatbot-saas-popup',
      style: {
        position: 'absolute',
        bottom: popupBottom,
        right: '0',
        width: sizes.popup,
        maxHeight: '520px',
        backgroundColor: styles.bg,
        borderRadius: '16px',
        boxShadow: styles.shadow,
        border: '1px solid ' + styles.border,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        opacity: '0',
        transform: 'translateY(12px) scale(0.96)',
        transformOrigin: 'bottom right',
        transition: 'opacity 0.25s ease, transform 0.25s ease',
        pointerEvents: 'none',
      },
    });

    if (config.position === 'bottom-left') {
      popup.style.right = 'auto';
      popup.style.left = '0';
      popup.style.transformOrigin = 'bottom left';
    }

    // ── Header ──
    var header = createElement('div', {
      style: {
        padding: '14px 16px',
        backgroundColor: config.primaryColor,
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        flexShrink: '0',
      },
    });

    var headerIcon = createElement('span', { style: { fontSize: '20px' }, innerHTML: '💬' });
    var headerTitle = createElement('span', { style: { fontWeight: '600', fontSize: '15px', flex: '1' }, innerHTML: config.botName });
    var headerStatus = createElement('span', { style: { fontSize: '11px', opacity: '0.8' }, innerHTML: '● Online' });
    var closeBtn = createElement('button', {
      style: {
        background: 'none',
        border: 'none',
        color: 'white',
        fontSize: '18px',
        cursor: 'pointer',
        padding: '2px 4px',
        opacity: '0.7',
        lineHeight: '1',
      },
      innerHTML: '✕',
    });
    closeBtn.addEventListener('click', function (e) { e.stopPropagation(); toggleWidget(); });

    header.appendChild(headerIcon);
    header.appendChild(headerTitle);
    header.appendChild(headerStatus);
    header.appendChild(closeBtn);
    popup.appendChild(header);

    // ── Messages Area ──
    messagesArea = createElement('div', {
      id: 'chatbot-saas-messages',
      style: {
        flex: '1',
        overflowY: 'auto',
        padding: '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        scrollBehavior: 'smooth',
      },
    });
    popup.appendChild(messagesArea);

    // ── Input Area ──
    var inputArea = createElement('div', {
      style: {
        padding: '10px 14px',
        borderTop: '1px solid ' + styles.border,
        display: 'flex',
        gap: '8px',
        flexShrink: '0',
        backgroundColor: styles.bg,
      },
    });

    inputField = createElement('input', {
      id: 'chatbot-saas-input',
      type: 'text',
      placeholder: 'Type a message…',
      style: {
        flex: '1',
        padding: '9px 14px',
        border: '1px solid ' + styles.border,
        borderRadius: '99px',
        fontSize: '14px',
        outline: 'none',
        backgroundColor: styles.inputBg,
        color: styles.text,
        fontFamily: 'inherit',
      },
    });
    inputField.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    var sendBtn = createElement('button', {
      style: {
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        border: 'none',
        backgroundColor: config.primaryColor,
        color: 'white',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '16px',
        flexShrink: '0',
        transition: 'opacity 0.2s ease',
      },
      innerHTML: '➤',
    });
    sendBtn.addEventListener('click', function () { sendMessage(); });

    inputArea.appendChild(inputField);
    inputArea.appendChild(sendBtn);
    popup.appendChild(inputArea);

    // ── Append to body ──
    wrapper.appendChild(bubble);
    wrapper.appendChild(popup);
    container.appendChild(wrapper);
    document.body.appendChild(container);

    // Add welcome message
    addBotMessage('Hi! I\'m ' + config.botName + '. How can I help you today? 👋');
    state.messages.push({ role: 'bot', content: 'Hi! I\'m ' + config.botName + '. How can I help you today? 👋' });

  }

  // ── Toggle Widget ──
  function toggleWidget() {
    if (!popup) return;

    state.open = !state.open;

    if (state.open) {
      popup.style.opacity = '1';
      popup.style.transform = 'translateY(0) scale(1)';
      popup.style.pointerEvents = 'auto';
      if (bubbleIcon) { bubbleIcon.innerHTML = '✕'; }
      // Reset unread
      state.unread = 0;
      if (unreadBadge) {
        unreadBadge.style.opacity = '0';
        unreadBadge.style.transform = 'scale(0)';
      }
      // Focus input
      if (inputField) { setTimeout(function () { inputField.focus(); }, 300); }
    } else {
      popup.style.opacity = '0';
      popup.style.transform = 'translateY(12px) scale(0.96)';
      popup.style.pointerEvents = 'none';
      if (bubbleIcon) { bubbleIcon.innerHTML = '💬'; }
    }
  }

  // ── Add Message to DOM ──
  function addBotMessage(text, navigations) {
    if (!messagesArea) return;

    var msg = createElement('div', {
      style: {
        display: 'flex',
        gap: '8px',
        maxWidth: '85%',
        alignSelf: 'flex-start',
        animation: 'chatbotFadeIn 0.25s ease',
      },
    });

    var avatar = createElement('div', {
      style: {
        width: '28px',
        height: '28px',
        borderRadius: '50%',
        backgroundColor: config.primaryColor,
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '14px',
        flexShrink: '0',
      },
      innerHTML: '🤖',
    });

    // ── Text + Navigations column ──
    var col = createElement('div', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        flex: '1',
      },
    });

    var textBubble = createElement('div', {
      style: {
        backgroundColor: styles.bubbleBg,
        color: styles.text,
        borderRadius: '0 12px 12px 12px',
        padding: '10px 14px',
        fontSize: '13px',
        lineHeight: '1.5',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      },
      innerHTML: escapeHtml(text),
    });
    col.appendChild(textBubble);

    // Render navigation buttons if present
    if (navigations && navigations.length > 0) {
      navigations.forEach(function (nav) {
        var navUrl = nav.url || '';
        var navTitle = nav.title || 'Open Page';

        // For widget:// URLs, extract just the path
        var targetPath = navUrl;
        if (navUrl.indexOf('widget://') === 0) {
          targetPath = navUrl.substring(9); // remove 'widget://' → '/employer/interviews'
        }

        var navBtn = createElement('button', {
          style: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            backgroundColor: 'transparent',
            border: '1px solid ' + config.primaryColor,
            borderRadius: '8px',
            color: config.primaryColor,
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'background-color 0.15s ease, color 0.15s ease',
            fontFamily: 'inherit',
            width: '100%',
            textAlign: 'left',
          },
          innerHTML: '➜ ' + escapeHtml(navTitle),
        });

        navBtn.addEventListener('mouseenter', function () {
          navBtn.style.backgroundColor = config.primaryColor;
          navBtn.style.color = 'white';
        });
        navBtn.addEventListener('mouseleave', function () {
          navBtn.style.backgroundColor = 'transparent';
          navBtn.style.color = config.primaryColor;
        });
        navBtn.addEventListener('click', function () {
          window.location.href = targetPath;
        });

        col.appendChild(navBtn);
      });
    }

    msg.appendChild(avatar);
    msg.appendChild(col);
    messagesArea.appendChild(msg);
    messagesArea.scrollTop = messagesArea.scrollHeight;
  }

  function addUserMessage(text) {
    if (!messagesArea) return;

    var msg = createElement('div', {
      style: {
        display: 'flex',
        gap: '8px',
        maxWidth: '85%',
        alignSelf: 'flex-end',
        animation: 'chatbotFadeIn 0.25s ease',
      },
    });

    var textBubble = createElement('div', {
      style: {
        backgroundColor: config.primaryColor,
        color: 'white',
        borderRadius: '12px 0 12px 12px',
        padding: '10px 14px',
        fontSize: '13px',
        lineHeight: '1.5',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      },
      innerHTML: escapeHtml(text),
    });

    msg.appendChild(textBubble);
    messagesArea.appendChild(msg);
    messagesArea.scrollTop = messagesArea.scrollHeight;
  }

  function showTyping() {
    if (!messagesArea) return;
    var existing = document.getElementById('chatbot-saas-typing');
    if (existing) return;

    var typing = createElement('div', {
      id: 'chatbot-saas-typing',
      style: {
        display: 'flex',
        gap: '8px',
        maxWidth: '85%',
        alignSelf: 'flex-start',
        animation: 'chatbotFadeIn 0.25s ease',
      },
    });

    var avatar = createElement('div', {
      style: {
        width: '28px',
        height: '28px',
        borderRadius: '50%',
        backgroundColor: config.primaryColor,
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '14px',
        flexShrink: '0',
      },
      innerHTML: '🤖',
    });

    var bubbleInner = createElement('div', {
      style: {
        backgroundColor: styles.bubbleBg,
        borderRadius: '0 12px 12px 12px',
        padding: '12px 16px',
        display: 'flex',
        gap: '4px',
        alignItems: 'center',
      },
    });

    for (var i = 0; i < 3; i++) {
      var dot = createElement('span', {
        style: {
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: styles.muted,
          animation: 'chatbotBounce 1.4s infinite ease-in-out',
          animationDelay: (i * 0.2) + 's',
        },
      });
      bubbleInner.appendChild(dot);
    }

    typing.appendChild(avatar);
    typing.appendChild(bubbleInner);
    messagesArea.appendChild(typing);
    messagesArea.scrollTop = messagesArea.scrollHeight;
  }

  function hideTyping() {
    var typing = document.getElementById('chatbot-saas-typing');
    if (typing) { typing.remove(); }
  }

  // ── Send Message ──
  function sendMessage() {
    if (!inputField) return;

    var text = inputField.value.trim();
    if (!text || state.sending) return;

    inputField.value = '';
    state.sending = true;

    // Show user message
    addUserMessage(text);

    // Show typing indicator
    showTyping();

    // Build history (exclude the current messages to avoid duplication)
    var history = state.messages.slice(-20).map(function (m) {
      return { role: m.role === 'user' ? 'user' : 'model', content: m.content };
    });

    state.messages.push({ role: 'user', content: text });

    var apiUrl = config.baseUrl + '/api/v1/chat/message/';

    console.log('[Chatbot Widget] Sending message to:', apiUrl);

    // Use AbortController with 30s timeout
    var controller = new AbortController();
    state.abortController = controller;
    var timeoutId = setTimeout(function () {
      controller.abort();
      console.warn('[Chatbot Widget] Request timed out after 30s');
    }, 30000);

    fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + config.apiKey,
      },
      body: JSON.stringify({
        message: text,
        session_id: state.sessionId,
        history: history,
        role: getCurrentRole(),
      }),
      signal: controller.signal,
      mode: 'cors',
      credentials: 'omit',
    })
    .then(function (res) {
      clearTimeout(timeoutId);
      if (!res.ok) {
        return res.json().then(function (data) {
          throw new Error(data.detail || data.error || 'Request failed (' + res.status + ')');
        });
      }
      return res.json();
    })
    .then(function (data) {
      hideTyping();
      if (data.message) {
        addBotMessage(data.message, data.navigations || []);
        state.messages.push({ role: 'bot', content: data.message });
      }
      state.sending = false;
      state.abortController = null;

      // If popup is closed, increment unread
      if (!state.open) {
        state.unread++;
        updateUnreadBadge();
      }
    })
    .catch(function (err) {
      clearTimeout(timeoutId);
      hideTyping();
      console.error('[Chatbot Widget] Error:', err);
      addBotMessage('⚠️ ' + (err.name === 'AbortError' ? 'Request timed out. Please try again.' : 'Connection error: ' + err.message));
      state.sending = false;
      state.abortController = null;
    });
  }

  function updateUnreadBadge() {
    if (!unreadBadge) return;
    if (state.unread > 0) {
      unreadBadge.innerHTML = state.unread > 99 ? '99+' : String(state.unread);
      unreadBadge.style.opacity = '1';
      unreadBadge.style.transform = 'scale(1)';
    } else {
      unreadBadge.style.opacity = '0';
      unreadBadge.style.transform = 'scale(0)';
    }
  }

  // ── Escape HTML ──
  function escapeHtml(text) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
  }

  // ── Inject Animations ──
  function injectAnimations() {
    var styleEl = document.createElement('style');
    styleEl.innerHTML = [
      '@keyframes chatbotFadeIn {',
      '  from { opacity: 0; transform: translateY(8px); }',
      '  to { opacity: 1; transform: translateY(0); }',
      '}',
      '@keyframes chatbotBounce {',
      '  0%, 80%, 100% { transform: translateY(0); }',
      '  40% { transform: translateY(-6px); }',
      '}',
      '#chatbot-saas-widget-container * {',
      '  box-sizing: border-box;',
      '}',
    ].join('\n');
    document.head.appendChild(styleEl);
  }

  // ── Initialize ──
  function init() {
    injectAnimations();

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        buildWidget();
        bubble.addEventListener('click', toggleWidget);
      });
    } else {
      buildWidget();
      bubble.addEventListener('click', toggleWidget);
    }
  }

  init();
})();
