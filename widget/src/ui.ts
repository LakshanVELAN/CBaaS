import { ChatbotConfig } from './config';
import { getSessionId } from './session';
import { sendMessage, ChatRequest } from './api';
import { renderMarkdown } from './renderer';
import { extractPageKnowledge } from './knowledge';

interface Message {
  sender: 'user' | 'bot';
  text: string;
  route?: string;
  route_name?: string;
  navigations?: Array<{ url: string; title: string }>;
}

export class ChatWidget {
  private config: ChatbotConfig;
  private panel: HTMLDivElement | null = null;
  private messagesEl: HTMLDivElement | null = null;
  private inputEl: HTMLTextAreaElement | null = null;
  private isOpen = false;
  private history: Message[] = [];
  private sendBtn: HTMLButtonElement | null = null;
  private fab: HTMLButtonElement | null = null;

  constructor(config: ChatbotConfig) {
    this.config = config;
  }

  mount() {
    this.injectStyles();
    this.createFAB();
  }

  private injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      [data-dlc] { all: initial; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
      [data-dlc] * { box-sizing: border-box; }
      .dlc-fab {
        position: fixed;
        ${this.config.position === 'bottom-left' ? 'left: 20px' : 'right: 20px'};
        bottom: 20px;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: linear-gradient(135deg, ${this.config.primaryColor}, ${this.adjustColor(this.config.primaryColor, -30)});
        color: white;
        border: none;
        cursor: pointer;
        box-shadow: 0 4px 16px ${this.config.primaryColor}44;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2147483647;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .dlc-fab:hover { transform: scale(1.08); box-shadow: 0 8px 24px ${this.config.primaryColor}66; }
      .dlc-fab.open { transform: scale(0.9); opacity: 0.8; }
      .dlc-panel {
        position: fixed;
        ${this.config.position === 'bottom-left' ? 'left: 20px' : 'right: 20px'};
        bottom: 84px;
        width: 380px;
        height: 580px;
        max-height: calc(100vh - 120px);
        background: #ffffff;
        border-radius: 16px;
        box-shadow: 0 8px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08);
        display: none;
        flex-direction: column;
        overflow: hidden;
        z-index: 2147483646;
        font-size: 14px;
        color: #1f2937;
        animation: dlc-slide-up 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      }
      @keyframes dlc-slide-up {
        from { opacity: 0; transform: translateY(12px) scale(0.97); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      .dlc-panel.open { display: flex; }
      .dlc-header {
        background: linear-gradient(135deg, ${this.config.primaryColor}, ${this.adjustColor(this.config.primaryColor, -30)});
        color: white;
        padding: 18px 20px;
        display: flex;
        align-items: center;
        gap: 10px;
        flex-shrink: 0;
      }
      .dlc-header-avatar {
        width: 34px;
        height: 34px;
        border-radius: 50%;
        background: rgba(255,255,255,0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .dlc-header-info { flex: 1; min-width: 0; }
      .dlc-header-name { font-weight: 600; font-size: 15px; }
      .dlc-header-status { font-size: 11px; opacity: 0.8; display: flex; align-items: center; gap: 4px; }
      .dlc-header-status-dot { width: 6px; height: 6px; border-radius: 50%; background: #4ade80; display: inline-block; }
      .dlc-header-close {
        width: 28px; height: 28px; border-radius: 8px;
        background: rgba(255,255,255,0.15);
        border: none; color: white; cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        transition: background 0.15s; flex-shrink: 0;
      }
      .dlc-header-close:hover { background: rgba(255,255,255,0.25); }
      .dlc-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        background: #f9fafb;
      }
      .dlc-messages::-webkit-scrollbar { width: 4px; }
      .dlc-messages::-webkit-scrollbar-track { background: transparent; }
      .dlc-messages::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 2px; }
      .dlc-msg {
        max-width: 85%;
        padding: 10px 14px;
        border-radius: 14px;
        line-height: 1.55;
        word-wrap: break-word;
        animation: dlc-msg-in 0.2s ease-out;
      }
      @keyframes dlc-msg-in {
        from { opacity: 0; transform: translateY(6px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .dlc-msg.user {
        align-self: flex-end;
        background: linear-gradient(135deg, ${this.config.primaryColor}, ${this.adjustColor(this.config.primaryColor, -20)});
        color: white;
        border-bottom-right-radius: 4px;
      }
      .dlc-msg.bot {
        align-self: flex-start;
        background: white;
        color: #1f2937;
        border-bottom-left-radius: 4px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      }
      .dlc-msg.bot strong { font-weight: 600; }
      .dlc-msg.bot code {
        background: #f3f4f6;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 13px;
        font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
        color: #ef4444;
      }
      .dlc-msg.bot ul, .dlc-msg.bot ol {
        margin: 6px 0;
        padding-left: 20px;
      }
      .dlc-msg.bot li { margin-bottom: 3px; }
      .dlc-msg.bot p { margin: 6px 0; }
      .dlc-msg.bot p:first-child { margin-top: 0; }
      .dlc-msg.bot p:last-child { margin-bottom: 0; }
      .dlc-input-area {
        padding: 12px 14px;
        border-top: 1px solid #e5e7eb;
        display: flex;
        gap: 8px;
        align-items: flex-end;
        background: white;
        flex-shrink: 0;
      }
      .dlc-input-wrap {
        flex: 1;
        display: flex;
        align-items: flex-end;
        border: 1px solid #d1d5db;
        border-radius: 12px;
        padding: 4px 4px 4px 14px;
        background: #f9fafb;
        transition: border-color 0.15s, box-shadow 0.15s;
      }
      .dlc-input-wrap:focus-within {
        border-color: ${this.config.primaryColor};
        box-shadow: 0 0 0 3px ${this.config.primaryColor}22;
        background: white;
      }
      .dlc-input {
        flex: 1;
        border: none;
        background: transparent;
        padding: 8px 0;
        font-size: 14px;
        resize: none;
        outline: none;
        font-family: inherit;
        min-height: 24px;
        max-height: 100px;
        color: #1f2937;
        line-height: 1.4;
      }
      .dlc-input::placeholder { color: #9ca3af; }
      .dlc-send {
        background: ${this.config.primaryColor};
        color: white;
        border: none;
        border-radius: 10px;
        padding: 8px 12px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        white-space: nowrap;
        display: flex;
        align-items: center;
        gap: 4px;
        transition: opacity 0.15s, transform 0.15s;
        flex-shrink: 0;
      }
      .dlc-send:hover { opacity: 0.9; transform: scale(1.03); }
      .dlc-send:active { transform: scale(0.97); }
      .dlc-send:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
      .dlc-typing {
        display: flex;
        gap: 5px;
        padding: 12px 16px;
        align-self: flex-start;
        background: white;
        border-radius: 14px;
        border-bottom-left-radius: 4px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      }
      .dlc-typing span {
        width: 8px; height: 8px;
        background: #9ca3af;
        border-radius: 50%;
        display: inline-block;
        animation: dlc-bounce 1.4s infinite ease-in-out both;
      }
      .dlc-typing span:nth-child(1) { animation-delay: -0.32s; }
      .dlc-typing span:nth-child(2) { animation-delay: -0.16s; }
      @keyframes dlc-bounce {
        0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
        40% { transform: scale(1); opacity: 1; }
      }
      .dlc-nav-pills {
        margin-top: 10px;
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      .dlc-nav-pill {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 6px 14px;
        background: white;
        color: ${this.config.primaryColor};
        border: 1.5px solid ${this.config.primaryColor}33;
        border-radius: 99px;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        text-decoration: none;
        transition: all 0.2s ease;
      }
      .dlc-nav-pill:hover {
        background: ${this.config.primaryColor};
        color: white;
        border-color: ${this.config.primaryColor};
        transform: translateY(-1px);
        box-shadow: 0 2px 8px ${this.config.primaryColor}44;
      }
      .dlc-nav-pill svg { width: 12px; height: 12px; flex-shrink: 0; }
      .dlc-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 12px;
      }
      .dlc-chip {
        padding: 8px 16px;
        background: white;
        color: #374151;
        border: 1px solid #e5e7eb;
        border-radius: 10px;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.15s;
        box-shadow: 0 1px 2px rgba(0,0,0,0.04);
      }
      .dlc-chip:hover {
        background: ${this.config.primaryColor};
        color: white;
        border-color: ${this.config.primaryColor};
        transform: translateY(-1px);
        box-shadow: 0 2px 8px ${this.config.primaryColor}33;
      }
      .dlc-welcome {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 8px;
        padding: 32px 20px 20px;
        text-align: center;
      }
      .dlc-welcome-icon {
        width: 56px; height: 56px;
        border-radius: 50%;
        background: linear-gradient(135deg, ${this.config.primaryColor}22, ${this.adjustColor(this.config.primaryColor, -30)}22);
        display: flex; align-items: center; justify-content: center;
        margin-bottom: 4px;
      }
      .dlc-welcome-title {
        font-size: 18px;
        font-weight: 600;
        color: #111827;
        line-height: 1.3;
      }
      .dlc-welcome-title span { font-weight: 500; }
      .dlc-welcome-desc {
        font-size: 13px;
        color: #6b7280;
        line-height: 1.5;
        max-width: 280px;
      }
      @media (max-width: 600px) {
        .dlc-panel {
          width: 100vw;
          height: 100vh;
          max-height: 100vh;
          bottom: 0;
          left: 0;
          right: 0;
          border-radius: 0;
        }
        .dlc-fab { bottom: 16px; ${this.config.position === 'bottom-left' ? 'left: 16px' : 'right: 16px'}; }
        .dlc-nav-pill { padding: 8px 16px; font-size: 13px; }
      }
    `;
    document.head.appendChild(style);
  }

  private adjustColor(hex: string, amount: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, Math.max(0, ((num >> 16) & 0xFF) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0xFF) + amount));
    const b = Math.min(255, Math.max(0, (num & 0xFF) + amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  }

  private chatIconSvg(): string {
    return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;
  }

  private closeIconSvg(): string {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
  }

  private arrowUpSvg(): string {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>`;
  }

  private externalLinkSvg(): string {
    return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`;
  }

  private robotSvg(): string {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>`;
  }

  private createFAB() {
    const fab = document.createElement('button');
    fab.setAttribute('data-dlc', '');
    fab.className = 'dlc-fab';
    fab.innerHTML = this.chatIconSvg();
    fab.onclick = () => this.toggle();
    document.body.appendChild(fab);
    this.fab = fab;
  }

  private toggle() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.createPanel();
      this.panel!.classList.add('open');
      if (this.fab) this.fab.classList.add('open');
    } else if (this.panel) {
      this.panel.classList.remove('open');
      if (this.fab) this.fab.classList.remove('open');
    }
  }

  private createPanel() {
    if (this.panel) return;

    const panel = document.createElement('div');
    panel.setAttribute('data-dlc', '');
    panel.className = 'dlc-panel';

    // Header
    const header = document.createElement('div');
    header.className = 'dlc-header';
    header.innerHTML = `
      <div class="dlc-header-avatar">${this.robotSvg()}</div>
      <div class="dlc-header-info">
        <div class="dlc-header-name">${this.escapeHtml(this.config.botName)}</div>
        <div class="dlc-header-status"><span class="dlc-header-status-dot"></span> Online</div>
      </div>
    `;
    const closeBtn = document.createElement('button');
    closeBtn.className = 'dlc-header-close';
    closeBtn.innerHTML = this.closeIconSvg();
    closeBtn.onclick = () => this.toggle();
    header.appendChild(closeBtn);

    // Messages
    const messages = document.createElement('div');
    messages.className = 'dlc-messages';

    // Input area
    const inputArea = document.createElement('div');
    inputArea.className = 'dlc-input-area';

    const inputWrap = document.createElement('div');
    inputWrap.className = 'dlc-input-wrap';

    const input = document.createElement('textarea');
    input.className = 'dlc-input';
    input.placeholder = 'Type a message...';
    input.rows = 1;
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleSend();
      }
    });
    input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 100) + 'px';
    });

    const sendBtn = document.createElement('button');
    sendBtn.className = 'dlc-send';
    sendBtn.innerHTML = this.arrowUpSvg();
    sendBtn.title = 'Send message';
    sendBtn.onclick = () => this.handleSend();

    inputWrap.appendChild(input);
    inputWrap.appendChild(sendBtn);
    inputArea.appendChild(inputWrap);

    panel.appendChild(header);
    panel.appendChild(messages);
    panel.appendChild(inputArea);
    document.body.appendChild(panel);

    this.panel = panel;
    this.messagesEl = messages;
    this.inputEl = input;
    this.sendBtn = sendBtn;

    this.showWelcome();
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private showWelcome() {
    if (!this.messagesEl) return;

    const welcomeMsg = this.config.welcomeMessage || `Hi! I'm ${this.config.botName}. How can I help you today?`;

    const wrap = document.createElement('div');
    wrap.className = 'dlc-welcome';

    wrap.innerHTML = `
      <div class="dlc-welcome-icon">${this.robotSvg()}</div>
      <div class="dlc-welcome-title">${this.escapeHtml(welcomeMsg)}</div>
      <div class="dlc-welcome-desc">Ask about features, navigation, or anything on this site.</div>
    `;

    const chips = this.config.suggestionChips || ['What can I do here?'];
    if (chips.length > 0) {
      const chipRow = document.createElement('div');
      chipRow.className = 'dlc-chips';
      chips.forEach(q => {
        const chip = document.createElement('div');
        chip.className = 'dlc-chip';
        chip.textContent = q;
        chip.onclick = () => {
          this.inputEl!.value = q;
          this.handleSend();
        };
        chipRow.appendChild(chip);
      });
      wrap.appendChild(chipRow);
    }

    this.messagesEl.appendChild(wrap);
  }

  private addMessage(
    sender: 'user' | 'bot',
    text: string,
    route?: string,
    route_name?: string,
    navigations?: Array<{ url: string; title: string }>,
  ) {
    if (!this.messagesEl) return;

    const msg = document.createElement('div');
    msg.className = `dlc-msg ${sender}`;

    if (sender === 'user') {
      msg.textContent = text;
    } else {
      msg.innerHTML = renderMarkdown(text);

      // Build navigation pills from AI-suggested navigations
      // Only show pills when there are REAL navigation suggestions
      // (not trivial routes like / or #)
      const hasRealNavigations = navigations && navigations.length > 0 &&
        navigations.some(n => n.url && n.url !== '/' && n.url !== '#' && n.title);

      if (hasRealNavigations) {
        const navContainer = document.createElement('div');
        navContainer.className = 'dlc-nav-pills';
        navigations!.forEach((nav) => {
          const pill = document.createElement('a');
          pill.className = 'dlc-nav-pill';
          pill.innerHTML = `${this.externalLinkSvg()} ${this.escapeHtml(nav.title)}`;
          pill.href = '#';
          pill.onclick = (e) => {
            e.preventDefault();
            window.dispatchEvent(new CustomEvent('dlc:navigate', { detail: { route: nav.url } }));
          };
          navContainer.appendChild(pill);
        });
        msg.appendChild(navContainer);
      }
    }

    this.messagesEl.appendChild(msg);
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
  }

  private showTyping() {
    if (!this.messagesEl) return null;
    const typing = document.createElement('div');
    typing.className = 'dlc-typing';
    typing.innerHTML = '<span></span><span></span><span></span>';
    this.messagesEl.appendChild(typing);
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
    return typing;
  }

  private hideTyping(typing: HTMLElement | null) {
    typing?.remove();
  }

  private buildWorkspaceContext(): Record<string, any> {
    try {
      const currentRole = (window as any).SaaS_User_Role || this.config.role;
      const knowledge = extractPageKnowledge({
        role: currentRole,
        route: window.location.pathname,
      });
      return {
        title: knowledge.page_title,
        current_page: window.location.pathname,
        headings: knowledge.headings.slice(0, 10),
        buttons: knowledge.buttons.slice(0, 10),
        sections: knowledge.sections.slice(0, 5),
        forms: knowledge.forms.slice(0, 5),
        workflows: knowledge.workflows.slice(0, 5),
        instructional_text: knowledge.instructional_text.slice(0, 5),
        breadcrumbs: knowledge.breadcrumbs,
        actions: knowledge.actions.slice(0, 10),
      };
    } catch {
      return {
        title: document.title,
        current_page: window.location.pathname,
        headings: Array.from(document.querySelectorAll('h1, h2, h3'))
          .map(el => el.textContent?.trim() || '')
          .filter(Boolean)
          .slice(0, 10),
        buttons: Array.from(document.querySelectorAll('button'))
          .map(el => el.textContent?.trim() || '')
          .filter(Boolean)
          .slice(0, 10),
      };
    }
  }

  private async handleSend() {
    const input = this.inputEl;
    const sendBtn = this.sendBtn;
    if (!input || !sendBtn) return;

    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    input.style.height = 'auto';
    this.addMessage('user', text);
    this.history.push({ sender: 'user', text });

    sendBtn.disabled = true;
    const typing = this.showTyping();

    try {
      const workspaceContext = this.buildWorkspaceContext();

      const currentRole = (window as any).SaaS_User_Role || this.config.role;
      const payload: ChatRequest = {
        message: text,
        session_id: getSessionId(),
        current_route: window.location.pathname,
        history: this.history.slice(-20).map((m) => ({
          sender: m.sender,
          text: m.text,
        })),
        role: currentRole,
        workspace_context: workspaceContext,
      };

      const response = await sendMessage(this.config.apiKey, this.config.baseUrl, payload);
      this.hideTyping(typing);
      this.addMessage('bot', response.message, response.route, response.route_name, response.navigations);
      this.history.push({
        sender: 'bot',
        text: response.message,
        route: response.route,
        route_name: response.route_name,
        navigations: response.navigations,
      });
    } catch (err) {
      this.hideTyping(typing);
      this.addMessage('bot', 'Sorry, something went wrong. Please try again.');
    } finally {
      sendBtn.disabled = false;
    }
  }
}
