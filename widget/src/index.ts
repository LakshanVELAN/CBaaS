import { ChatbotConfig, loadConfig } from './config';
import { ChatWidget } from './ui';

function init() {
  const config = loadConfig();
  if (!config) {
    console.error('[Chatbot] Missing window.ChatbotConfig or apiKey');
    return;
  }

  const widget = new ChatWidget(config);
  widget.mount();

  // Listen for navigation events from the widget
  window.addEventListener('dlc:navigate', ((e: CustomEvent) => {
    if (e.detail?.route) {
      const route = e.detail.route;
      // If it's an absolute URL, navigate to it; otherwise use pushState for SPA
      if (route.startsWith('http')) {
        window.location.href = route;
      } else {
        window.history.pushState({}, '', route);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    }
  }) as EventListener);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
