import { useEffect, useRef, useState, useCallback } from 'react';
import { ChevronUp } from 'lucide-react';
import { useTabsStore } from '../../stores/tabsStore';
import { useZenStore } from '../../stores/zenStore';
import { resolveImages } from '../../ipc/files';
import { openExternalUrl, openLocalPath } from '../../ipc/opener';
import { renderMermaidInContainer } from '../../features/markdown/mermaid';
import { injectAnchors } from '../../features/markdown/anchors';
import { classifyLink, resolveLocalPath } from '../../features/markdown/links';
import { useLightbox } from '../../hooks/useLightbox';
import { smoothScrollTo } from '../../utils/smoothScroll';

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

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(target.closest('input, textarea, [contenteditable="true"]'));
}

function selectElementContents(element: HTMLElement): void {
  const selection = window.getSelection();
  if (!selection) return;

  const range = document.createRange();
  range.selectNodeContents(element);
  selection.removeAllRanges();
  selection.addRange(range);
}

function handlePreviewSelectAll(e: React.KeyboardEvent<HTMLElement>): void {
  if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 'a') return;
  if (isEditableTarget(e.target)) return;

  e.preventDefault();
  selectElementContents(e.currentTarget);
}

/** 为代码块添加复制按钮、语言标签和行号 */
function enhanceCodeBlocks(container: HTMLElement) {
  // 处理两种情况：
  // 1. 已被 code-features.ts 包装的 .code-block-wrapper（带标题的代码块）
  // 2. 未被包装的裸 <pre> 元素
  const wrappers = container.querySelectorAll('.code-block-wrapper');
  wrappers.forEach((wrapper) => {
    if (wrapper.querySelector('.code-block-copy')) return; // 已处理
    const pre = wrapper.querySelector('pre');
    if (!pre) return;
    const code = pre.querySelector('code');
    const langClass = code?.className || '';
    const langMatch = langClass.match(/language-(\w+)/);
    const lang = langMatch?.[1] || '';

    if (lang && !wrapper.querySelector('.code-block-lang')) {
      const langLabel = document.createElement('span');
      langLabel.className = 'code-block-lang';
      langLabel.textContent = lang;
      wrapper.appendChild(langLabel);
    }

    addCopyButton(wrapper, code);
    injectLineNumbers(wrapper, pre);
  });

  // 处理未被包装的裸 <pre>
  const pres = container.querySelectorAll('pre');
  pres.forEach((pre) => {
    if (pre.parentElement?.classList.contains('code-block-wrapper')) return;

    const code = pre.querySelector('code');
    const langClass = code?.className || '';
    const langMatch = langClass.match(/language-(\w+)/);
    const lang = langMatch?.[1] || '';

    const wrapper = document.createElement('div');
    wrapper.className = 'code-block-wrapper';
    pre.parentNode?.insertBefore(wrapper, pre);
    wrapper.appendChild(pre);

    if (lang) {
      const langLabel = document.createElement('span');
      langLabel.className = 'code-block-lang';
      langLabel.textContent = lang;
      wrapper.appendChild(langLabel);
    }

    addCopyButton(wrapper, code);
    injectLineNumbers(wrapper, pre);
  });
}

/** 通过 DOM 操作注入行号（比正则可靠） */
function injectLineNumbers(wrapper: Element, pre: Element) {
  if (wrapper.querySelector('.line-numbers')) return;
  const lineCount = getCodeLineCount(pre);
  if (lineCount < 2) return;

  wrapper.classList.add('line-numbers-mode');
  const gutter = document.createElement('div');
  gutter.className = 'line-numbers';
  for (let i = 1; i <= lineCount; i++) {
    const span = document.createElement('span');
    span.className = 'line-number';
    span.textContent = String(i);
    gutter.appendChild(span);
  }
  wrapper.insertBefore(gutter, pre);
}

function getCodeLineCount(pre: Element): number {
  const renderedLineCount = pre.querySelectorAll('.line').length;
  const codeText = pre.querySelector('code')?.textContent ?? pre.textContent ?? '';
  const textLineCount = codeText.length ? codeText.split(/\r\n|\r|\n/).length : 0;

  return Math.max(renderedLineCount, textLineCount);
}

function addCopyButton(wrapper: Element, code: HTMLElement | null) {
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
}

function ZenHint() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // 下一帧触发入场动画
    const show = requestAnimationFrame(() => setVisible(true));
    const hide = setTimeout(() => setVisible(false), 2000);
    return () => {
      cancelAnimationFrame(show);
      clearTimeout(hide);
    };
  }, []);

  return (
    <div className={`zen-hint ${visible ? 'zen-hint-show' : ''}`}>
      按 ESC 退出专注模式
    </div>
  );
}

export function Content({ contentRef, onActiveHeadingChange }: ContentProps) {
  // 仅订阅会改变渲染结果的字段，避免滚动时 setScrollTop 触发本组件重渲染——
  // 否则下面的 useEffect 会因为 tab 引用变化重新跑，把 el.innerHTML 重置一次，
  // 顺手抹掉 SearchBar 刚加上的 <mark>，导致一次性输入多个字时高亮"看似没出现"。
  const tabId = useTabsStore((s) => s.activeTabId);
  const tabHtml = useTabsStore((s) => s.tabs.find((t) => t.id === s.activeTabId)?.html);
  const tabSource = useTabsStore((s) => s.tabs.find((t) => t.id === s.activeTabId)?.source);
  const tabIsLoading = useTabsStore((s) => s.tabs.find((t) => t.id === s.activeTabId)?.isLoading ?? false);
  const setScrollTop = useTabsStore((s) => s.setScrollTop);
  const isZen = useZenStore((s) => s.isZen);
  const internalRef = useRef<HTMLDivElement>(null);
  const ref = contentRef || internalRef;
  const [showBackToTop, setShowBackToTop] = useState(false);

  const handleBackToTop = useCallback(() => {
    if (ref.current) smoothScrollTo(ref.current, 0);
  }, [ref]);

  useEffect(() => {
    if (!ref.current || !tabId || tabHtml == null) return;
    // 通过 getState 读取，避免把 tab 整体写进 deps 而被滚动期间的引用刷新带歪。
    const tab = useTabsStore.getState().tabs.find((t) => t.id === tabId);
    if (!tab) return;
    const el = ref.current;
    el.innerHTML = tab.html;

    // 恢复滚动位置时，短暂屏蔽 scroll 事件，防止 setScrollTop 覆盖刚恢复的值
    let restoring = true;
    el.scrollTop = tab.scrollTop;
    setShowBackToTop(el.scrollTop > 300);
    requestAnimationFrame(() => { restoring = false; });

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

    // 图片点击 Lightbox（跳过被链接包裹的图片，如 badge）
    const open = useLightbox.getState().open;
    const imgs = el.querySelectorAll<HTMLImageElement>('img');
    const imgHandlers: Array<() => void> = [];
    imgs.forEach((img) => {
      const h = () => {
        // 图片被链接包裹时不触发灯箱，交给链接处理器
        if (img.closest('a')) return;
        open(img.src);
      };
      img.addEventListener('click', h);
      imgHandlers.push(() => img.removeEventListener('click', h));
    });

    // 链接点击拦截：md 链接打开新 tab、外链丢给系统浏览器、其它本地路径走 opener
    const onLinkClick = (e: MouseEvent) => {
      const target = e.target instanceof Element
        ? e.target
        : e.target instanceof Node
          ? e.target.parentElement
          : null;
      const a = target?.closest('a');
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
        console.log('[link] opening md file:', { href, resolved, basePath: tab.filePath });
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
      if (!restoring) {
        setScrollTop(tab.id, el.scrollTop);
      }
      syncActiveHeading();
      setShowBackToTop(el.scrollTop > 300);
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
    tabIsLoading,
    setScrollTop,
    ref,
    onActiveHeadingChange,
  ]);

  if (!tabId || (tabHtml == null && !tabIsLoading)) return null;
  return (
    <div className="content-shell">
      {tabIsLoading ? (
        <div className="loading-container">
          <div className="loading-spinner" />
          <p className="loading-text">正在加载文件…</p>
        </div>
      ) : (
        <>
          <main
            className="md-content"
            ref={ref}
            tabIndex={-1}
            onMouseDown={() => ref.current?.focus({ preventScroll: true })}
            onKeyDown={handlePreviewSelectAll}
          />
          <div className="word-count-badge">字数 {countMarkdownWords(tabSource ?? '')}</div>
          {isZen && <ZenHint />}
          <button
            className={`back-to-top ${showBackToTop ? 'visible' : ''}`}
            onClick={handleBackToTop}
            title="回到顶部"
            aria-label="回到顶部"
          >
            <ChevronUp size={16} strokeWidth={1.5} />
          </button>
        </>
      )}
    </div>
  );
}
