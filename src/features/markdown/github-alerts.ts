import type MarkdownIt from 'markdown-it';

/**
 * GitHub Alerts 支持
 * 语法：> [!NOTE] / > [!TIP] / > [!IMPORTANT] / > [!WARNING] / > [!CAUTION]
 *
 * 在渲染后处理阶段，将 blockquote 内的 [!TYPE] 标记替换为带 class 的容器。
 */
export function setupGitHubAlerts(md: MarkdownIt): void {
  const ALERT_TYPES = ['NOTE', 'TIP', 'IMPORTANT', 'WARNING', 'CAUTION'];
  const ALERT_RE = /^\[!([A-Z]+)\]\s*/;

  // 使用 core ruler 的自定义 rule（不依赖特定 rule name）
  md.core.ruler.push('github-alerts', (state) => {
    const tokens = state.tokens;

    for (let i = 0; i < tokens.length; i++) {
      // 找到 blockquote_open
      if (tokens[i].type !== 'blockquote_open') continue;

      // 找到 blockquote_close
      let closeIdx = -1;
      let depth = 1;
      for (let j = i + 1; j < tokens.length; j++) {
        if (tokens[j].type === 'blockquote_open') depth++;
        if (tokens[j].type === 'blockquote_close') {
          depth--;
          if (depth === 0) { closeIdx = j; break; }
        }
      }
      if (closeIdx === -1) continue;

      // 在 blockquote 内找第一个 paragraph_open -> inline
      let inlineIdx = -1;
      for (let j = i + 1; j < closeIdx; j++) {
        if (tokens[j].type === 'inline') {
          inlineIdx = j;
          break;
        }
      }
      if (inlineIdx === -1) continue;

      const inlineToken = tokens[inlineIdx];
      const match = ALERT_RE.exec(inlineToken.content);
      if (!match) continue;

      const alertType = match[1];
      if (!ALERT_TYPES.includes(alertType)) continue;

      // 标记 blockquote 为 GitHub Alert
      tokens[i].type = 'github_alert_open';
      tokens[i].tag = 'div';
      tokens[i].attrSet('class', `github-alert github-alert-${alertType.toLowerCase()}`);
      tokens[i].meta = { alertType };

      tokens[closeIdx].type = 'github_alert_close';
      tokens[closeIdx].tag = 'div';

      // 移除 [!TYPE] 前缀
      inlineToken.content = inlineToken.content.slice(match[0].length);
      if (inlineToken.children && inlineToken.children.length > 0) {
        const firstChild = inlineToken.children[0];
        if (firstChild.type === 'text') {
          firstChild.content = firstChild.content.replace(ALERT_RE, '');
        }
      }

      // 在 inline 前插入 alert 标题
      const titleToken = new state.Token('github_alert_title', 'p', 0);
      titleToken.attrSet('class', 'github-alert-title');
      titleToken.content = alertType.charAt(0) + alertType.slice(1).toLowerCase();
      titleToken.children = [
        Object.assign(new state.Token('text', '', 0), { content: titleToken.content }),
      ];

      // 在 paragraph_open 和 inline 之间插入标题
      tokens.splice(inlineIdx, 0, titleToken);
    }
  });
}
