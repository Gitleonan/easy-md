import { createHighlighter, type Highlighter } from 'shiki';

const themes = { light: 'github-light', dark: 'github-dark' } as const;
export type ThemeName = keyof typeof themes;

let highlighterPromise: Promise<Highlighter> | null = null;

async function getHL(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ['github-light', 'github-dark'],
      langs: ['typescript', 'javascript', 'bash', 'json', 'markdown', 'rust', 'python'],
    });
  }
  return highlighterPromise;
}

/** 从 data-line-marks 解析行标记并注入对应 CSS 类 */
function applyLineMarks(html: string): string {
  const wrapperRe = /<div class="code-block-wrapper[^"]*"[^>]*data-line-marks="([^"]*)"[^>]*>/g;
  let result = '';
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = wrapperRe.exec(html))) {
    const wrapperStart = match.index;
    const wrapperEnd = findMatchingWrapperEnd(html, wrapperRe.lastIndex);
    if (wrapperEnd === -1) continue;

    const wrapperHtml = html.slice(wrapperStart, wrapperEnd);
    result += html.slice(lastIndex, wrapperStart);
    result += patchLineMarksInWrapper(wrapperHtml, match[1]);
    lastIndex = wrapperEnd;
    wrapperRe.lastIndex = wrapperEnd;
  }

  return result + html.slice(lastIndex);
}

function findMatchingWrapperEnd(html: string, from: number): number {
  const divRe = /<\/?div\b[^>]*>/g;
  divRe.lastIndex = from;
  let depth = 1;
  let match: RegExpExecArray | null;

  while ((match = divRe.exec(html))) {
    if (match[0].startsWith('</')) {
      depth -= 1;
      if (depth === 0) return divRe.lastIndex;
    } else {
      depth += 1;
    }
  }

  return -1;
}

function patchLineMarksInWrapper(wrapperHtml: string, marksJson: string): string {
  try {
    const marks: Array<{ line: number; type: string }> = JSON.parse(
      marksJson.replace(/&quot;/g, '"'),
    );
    if (!marks.length) return wrapperHtml;

    const lineClassMap: Record<string, string> = {
      highlight: 'code-line-highlight',
      focus: 'code-line-focus',
      error: 'code-line-error',
      warning: 'code-line-warning',
      add: 'code-line-add',
      remove: 'code-line-remove',
    };

    return wrapperHtml.replace(/<span class="line"/g, (lineTag: string, offset: number) => {
      const before = wrapperHtml.slice(0, offset);
      const lineIndex = (before.match(/<span class="line"/g) || []).length;
      const mark = marks.find((m) => m.line === lineIndex);
      if (mark && lineClassMap[mark.type]) {
        return `<span class="line ${lineClassMap[mark.type]}"`;
      }
      return lineTag;
    });
  } catch {
    return wrapperHtml;
  }
}

/** 从 code-block-wrapper 中提取语言和代码 */
const WRAPPER_RE = /<div class="code-block-wrapper[^>]*>[\s\S]*?<pre><code(?:\s+class="language-([\w-]+)")?>([\s\S]*?)<\/code><\/pre>\s*<\/div>/g;

export async function highlightCodeBlocks(html: string, theme: ThemeName): Promise<string> {
  if (!html) return '';

  const hl = await getHL();

  let result = html.replace(WRAPPER_RE, (fullMatch, lang, encoded) => {
    if (!lang) return fullMatch;
    if (lang === 'mermaid') return fullMatch;

    const code = decodeHtmlEntities(encoded);
    try {
      const loaded = hl.getLoadedLanguages();
      if (!loaded.includes(lang)) {
        return fullMatch.replace(
          /<pre><code(?:\s+class="language-[\w-]+")?>/,
          `<pre class="shiki"><code class="language-${lang}">`,
        );
      }
      const shikiResult = hl.codeToHtml(code, { lang, theme: themes[theme] });
      // 保留 data-line-marks 属性
      const patchedWrapper = fullMatch.replace(/<pre><code(?:\s+class="language-[\w-]+")?>[\s\S]*?<\/code><\/pre>/, shikiResult);
      return patchedWrapper;
    } catch {
      return fullMatch.replace(
        /<pre><code(?:\s+class="language-[\w-]+")?>/,
        `<pre class="shiki"><code>`,
      );
    }
  });

  // 在 shiki 生成 .line 之后注入行标记样式
  result = applyLineMarks(result);
  return result;
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}
