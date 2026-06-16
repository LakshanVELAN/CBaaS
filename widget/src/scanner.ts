/**
 * DOM scanning utilities for extracting page knowledge from the widget.
 * Filters noise elements, checks visibility, extracts accessible names.
 */

const MAX_TEXT_LENGTH = 2000;

// ── Noise Filtering ──

const NOISE_PATTERNS = [
  'footer', 'header', 'nav-', '-nav', 'privacy', 'terms', 'cookie',
  'newsletter', 'contact', 'legal', 'copyright', 'disclaimer',
  'social-links', 'sidebar', 'advert', 'promo', 'banner-',
  'utility', 'supplemental', 'modal-backdrop', 'cookie-consent',
];

const NOISE_TAGS = ['footer', 'header', 'nav', 'aside', 'style', 'script', 'noscript', 'iframe', 'canvas', 'svg'];
const NOISE_ROLES = ['navigation', 'banner', 'contentinfo', 'complementary', 'alert', 'presentation'];

function isNoiseElement(el: Element): boolean {
  const tag = el.tagName?.toLowerCase() || '';
  const className = (el.className || '').toString().toLowerCase();
  const id = (el.id || '').toLowerCase();
  const role = (el.getAttribute('role') || '').toLowerCase();

  if (NOISE_TAGS.includes(tag)) return true;
  if (NOISE_ROLES.includes(role)) return true;

  for (const pattern of NOISE_PATTERNS) {
    if (className.includes(pattern) || id.includes(pattern)) return true;
  }

  if (!el.textContent?.trim()) return true;

  const rect = el.getBoundingClientRect();
  if (rect.width < 10 && rect.height < 10) {
    const t = normalizeText(el.textContent || '');
    if (!isTextMeaningful(t)) return true;
  }

  return false;
}

// ── Exported Functions ──

export function elementIsVisible(el: Element): boolean {
  if (!el || !(el instanceof Element)) return false;
  if (isNoiseElement(el)) return false;

  const style = window.getComputedStyle(el);
  if (!style) return false;
  if (style.display === 'none' || style.visibility === 'hidden') return false;
  if (style.opacity === '0' || parseFloat(style.opacity) === 0) return false;

  const rect = el.getBoundingClientRect();
  if (!rect) return false;

  if (rect.width < 8 && rect.height < 8) {
    const t = normalizeText(el.textContent || '');
    if (!isTextMeaningful(t)) return false;
  }

  return rect.bottom > 0 && rect.right > 0 &&
    rect.top < window.innerHeight && rect.left < window.innerWidth &&
    (rect.width > 0 || rect.height > 0);
}

export function normalizeText(input: string): string {
  return (input ?? '').toString()
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function clampText(input: string, maxLen = MAX_TEXT_LENGTH): string {
  const s = normalizeText(input);
  if (!s) return '';
  return s.length > maxLen ? s.slice(0, maxLen) : s;
}

export function isTextMeaningful(text: string): boolean {
  const s = normalizeText(text);
  if (!s || s.length < 2) return false;

  const lowered = s.toLowerCase();
  const blacklist = [
    'icon', 'menu', 'more', 'more...', 'settings', 'filter', 'search',
    'close', 'x', '⋮', '…', 'open', 'show', 'hide', 'toggle',
    'expand', 'collapse', 'submit', 'cancel', 'reset', 'clear', 'refresh', 'reload',
  ];
  if (blacklist.includes(lowered)) return false;
  if (/^[\s\W]*$/.test(s)) return false;

  return true;
}

export function dedupeStrings(items: string[], maxItems = 200): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const it of items) {
    const s = normalizeText(it);
    if (!isTextMeaningful(s)) continue;
    const key = s.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
    if (out.length >= maxItems) break;
  }
  return out;
}

export function getAccessibleName(el: Element): string {
  if (!el) return '';

  const ariaLabel = el.getAttribute('aria-label');
  if (ariaLabel && isTextMeaningful(ariaLabel)) return ariaLabel;

  const ariaLabelledby = el.getAttribute('aria-labelledby');
  if (ariaLabelledby) {
    const ids = ariaLabelledby.split(/\s+/).filter(Boolean);
    const parts = ids
      .map(id => document.getElementById(id))
      .filter(Boolean)
      .map(node => normalizeText(node!.textContent || ''));
    const combined = parts.filter(Boolean).join(' ');
    if (combined && isTextMeaningful(combined)) return combined;
  }

  if (el.id) {
    const label = document.querySelector(`label[for="${el.id}"]`);
    const t = label ? normalizeText(label.textContent || '') : '';
    if (t && isTextMeaningful(t)) return t;
  }

  return el.textContent || '';
}

export function safeOuterText(el: Element): string {
  if (!el) return '';

  const name = getAccessibleName(el);
  if (name) return clampText(name);

  const ariaLabel = el.getAttribute('aria-label');
  if (ariaLabel && isTextMeaningful(ariaLabel)) return clampText(ariaLabel);

  const testid = el.getAttribute('data-testid');
  if (testid && isTextMeaningful(testid)) return clampText(testid);

  return clampText(el.textContent || '');
}

export function elementText(el: Element): string {
  return normalizeText(el.textContent || '');
}

export function extractTableHeaders(tableEl: Element): string[] {
  if (!tableEl) return [];
  const headers: string[] = [];
  const thEls = tableEl.querySelectorAll('th');
  thEls.forEach(th => {
    if (!elementIsVisible(th)) return;
    const t = safeOuterText(th);
    if (t) headers.push(t);
  });
  return dedupeStrings(headers, 50);
}
