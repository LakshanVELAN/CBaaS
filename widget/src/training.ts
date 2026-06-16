/**
 * Page Training Service for the chatbot widget.
 * Automatically scans the current page DOM and trains the backend
 * with page knowledge on load and route changes.
 */
import { extractPageKnowledge } from './knowledge';

interface TrainingPayload {
  route: string;
  role: string;
  page_knowledge: ReturnType<typeof extractPageKnowledge>;
}

function stableStringify(obj: any): string {
  const seen = new WeakSet();
  return JSON.stringify(obj, (_key, value) => {
    if (value && typeof value === 'object') {
      if (seen.has(value)) return;
      seen.add(value);
      if (!Array.isArray(value)) {
        return Object.keys(value).sort().reduce((acc: any, k) => {
          acc[k] = value[k];
          return acc;
        }, {});
      }
    }
    return value;
  });
}

function debounce<T extends (...args: any[]) => any>(fn: T, wait = 500): T {
  let t: ReturnType<typeof setTimeout> | null = null;
  return ((...args: any[]) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  }) as T;
}

async function sha256Hex(str: string): Promise<string> {
  const enc = new TextEncoder().encode(str);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function trainCurrentPage(options: {
  role: string;
  route: string;
  apiKey: string;
  baseUrl: string;
}): Promise<void> {
  const { role, route, apiKey, baseUrl } = options;

  const extracted = extractPageKnowledge({ role, route });

  const page_knowledge: any = {
    page_title: extracted.page_title,
    route: extracted.route,
    breadcrumbs: extracted.breadcrumbs,
    sections: extracted.sections,
    actions: extracted.actions,
    buttons: extracted.buttons,
    tables: extracted.tables,
    forms: extracted.forms,
    workflow_steps: extracted.workflow_steps,
    instructional_text: extracted.instructional_text,
  };

  const body: TrainingPayload = {
    route: extracted.route,
    role: role ?? 'guest',
    page_knowledge,
  };

  try {
    const url = `${baseUrl.replace(/\/+$/, '')}/api/v1/chat/train-page-widget/`;
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.error('[Chatbot] Page training failed:', err);
  }
}

async function getPageTrainingFingerprint(options: {
  role: string;
  route: string;
}): Promise<string> {
  const { role, route } = options;
  const extracted = extractPageKnowledge({ role, route });
  const minimal = {
    route: extracted.route,
    role,
    page_title: extracted.page_title,
    actions: extracted.actions,
    buttons: extracted.buttons,
    forms: extracted.forms,
    instructional_text: extracted.instructional_text,
    breadcrumbs: extracted.breadcrumbs,
    tables: extracted.tables,
  };
  const str = stableStringify(minimal);
  return sha256Hex(str);
}

/**
 * Initialize automatic page training for the widget.
 * Monitors route changes (popstate, pushState, replaceState)
 * and DOM mutations to keep the backend trained on current page content.
 */
export function initPageTraining(options: {
  role: string;
  apiKey: string;
  baseUrl: string;
  debounceMs?: number;
  minTrainingIntervalMs?: number;
}): () => void {
  const {
    role,
    apiKey,
    baseUrl,
    debounceMs = 700,
    minTrainingIntervalMs = 2500,
  } = options;

  let lastTrained = { fingerprint: '', at: 0 };
  let running = false;
  let routeRef = window.location.pathname;

  const doTrain = async (route: string) => {
    if (running) return;
    if (!route) return;
    running = true;
    try {
      const now = Date.now();
      if (now - (lastTrained.at || 0) < minTrainingIntervalMs) return;

      const currentRole = (window as any).SaaS_User_Role || role;

      const fingerprint = await getPageTrainingFingerprint({ role: currentRole, route });
      const cacheKey = `dl_page_train_fp:${currentRole}:${route}`;
      const prev = sessionStorage.getItem(cacheKey);
      if (prev && prev === fingerprint) {
        lastTrained = { fingerprint, at: now };
        return;
      }

      await trainCurrentPage({ role: currentRole, route, apiKey, baseUrl });
      sessionStorage.setItem(cacheKey, fingerprint);
      lastTrained = { fingerprint, at: now };
    } catch (err) {
      console.error('[Chatbot] Training error:', err);
    } finally {
      running = false;
    }
  };

  const debouncedTrain = debounce(doTrain, debounceMs);

  const currentRoute = window.location.pathname;
  routeRef = currentRoute;
  debouncedTrain(currentRoute);

  // Observe DOM changes
  const obs = new MutationObserver(() => {
    const current = window.location.pathname;
    if (current !== routeRef) routeRef = current;
    debouncedTrain(routeRef);
  });
  obs.observe(document.body, { childList: true, subtree: true });

  // Listen to SPA route changes
  const onPopState = () => {
    const newRoute = window.location.pathname;
    routeRef = newRoute;
    debouncedTrain(newRoute);
  };
  window.addEventListener('popstate', onPopState);

  // Monkey-patch pushState/replaceState
  const origPush = history.pushState;
  const origReplace = history.replaceState;
  const wrapHistory = (original: typeof history.pushState) =>
    function (this: History, ...args: Parameters<typeof history.pushState>) {
      const ret = original.apply(this, args);
      const newRoute = window.location.pathname;
      routeRef = newRoute;
      debouncedTrain(newRoute);
      return ret;
    };
  history.pushState = wrapHistory(origPush);
  history.replaceState = wrapHistory(origReplace);

  // Return cleanup function
  return () => {
    obs.disconnect();
    window.removeEventListener('popstate', onPopState);
    history.pushState = origPush;
    history.replaceState = origReplace;
  };
}
