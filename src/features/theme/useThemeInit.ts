import { useEffect } from 'react';
import { useThemeStore } from '../../stores/themeStore';
import { rehighlightAllTabs } from '../markdown/rehighlight';

/** 主题初始化 hook：监听主题变化，触发 shiki 重新高亮 */
export function useThemeInit() {
  const resolved = useThemeStore((s) => s.resolved);

  useEffect(() => {
    rehighlightAllTabs(resolved === 'dark' ? 'dark' : 'light');
  }, [resolved]);
}
