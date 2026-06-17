import { md } from './plugins';

/**
 * 将 markdown 源文本渲染为 HTML。
 *
 * 注意：此函数输出不含 shiki 代码高亮与 mermaid SVG，
 * 二者在渲染后处理阶段（highlight.ts / mermaid.ts）单独执行。
 * 代码块保留为 <pre><code class="language-xxx">，等待 shiki 替换。
 */
export function renderMarkdown(source: string): string {
  return md.render(source);
}
