import MarkdownIt from 'markdown-it';
import katex from '@traptitech/markdown-it-katex';
import taskLists from 'markdown-it-task-lists';
import footnote from 'markdown-it-footnote';
import mark from 'markdown-it-mark';

/**
 * 创建配置好的 markdown-it 实例。
 * - linkify: 裸链接自动转超链接
 * - typographer: 排版美化（智能引号等）
 * - 插件链: katex 数学公式 / task-lists 任务列表 / footnote 脚注 / mark 高亮
 *
 * 注：代码高亮（shiki）与 mermaid 在渲染后处理阶段单独执行，
 * 这里保留原始 <pre><code class="language-xxx"> 由 shiki 替换。
 */
export function createMarkdownIt(): MarkdownIt {
  return new MarkdownIt({
    html: false,
    linkify: true,
    typographer: true,
  })
    .use(katex, { throwOnError: false, errorColor: '#cc0000' })
    .use(taskLists, { enabled: true, label: true })
    .use(footnote)
    .use(mark);
}

export const md = createMarkdownIt();
