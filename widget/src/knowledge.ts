import {
  normalizeText,
  clampText,
  dedupeStrings,
  elementIsVisible,
  safeOuterText,
  elementText,
  extractTableHeaders,
  isTextMeaningful,
} from './scanner';

interface SectionInfo {
  title: string;
  buttons: string[];
  forms: string[];
}

interface ButtonInfo {
  label: string;
  section: string | null;
  tagName: string;
}

interface FormInfo {
  label: string;
  section: string | null;
  fieldType?: string;
}

interface HeadingInfo {
  text: string;
  level: number;
  section: string | null;
}

export interface PageKnowledge {
  page_title: string;
  route: string;
  role: string | null;
  sections: Array<{ title: string; buttons: string[]; forms: string[] }>;
  actions: Array<{ label: string; section: string | null; type: string }>;
  buttons: string[];
  headings: string[];
  heading_details: HeadingInfo[];
  tables: string[];
  forms: string[];
  form_details: FormInfo[];
  workflows: Array<{ text: string; type: string }>;
  workflow_steps: string[];
  instructional_text: string[];
  breadcrumbs: string[];
}

function extractWorkflowSteps(): string[] {
  const workflowIndicators = [
    'step', 'first', 'second', 'third', 'next', 'then', 'after',
    'click', 'fill', 'enter', 'select', 'save', 'submit', 'upload',
    'create', 'edit', 'delete', 'confirm', 'complete', 'generate',
  ];

  const steps: string[] = [];

  const listItems = Array.from(document.querySelectorAll('ol li, ul li'))
    .filter(el => elementIsVisible(el));

  for (const li of listItems.slice(0, 40)) {
    const txt = clampText(elementText(li), 300);
    if (!txt || txt.length < 10) continue;
    const lowered = txt.toLowerCase();
    const isWorkflowStep = workflowIndicators.some(k => lowered.includes(k)) || /^\d+\./.test(txt);
    if (isWorkflowStep) steps.push(txt);
  }

  const stepHeadings = Array.from(document.querySelectorAll('h2, h3, [role="heading"]'))
    .filter(el => elementIsVisible(el))
    .map(el => safeOuterText(el))
    .filter(txt => {
      const lowered = txt.toLowerCase();
      return /step\s*\d/.test(lowered) || /phase\s*\d/.test(lowered);
    });

  steps.push(...stepHeadings.slice(0, 10));
  return dedupeStrings(steps, 25);
}

function extractSectionStructure(): SectionInfo[] {
  const sections: SectionInfo[] = [];
  const sectionEls = Array.from(document.querySelectorAll(
    'section, [role="region"], .card, .panel, .form-section'
  )).filter(el => elementIsVisible(el));

  for (const sec of sectionEls.slice(0, 30)) {
    const heading = sec.querySelector('h1,h2,h3,h4,[role="heading"],legend,.card-title,.section-title');
    if (!heading || !elementIsVisible(heading)) continue;
    const title = safeOuterText(heading);
    if (!title || title.length < 3) continue;

    const buttons = Array.from(sec.querySelectorAll('button, [role="button"], a.btn'))
      .filter(elementIsVisible)
      .map(safeOuterText)
      .filter(t => t && t.length > 2);

    const forms = Array.from(sec.querySelectorAll('form, [role="form"]'))
      .filter(elementIsVisible)
      .map(f => {
        const titleEl = f.querySelector('h1,h2,h3,legend,.form-title');
        return titleEl ? safeOuterText(titleEl) : safeOuterText(f);
      })
      .filter(t => t && t.length > 2);

    sections.push({
      title,
      buttons: dedupeStrings(buttons, 10),
      forms: dedupeStrings(forms, 8),
    });
  }
  return sections.slice(0, 20);
}

function extractPageInstructions(): string[] {
  const keywords = [
    'click', 'select', 'fill', 'enter', 'choose', 'upload',
    'save', 'submit', 'required', 'optional', 'note:', 'hint:',
    'first', 'then', 'next', 'after', 'finally', 'step',
  ];

  const nodes = Array.from(document.querySelectorAll(
    '.help-text, .hint, .instruction, .form-text, .alert-info, ' +
    'p, li, .step-description, .tooltip-content, .workflow-desc'
  )).filter(elementIsVisible);

  const out: string[] = [];
  for (const el of nodes.slice(0, 80)) {
    const t = clampText(elementText(el), 400);
    if (!t || t.length < 15) continue;
    const lowered = t.toLowerCase();
    const isWorkflowRelated = keywords.some(k => lowered.includes(k));
    const isShortEnough = t.length < 200;
    if (isWorkflowRelated || isShortEnough) out.push(t);
  }
  return dedupeStrings(out, 25);
}

function extractBreadcrumbs(): string[] {
  const candidates = [
    '[aria-label="breadcrumb"]',
    'nav[aria-label="breadcrumb"]',
    '.breadcrumb',
    '[role="navigation"][aria-label*="breadcrumb" i]',
    'ol.breadcrumb',
  ];

  let el: Element | null = null;
  for (const sel of candidates) {
    const match = document.querySelector(sel);
    if (match && elementIsVisible(match)) {
      el = match;
      break;
    }
  }
  if (!el) return [];

  const parts = Array.from(el.querySelectorAll('a, span, li'))
    .map(n => safeOuterText(n))
    .filter(t => isTextMeaningful(t));
  return dedupeStrings(parts, 10);
}

function findSectionForElement(el: Element, sections: SectionInfo[]): string | null {
  for (const sec of sections) {
    let parent = el.parentElement;
    while (parent && parent !== document.body) {
      const heading = parent.querySelector('h1,h2,h3,h4,[role="heading"]');
      if (heading && safeOuterText(heading) === sec.title) return sec.title;
      parent = parent.parentElement;
    }
  }
  return null;
}

/**
 * Extract structured page knowledge from the current DOM.
 * This is the main entry point called by the page training service.
 */
export function extractPageKnowledge(options: { route?: string; role?: string } = {}): PageKnowledge {
  const routePath = options.route ?? window.location.pathname;
  const pageTitle = normalizeText(document.title) || 'Untitled Page';
  const role = options.role ?? null;

  const sections = extractSectionStructure();
  const workflowSteps = extractWorkflowSteps();

  const buttonEls = Array.from(document.querySelectorAll(
    'button:not([type="hidden"]):not([type="reset"]), ' +
    '[role="button"]:not(.sr-only), ' +
    'input[type="submit"], ' +
    'a.btn-primary, a.btn-success, ' +
    'button[type="submit"], .btn-primary:not(.footer-btn)'
  )).filter(elementIsVisible);

  const buttons: ButtonInfo[] = [];
  for (const btn of buttonEls.slice(0, 50)) {
    const text = safeOuterText(btn);
    if (!text || text.length < 2 || !isTextMeaningful(text)) continue;
    buttons.push({
      label: text,
      section: findSectionForElement(btn, sections),
      tagName: btn.tagName?.toLowerCase() || 'button',
    });
  }

  const formEls = Array.from(document.querySelectorAll('form:not([hidden]), [role="form"]'))
    .filter(elementIsVisible);

  const forms: FormInfo[] = [];
  for (const f of formEls.slice(0, 10)) {
    const titleNode = f.querySelector('h1,h2,h3,legend,[role="heading"],.card-title,.form-title');
    const title = titleNode && elementIsVisible(titleNode) ? safeOuterText(titleNode) : null;
    const section = findSectionForElement(f, sections);

    if (title) {
      forms.push({ label: clampText(title, 160), section });
    }

    const inputs = f.querySelectorAll('input:not([type="hidden"]), textarea, select');
    for (const input of Array.from(inputs).slice(0, 15)) {
      if (!elementIsVisible(input)) continue;
      const label = input.getAttribute('aria-label') ||
        input.getAttribute('placeholder') ||
        input.getAttribute('name') ||
        input.getAttribute('title');
      if (label && isTextMeaningful(label) && label.length < 100) {
        forms.push({
          label,
          section,
          fieldType: input.getAttribute('type') || input.tagName.toLowerCase(),
        });
      }
    }
  }

  const headingEls = Array.from(document.querySelectorAll('h1, h2, h3, h4, [role="heading"]'))
    .filter(elementIsVisible);

  const headings: HeadingInfo[] = [];
  for (const h of headingEls.slice(0, 30)) {
    const text = safeOuterText(h);
    if (text && isTextMeaningful(text)) {
      headings.push({
        text,
        level: parseInt(h.tagName.substring(1)) || 2,
        section: findSectionForElement(h, sections),
      });
    }
  }

  const tableEls = Array.from(document.querySelectorAll('table:not([hidden])')).filter(elementIsVisible);
  const tableHeaders: string[] = [];
  for (const tEl of tableEls.slice(0, 10)) {
    const headers = extractTableHeaders(tEl);
    if (headers.length) tableHeaders.push(...headers);
  }

  const instructionalText = extractPageInstructions();

  const knowledge: PageKnowledge = {
    page_title: pageTitle,
    route: routePath,
    role,
    sections: sections.map(s => ({
      title: s.title,
      buttons: s.buttons.slice(0, 10),
      forms: s.forms.slice(0, 8),
    })),
    actions: buttons.map(b => ({
      label: b.label,
      section: b.section,
      type: b.tagName || 'button',
    })),
    buttons: buttons.map(b => b.label).slice(0, 50),
    headings: headings.map(h => h.text).slice(0, 30),
    heading_details: headings.slice(0, 30),
    tables: dedupeStrings(tableHeaders, 50),
    forms: dedupeStrings(forms.map(f => f.label), 30),
    form_details: forms.slice(0, 30),
    workflows: workflowSteps.map(w => ({ text: w, type: 'sequential' })),
    workflow_steps: workflowSteps.slice(0, 20),
    instructional_text: instructionalText.slice(0, 25),
    breadcrumbs: extractBreadcrumbs(),
  };

  return knowledge;
}
