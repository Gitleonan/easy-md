import { useEffect, useRef } from 'react';
import { useTabsStore } from '../../stores/tabsStore';
import { resolveImages } from '../../ipc/files';
import { openExternalUrl, openLocalPath } from '../../ipc/opener';
import { renderMermaidInContainer } from '../../features/markdown/mermaid';
import { injectAnchors } from '../../features/markdown/anchors';
import { classifyLink, resolveLocalPath } from '../../features/markdown/links';
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
  // 仅订阅会改变渲染结果的字段，避免滚动时 setScrollTop 触发本组件重渲染——
  // 否则下面的 useEffect 会因为 tab 引用变化重新跑，把 el.innerHTML 重置一次，
  // 顺手抹掉 SearchBar 刚加上的 <mark>，导致一次性输入多个字时高亮“看似没出现”。
  const tabId = useTabsStore((s) => s.activeTabId);
  const tabHtml = useTabsStore((s) => s.tabs.find((t) => t.id === s.activeTabId)?.html);
  const tabSource = useTabsStore((s) => s.tabs.find((t) => t.id === s.activeTabId)?.source);
  const setScrollTop = useTabsStore((s) => s.setScrollTop);
  const internalRef = useRef<HTMLDivElement>(null);
  const ref = contentRef || internalRef;

  useEffect(() => {
    if (!ref.current || !tabId || tabHtml == null) return;
    // 通过 getState 读取，避免把 tab 整体写进 deps 而被滚动期间的引用刷新带歪。
    const tab = useTabsStore.getState().tabs.find((t) => t.id === tabId);
    if (!tab) return;
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

    // 链接点击拦截：md 链接打开新 tab、外链丢给系统浏览器、其它本地路径走 opener
    const onLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const a = target?.closest?.('a');
      if (!a) return;
      const href = a.getAttribute('href');
      if (!href) return;
      const link = classifyLink(href);
      if (link.kind === 'anchor') {
        // 走 webview 默认行为，配合 .md-content 的 scroll-behavior 平滑滚动
        return;
      }
      e.preventDefault();
      if (link.kind === 'external') {
        openExternalUrl(link.url).catch((err) => console.error('[link] openUrl failed', err));
        return;
      }
      if (link.kind === 'mdFile') {
        const resolved = resolveLocalPath(tab.filePath, link.path);
        useTabsStore
          .getState()
          .openTab(resolved)
          .catch((err) => console.error('[link] openTab failed', err));
        return;
      }
      if (link.kind === 'localFile') {
        const resolved = resolveLocalPath(tab.filePath, link.path);
        openLocalPath(resolved).catch((err) => console.error('[link] openPath failed', err));
        return;
      }
    };
    el.addEventListener('click', onLinkClick);

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
      el.removeEventListener('click', onLinkClick);
      imgHandlers.forEach((fn) => fn());
    };
  }, [
    tabId,
    tabHtml,
    setScrollTop,
    ref,
    onActiveHeadingChange,
  ]);

  if (!tabId || tabHtml == null) return null;
  return (
    <div className="content-shell">
      <main className="md-content" ref={ref} />
      <div className="word-count-badge">字数 {countMarkdownWords(tabSource ?? '')}</div>
    </div>
  );
}
