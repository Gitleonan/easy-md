import { renderMarkdown } from './render';
import { highlightCodeBlocks } from './highlight';
import { useTabsStore } from '../../stores/tabsStore';

/** 主题变化时重新高亮所有标签的代码块 */
export async function rehighlightAllTabs(theme: 'light' | 'dark') {
  // tabsStore 可能还没初始化，做防御性检查
  const store = useTabsStore.getState?.();
  if (!store) return;

  const { tabs, updateSource } = store;
  for (const tab of tabs) {
    const raw = renderMarkdown(tab.source);
    const html = await highlightCodeBlocks(raw, theme);
    updateSource(tab.id, tab.source, html, tab.toc);
  }
}
