import { useEffect, useRef } from 'react';
import { useTabsStore } from '../../stores/tabsStore';
import { resolveImages } from '../../ipc/files';
import { renderMermaidInContainer } from '../../features/markdown/mermaid';
import { injectAnchors } from '../../features/markdown/anchors';
import { useLightbox } from '../../hooks/useLightbox';

interface ContentProps {
  contentRef?: React.RefObject<HTMLDivElement>;
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

    // 增强代码块（复制按钮 + 语言标签）
    enhanceCodeBlocks(el);

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
