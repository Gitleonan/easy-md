import { useEffect, useRef } from 'react';
import { useTabsStore } from '../../stores/tabsStore';
import { resolveImages } from '../../ipc/files';
import { renderMermaidInContainer } from '../../features/markdown/mermaid';
import { injectAnchors } from '../../features/markdown/anchors';
import { useLightbox } from '../../hooks/useLightbox';

interface ContentProps {
  contentRef?: React.RefObject<HTMLDivElement>;
  onActiveHeadingChange?: (id: string | null) => void;
}

export function countMarkdownWords(source: string): number {
  const cleaned = source
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#>*_\-[\]()`|~]/g, ' ');
  const cjkChars = cleaned.match(/[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/g)?.length ?? 0;
  const latinWords = cleaned
    .replace(/[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/g, ' ')
    .match(/[A-Za-z0-9]+(?:[+'-][A-Za-z0-9]+)*/g)?.length ?? 0;
  return cjkChars + latinWords;
}

export function getActiveHeadingId(container: HTMLElement, topOffset = 96): string | null {
  const headings = Array.from(
    container.querySelectorAll<HTMLElement>('h1[id],h2[id],h3[id],h4[id],h5[id],h6[id]'),
  );
  if (!headings.length) return null;

  const threshold = container.scrollTop + topOffset;
  let active = headings[0].id;
  for (const heading of headings) {
    if (heading.offsetTop > threshold) break;
    active = heading.id;
  }
  return active;
}

/** 为代码块添加复制按钮和语言标签 */
function enhanceCodeBlocks(container: HTMLElement) {
  const pres = container.querySelectorAll('pre');
  pres.forEach((pre) => {
    // 跳过已处理的
    if (pre.parentElement?.classList.contains('code-block-wrapper')) return;

    // 检测语言
    const code = pre.querySelector('code');
    const langClass = code?.className || '';
    const langMatch = langClass.match(/language-(\w+)/);
    const lang = langMatch?.[1] || '';

    // 创建包装器
    const wrapper = document.createElement('div');
    wrapper.className = 'code-block-wrapper';
    pre.parentNode?.insertBefore(wrapper, pre);
    wrapper.appendChild(pre);

    // 语言标签
    if (lang) {
      const langLabel = document.createElement('span');
      langLabel.className = 'code-block-lang';
      langLabel.textContent = lang;
      wrapper.appendChild(langLabel);
    }

    // 复制按钮
    const copyBtn = document.createElement('button');
    copyBtn.className = 'code-block-copy';
    copyBtn.textContent = '复制';
    copyBtn.addEventListener('click', async () => {
      const text = code?.textContent || '';
      try {
        await navigator.clipboard.writeText(text);
        copyBtn.textContent = '已复制';
        copyBtn.classList.add('copied');
        setTimeout(() => {
          copyBtn.textContent = '复制';
          copyBtn.classList.remove('copied');
        }, 2000);
      } catch {
        copyBtn.textContent = '失败';
        setTimeout(() => { copyBtn.textContent = '复制'; }, 2000);
      }
    });
    wrapper.appendChild(copyBtn);
  });
}

export function Content({ contentRef, onActiveHeadingChange }: ContentProps) {
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

    // 增强代码块（复制按钮 + 语言标签）
    enhanceCodeBlocks(el);

    let cancelled = false;

    // 解析图片和渲染 Mermaid
    Promise.all([
      resolveImages(el, tab.filePath),
      renderMermaidInContainer(el),
    ])
      .catch(console.error)
      .finally(() => {
        if (cancelled) return;
      });

    // 图片点击 Lightbox
    const open = useLightbox.getState().open;
    const imgs = el.querySelectorAll<HTMLImageElement>('img');
    const imgHandlers: Array<() => void> = [];
    imgs.forEach((img) => {
      const h = () => open(img.src);
      img.addEventListener('click', h);
      imgHandlers.push(() => img.removeEventListener('click', h));
    });

    const syncActiveHeading = () => {
      onActiveHeadingChange?.(getActiveHeadingId(el));
    };

    // 滚动记忆和目录定位
    const onScroll = () => {
      setScrollTop(tab.id, el.scrollTop);
      syncActiveHeading();
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    syncActiveHeading();

    return () => {
      cancelled = true;
      el.removeEventListener('scroll', onScroll);
      imgHandlers.forEach((fn) => fn());
    };
  }, [
    tab?.id,
    tab?.html,
    setScrollTop,
    tab,
    ref,
    onActiveHeadingChange,
  ]);

  if (!tab) return null;
  return (
    <div className="content-shell">
      <main className="md-content" ref={ref} />
      <div className="word-count-badge">字数 {countMarkdownWords(tab.source)}</div>
    </div>
  );
}
