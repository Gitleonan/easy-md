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
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;450;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
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
  --bg: #fafafa;
  --fg: #1a1a1a;
  --bg-secondary: #f0f0f0;
  --fg-muted: #6b7280;
  --border: #e5e7eb;
  --accent: #2563eb;
  --accent-soft: #2563eb12;
  --code-bg: #f4f4f5;
  --mark-bg: #fef9c3;
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
}

:root[data-theme="dark"] {
  --bg: #111111;
  --fg: #e5e5e5;
  --bg-secondary: #1a1a1a;
  --fg-muted: #9ca3af;
  --border: #262626;
  --accent: #60a5fa;
  --accent-soft: #60a5fa12;
  --code-bg: #1e1e1e;
  --mark-bg: #854d0e40;
}

@media print {
  :root[data-theme="dark"] {
    --bg: #ffffff;
    --fg: #1a1a1a;
    --bg-secondary: #f0f0f0;
    --fg-muted: #6b7280;
    --border: #e5e7eb;
    --accent: #2563eb;
    --accent-soft: #2563eb12;
    --code-bg: #f4f4f5;
    --mark-bg: #fef9c3;
  }
}

body {
  background: var(--bg);
  color: var(--fg);
  font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
  font-size: 15px;
  line-height: 1.65;
  -webkit-font-smoothing: antialiased;
  margin: 0;
}

.md-content {
  max-width: 780px;
  margin: 0 auto;
  padding: 40px 32px;
}

.md-content h1, .md-content h2, .md-content h3,
.md-content h4, .md-content h5, .md-content h6 {
  font-weight: 650;
  letter-spacing: -0.02em;
  line-height: 1.3;
  margin-top: 1.8em;
  margin-bottom: 0.5em;
}

.md-content h1:first-child,
.md-content h2:first-child,
.md-content h3:first-child {
  margin-top: 0;
}

.md-content h1 {
  font-size: 2em;
  font-weight: 700;
  letter-spacing: -0.03em;
  margin-bottom: 0.4em;
}

.md-content h2 {
  font-size: 1.5em;
  padding-bottom: 0.3em;
  border-bottom: 1px solid var(--border);
  margin-top: 2.2em;
}

.md-content h3 { font-size: 1.25em; }
.md-content h4 { font-size: 1.0625em; }
.md-content h5 { font-size: 0.9375em; }
.md-content h6 { font-size: 0.875em; color: var(--fg-muted); }

.md-content p { margin: 0 0 1em; }

.md-content a {
  color: var(--accent);
  text-decoration: none;
  font-weight: 450;
}

.md-content strong { font-weight: 650; }

.md-content code:not(pre code) {
  background: var(--code-bg);
  padding: 0.15em 0.4em;
  border-radius: 4px;
  font-size: 0.88em;
  font-family: "JetBrains Mono", "Fira Code", "SFMono-Regular", Consolas, monospace;
  font-weight: 450;
}

.md-content pre {
  background: var(--code-bg);
  padding: 16px 18px;
  border-radius: var(--radius-md);
  overflow: auto;
  margin: 0 0 16px;
  font-size: 0.85em;
  line-height: 1.65;
}

.md-content pre code {
  background: none;
  padding: 0;
  border-radius: 0;
  font-size: 1em;
  font-weight: 400;
}

.md-content blockquote {
  border-left: 3px solid var(--accent);
  padding: 0.5em 16px;
  color: var(--fg-muted);
  margin: 0 0 1em;
  background: var(--accent-soft);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}

.md-content blockquote p:last-child { margin-bottom: 0; }

.md-content table {
  border-collapse: collapse;
  margin: 0 0 1em;
  width: 100%;
  font-size: 0.9375em;
}

.md-content th, .md-content td {
  padding: 8px 14px;
  text-align: left;
  border-bottom: 1px solid var(--border);
}

.md-content th {
  background: var(--bg-secondary);
  font-weight: 600;
  font-size: 0.875em;
}

.md-content tr:last-child td { border-bottom: none; }

.md-content img { max-width: 100%; border-radius: var(--radius-md); }

.md-content mark {
  background: var(--mark-bg);
  padding: 0.05em 0.2em;
  border-radius: 3px;
}

.md-content input[type="checkbox"] {
  margin-right: 0.5em;
  accent-color: var(--accent);
}

.md-content ul, .md-content ol {
  padding-left: 1.5em;
  margin: 0 0 1em;
}

.md-content li + li { margin-top: 0.25em; }

.md-content hr {
  border: none;
  height: 1px;
  background: var(--border);
  margin: 2.5em 0;
}

.md-content .footnotes {
  font-size: 0.875em;
  color: var(--fg-muted);
  border-top: 1px solid var(--border);
  padding-top: 1em;
  margin-top: 2.5em;
}

.md-content .mermaid { text-align: center; margin: 1.5em 0; }
.md-content .katex-display { margin: 1.5em 0; overflow-x: auto; }

/* shiki code blocks */
.md-content .shiki {
  background: var(--code-bg) !important;
  padding: 16px 18px;
  border-radius: var(--radius-md);
  overflow: auto;
  margin: 0 0 16px;
  font-size: 0.85em;
  line-height: 1.65;
}

.md-content .shiki code {
  background: none;
  padding: 0;
  border-radius: 0;
  font-size: 1em;
}

/* 搜索高亮 */
.md-content mark.search-mark {
  background: #fef08a;
  border-radius: 2px;
  color: #1a1a1a;
  padding: 0.05em 0.15em;
}

.md-content mark.search-mark-current {
  background: #f59e0b;
  color: #1a1a1a;
}

:root[data-theme="dark"] .md-content mark.search-mark {
  background: #854d0e50;
  color: #fef08a;
}

:root[data-theme="dark"] .md-content mark.search-mark-current {
  background: #d97706;
  color: #1a1a1a;
}

/* 代码块包装器 */
.code-block-wrapper { position: relative; margin: 0 0 16px; }
.code-block-wrapper pre { margin: 0; }
.code-block-copy { display: none; }
.code-block-lang { display: none; }
`;
