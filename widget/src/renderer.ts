import DOMPurify from 'dompurify';

const ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
};

function escapeHtml(str: string): string {
  return str.replace(/[&<>"]/g, (c) => ESCAPE_MAP[c] || c);
}

export function renderMarkdown(text: string): string {
  // Step 1: Escape raw HTML to prevent XSS
  let html = escapeHtml(text);

  // Step 2: Convert markdown syntax to HTML tags
  // Bold: **text**
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Italic: *text*
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Inline code: `code`
  html = html.replace(/`(.*?)`/g, '<code>$1</code>');

  // Unordered list items: - item or * item
  html = html.replace(/^[\-\*] (.+)$/gm, '<li>$1</li>');

  // Wrap consecutive <li> in <ul>
  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>');

  // Line breaks
  html = html.replace(/\n/g, '<br>');

  // Step 3: Sanitize the final HTML with DOMPurify (defense-in-depth)
  // Even though we escape first, this catches any edge cases where
  // the markdown regexes could produce unexpected output, and ensures
  // LLM-sourced content is safe to render via innerHTML.
  html = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['strong', 'em', 'code', 'ul', 'ol', 'li', 'br', 'p'],
    ALLOWED_ATTR: [],  // No attributes allowed on any tag
  });

  return html;
}
