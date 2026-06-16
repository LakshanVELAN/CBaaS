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
  let html = escapeHtml(text);

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

  return html;
}
