import MarkdownIt from 'markdown-it';
import katex from '@traptitech/markdown-it-katex';
import taskLists from 'markdown-it-task-lists';
import footnote from 'markdown-it-footnote';
import mark from 'markdown-it-mark';

const EXTERNAL_PROTO = /^(https?|ftp|mailto|tel):/i;
const MD_EXT = /\.(md|markdown)(\?|#|$)/i;

/** 给 <a> 加上分类 class，便于样式区分 + 点击拦截。 */
function tagLinks(md: MarkdownIt): void {
  const defaultRender =
    md.renderer.rules.link_open ||
    ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options));

  md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    const href = token.attrGet('href') ?? '';
    if (EXTERNAL_PROTO.test(href)) {
      token.attrJoin('class', 'md-link-external');
      // 由前端事件统一拦截、调用 opener 打开浏览器；保留 rel 防止 webview 直接跟随
      token.attrSet('rel', 'noopener noreferrer');
    } else if (href.startsWith('#')) {
      token.attrJoin('class', 'md-link-anchor');
    } else if (MD_EXT.test(href)) {
      token.attrJoin('class', 'md-link-md');
    } else if (href) {
      token.attrJoin('class', 'md-link-local');
    }
    return defaultRender(tokens, idx, options, env, self);
  };
}

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
  const md = new MarkdownIt({
    html: false,
    linkify: true,
    typographer: true,
  })
    .use(katex, { throwOnError: false, errorColor: '#cc0000' })
    .use(taskLists, { enabled: true, label: true })
    .use(footnote)
    .use(mark);
  tagLinks(md);
  return md;
}

export const md = createMarkdownIt();
