/** 生成独立 HTML 文件（用于 PDF 导出窗口） */
export function buildStandaloneHtml(
  contentHtml: string,
  css: string,
  theme: 'light' | 'dark',
): string {
  return `<!DOCTYPE html>
<html lang="zh" data-theme="${theme}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>md++ export</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.17.0/dist/katex.min.css">
  <style>
    ${BASE_CSS}
    ${css}
  </style>
</head>
<body class="md-content">${contentHtml}</body>
</html>`;
}

/** 打开 PDF 导出窗口。 */
export async function exportPdf(el: HTMLElement, theme: 'light' | 'dark'): Promise<void> {
  const full = buildStandaloneHtml(el.innerHTML, '', theme);
  const frame = document.createElement('iframe');
  frame.dataset.mdExportFrame = 'true';
  frame.style.position = 'fixed';
  frame.style.right = '0';
  frame.style.bottom = '0';
  frame.style.width = '0';
  frame.style.height = '0';
  frame.style.border = '0';
  frame.style.opacity = '0';
  frame.srcdoc = full;
  frame.onload = () => {
    const printWindow = frame.contentWindow;
    if (!printWindow) return;
    printWindow.focus();
    printWindow.print();
    setTimeout(() => frame.remove(), 1000);
  };
  document.body.appendChild(frame);
}

const BASE_CSS = `
:root {
  --bg: #ffffff;
  --fg: #1f2328;
  --bg-secondary: #f6f8fa;
  --fg-muted: #656d76;
  --border: #d0d7de;
  --accent: #0969da;
  --code-bg: #f6f8fa;
  --mark-bg: #fff8c5;
}

:root[data-theme="dark"] {
  --bg: #0d1117;
  --fg: #e6edf3;
  --bg-secondary: #161b22;
  --fg-muted: #8b949e;
  --border: #30363d;
  --accent: #58a6ff;
  --code-bg: #161b22;
  --mark-bg: #bb800926;
}

body {
  background: var(--bg);
  color: var(--fg);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
  font-size: 16px;
  line-height: 1.6;
}

.md-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 32px 24px;
}

.md-content h1, .md-content h2 {
  border-bottom: 1px solid var(--border);
  padding-bottom: 0.3em;
}

.md-content h1 { font-size: 2em; margin: 0.67em 0; }
.md-content h2 { font-size: 1.5em; margin: 1em 0 0.67em; }
.md-content h3 { font-size: 1.25em; margin: 1em 0 0.5em; }

.md-content a {
  color: var(--accent);
  text-decoration: none;
}

.md-content a:hover {
  text-decoration: underline;
}

.md-content code:not(pre code) {
  background: var(--code-bg);
  padding: 0.2em 0.4em;
  border-radius: 6px;
  font-size: 0.9em;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
}

.md-content pre {
  background: var(--code-bg);
  padding: 16px;
  border-radius: 6px;
  overflow: auto;
}

.md-content blockquote {
  border-left: 4px solid var(--border);
  padding: 0 16px;
  color: var(--fg-muted);
  margin: 1em 0;
}

.md-content table {
  border-collapse: collapse;
  margin: 1em 0;
}

.md-content th, .md-content td {
  border: 1px solid var(--border);
  padding: 6px 13px;
}

.md-content th {
  background: var(--bg-secondary);
  font-weight: 600;
}

.md-content img {
  max-width: 100%;
}

.md-content mark {
  background: var(--mark-bg);
  padding: 0.1em 0.2em;
  border-radius: 3px;
}

.md-content input[type="checkbox"] {
  margin-right: 0.5em;
}
`;
