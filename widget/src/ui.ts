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
      [data-dlc] { all: initial; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
      [data-dlc] * { box-sizing: border-box; }
      .dlc-fab {
        position: fixed;
        ${this.config.position === 'bottom-left' ? 'left: 20px' : 'right: 20px'};
        bottom: 20px;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: ${this.config.primaryColor};
        color: white;
        border: none;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.25);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2147483647;
        transition: transform 0.2s, box-shadow 0.2s;
      }
      .dlc-fab:hover { transform: scale(1.1); box-shadow: 0 6px 20px rgba(0,0,0,0.3); }
      .dlc-panel {
        position: fixed;
        ${this.config.position === 'bottom-left' ? 'left: 20px' : 'right: 20px'};
        bottom: 84px;
        width: 380px;
        height: 580px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 30px rgba(0,0,0,0.2);
        display: none;
        flex-direction: column;
        overflow: hidden;
        z-index: 2147483646;
        font-size: 14px;
        color: #333;
      }
      .dlc-panel.open { display: flex; }
      .dlc-header {
        background: ${this.config.primaryColor};
        color: white;
        padding: 16px;
        font-weight: 600;
        font-size: 16px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .dlc-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .dlc-msg {
        max-width: 80%;
        padding: 10px 14px;
        border-radius: 12px;
        line-height: 1.5;
        word-wrap: break-word;
      }
      .dlc-msg.user {
        align-self: flex-end;
        background: ${this.config.primaryColor};
        color: white;
        border-bottom-right-radius: 4px;
      }
      .dlc-msg.bot {
        align-self: flex-start;
        background: #f3f4f6;
        color: #333;
        border-bottom-left-radius: 4px;
      }
      .dlc-msg.bot strong { font-weight: 600; }
      .dlc-msg.bot code {
        background: #e5e7eb;
        padding: 2px 4px;
        border-radius: 3px;
        font-size: 13px;
      }
      .dlc-msg.bot ul, .dlc-msg.bot ol {
        margin: 8px 0;
        padding-left: 20px;
      }
      .dlc-msg.bot li { margin-bottom: 4px; }
      .dlc-input-area {
        padding: 12px;
        border-top: 1px solid #e5e7eb;
        display: flex;
        gap: 8px;
        align-items: flex-end;
      }
      .dlc-input {
        flex: 1;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        padding: 10px 12px;
        font-size: 14px;
        resize: none;
        outline: none;
        font-family: inherit;
        min-height: 40px;
        max-height: 120px;
      }
      .dlc-input:focus { border-color: ${this.config.primaryColor}; }
      .dlc-send {
        background: ${this.config.primaryColor};
        color: white;
        border: none;
        border-radius: 8px;
        padding: 10px 16px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        white-space: nowrap;
      }
      .dlc-send:disabled { opacity: 0.5; cursor: not-allowed; }
      .dlc-typing {
        display: flex;
        gap: 4px;
        padding: 10px 14px;
        align-self: flex-start;
      }
      .dlc-typing span {
        width: 8px; height: 8px;
        background: #9ca3af;
        border-radius: 50%;
        animation: dlc-bounce 1.4s infinite ease-in-out both;
      }
      .dlc-typing span:nth-child(1) { animation-delay: -0.32s; }
      .dlc-typing span:nth-child(2) { animation-delay: -0.16s; }
      @keyframes dlc-bounce {
        0%, 80%, 100% { transform: scale(0); }
        40% { transform: scale(1); }
      }
      .dlc-route-pill {
        display: inline-block;
        margin-top: 8px;
        padding: 6px 14px;
        background: white;
        color: ${this.config.primaryColor};
        border: 1px solid ${this.config.primaryColor};
        border-radius: 99px;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        text-decoration: none;
        transition: background 0.15s, color 0.15s;
      }
      .dlc-route-pill:hover {
        background: ${this.config.primaryColor};
        color: white;
      }
      .dlc-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 10px;
      }
      .dlc-chip {
        padding: 8px 14px;
        background: white;
        color: #333;
        border: 1px solid #dadce0;
        border-radius: 8px;
        font-size: 13px;
        cursor: pointer;
        transition: background 0.15s, border-color 0.15s;
      }
      .dlc-chip:hover { background: #f1f3f4; border-color: #dadce0; }
      .dlc-welcome-title {
        font-size: 20px;
        font-weight: 400;
        color: #1f1f1f;
        margin-bottom: 8px;
      }
      .dlc-welcome-desc {
        font-size: 14px;
        color: #5f6368;
        margin-bottom: 16px;
        line-height: 1.4;
      }
      @media (max-width: 600px) {
        .dlc-panel {
          width: 100vw;
          height: 100vh;
          bottom: 0;
          left: 0;
          right: 0;
          border-radius: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  private createFAB() {
    const fab = document.createElement('button');
    fab.setAttribute('data-dlc', '');
    fab.className = 'dlc-fab';
    fab.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;
    fab.onclick = () => this.toggle();
    document.body.appendChild(fab);
  }

  private toggle() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.createPanel();
      this.panel!.classList.add('open');
    } else if (this.panel) {
      this.panel.classList.remove('open');
    }
  }

  private createPanel() {
    if (this.panel) return;

    const panel = document.createElement('div');
    panel.setAttribute('data-dlc', '');
    panel.className = 'dlc-panel';

    const header = document.createElement('div');
    header.className = 'dlc-header';
    header.textContent = this.config.botName;

    const messages = document.createElement('div');
    messages.className = 'dlc-messages';

    const inputArea = document.createElement('div');
    inputArea.className = 'dlc-input-area';

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
      input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    });

    const sendBtn = document.createElement('button');
    sendBtn.className = 'dlc-send';
    sendBtn.textContent = 'Send';
    sendBtn.onclick = () => this.handleSend();

    inputArea.appendChild(input);
    inputArea.appendChild(sendBtn);

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

  private showWelcome() {
    if (!this.messagesEl) return;

    const welcomeMsg = this.config.welcomeMessage || `Hi! I'm ${this.config.botName}. How can I help you today?`;

    const emptyWrap = document.createElement('div');
    emptyWrap.style.cssText = 'display: flex; flex-direction: column; justify-content: center; gap: 12px; padding: 20px 0;';

    const title = document.createElement('div');
    title.className = 'dlc-welcome-title';
    title.innerHTML = `<span style="background: linear-gradient(90deg, #4285F4, #9b51e0, #ea4335); -webkit-background-clip: text; -webkit-text-fill: transparent; font-weight: 500;">Hello!</span><br/>${welcomeMsg}`;

    const desc = document.createElement('div');
    desc.className = 'dlc-welcome-desc';
    desc.textContent = 'Ask about features, navigation, or anything on this site.';

    emptyWrap.appendChild(title);
    emptyWrap.appendChild(desc);

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
      emptyWrap.appendChild(chipRow);
    }

    this.messagesEl.appendChild(emptyWrap);
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
    msg.innerHTML = renderMarkdown(text);

    if (sender === 'bot') {
      const navs = navigations && navigations.length > 0
        ? navigations
        : route
          ? [{ url: route, title: route_name || 'Open Page' }]
          : [];

      if (navs.length > 0) {
        const navContainer = document.createElement('div');
        navContainer.style.cssText = 'margin-top: 8px; display: flex; flex-wrap: wrap; gap: 6px;';
        navs.forEach((nav) => {
          const pill = document.createElement('a');
          pill.className = 'dlc-route-pill';
          pill.textContent = `→ ${nav.title}`;
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
    if (!this.messagesEl) return;
    const typing = document.createElement('div');
    typing.className = 'dlc-typing';
    typing.innerHTML = '<span></span><span></span><span></span>';
    this.messagesEl.appendChild(typing);
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
    return typing;
  }

  private hideTyping(typing: HTMLElement | undefined) {
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
