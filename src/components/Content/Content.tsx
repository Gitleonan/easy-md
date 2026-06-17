import { useEffect, useRef } from 'react';
import { useTabsStore } from '../../stores/tabsStore';
import { resolveImages } from '../../ipc/files';
import { renderMermaidInContainer } from '../../features/markdown/mermaid';
import { injectAnchors } from '../../features/markdown/anchors';
import { useLightbox } from '../../hooks/useLightbox';

interface ContentProps {
  contentRef?: React.RefObject<HTMLDivElement>;
}

export function Content({ contentRef }: ContentProps) {
  const tab = useTabsStore((s) => s.tabs.find((t) => t.id === s.activeTabId));
  const setScrollTop = useTabsStore((s) => s.setScrollTop);
  const internalRef = useRef<HTMLDivElement>(null);
  const ref = contentRef || internalRef;

  useEffect(() => {
    if (!ref.current || !tab) return;
    const el = ref.current;
    el.innerHTML = tab.html;
    el.scrollTop = tab.scrollTop;

    // 注入锚点 ID
    injectAnchors(el, tab.toc);

    // 解析图片和渲染 Mermaid
    Promise.all([
      resolveImages(el, tab.filePath),
      renderMermaidInContainer(el),
    ]).catch(console.error);

    // 图片点击 Lightbox
    const open = useLightbox.getState().open;
    const imgs = el.querySelectorAll<HTMLImageElement>('img');
    const imgHandlers: Array<() => void> = [];
    imgs.forEach((img) => {
      const h = () => open(img.src);
      img.addEventListener('click', h);
      imgHandlers.push(() => img.removeEventListener('click', h));
    });

    // 滚动记忆
    const onScroll = () => setScrollTop(tab.id, el.scrollTop);
    el.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      el.removeEventListener('scroll', onScroll);
      imgHandlers.forEach((fn) => fn());
    };
  }, [tab?.id, tab?.html, setScrollTop, tab, ref]);

  if (!tab) return null;
  return <main className="md-content" ref={ref} />;
}
