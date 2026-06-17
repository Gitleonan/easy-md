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

const CODE_BLOCK_RE = /<pre><code class="language-([\w-]+)">(.*?)<\/code><\/pre>/gs;

export async function highlightCodeBlocks(html: string, theme: ThemeName): Promise<string> {
  if (!html) return '';

  const hl = await getHL();

  return html.replace(CODE_BLOCK_RE, (_, lang, encoded) => {
    const code = decodeHtmlEntities(encoded);
    try {
      // 检查语言是否已加载
      const loaded = hl.getLoadedLanguages();
      if (!loaded.includes(lang)) {
        // 动态加载语言（同步返回，如果语言不存在则跳过）
        return `<pre class="shiki"><code>${code}</code></pre>`;
      }
      return hl.codeToHtml(code, { lang, theme: themes[theme] });
    } catch {
      return `<pre class="shiki"><code>${code}</code></pre>`;
    }
  });
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}
