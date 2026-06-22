import { useEffect, useRef, useCallback, useState } from 'react';
import { useTabsStore } from '../../stores/tabsStore';
import { useEditStore } from '../../stores/editStore';
import { writeFile } from '../../ipc/files';
import { renderMarkdown } from '../../features/markdown/render';
import { highlightCodeBlocks } from '../../features/markdown/highlight';
import { extractToc } from '../../features/markdown/toc';

/**
 * 对 Markdown 单行源码做轻量正则着色。
 * 用正则给标题/粗体/斜体/代码/链接/引用加 HTML 颜色标签。
 */
function highlightMarkdownLine(line: string): string {
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  if (line.length === 0) return '&#8203;';
  if (/^```/.test(line)) return `<span class="ed-fence">${esc(line)}</span>`;

  const headingMatch = line.match(/^(#{1,6}\s)(.*)/);
  if (headingMatch) return `<span class="ed-heading">${esc(headingMatch[1])}${esc(headingMatch[2])}</span>`;
  if (/^>\s?/.test(line)) return `<span class="ed-blockquote">${esc(line)}</span>`;

  const listMatch = line.match(/^(\s*[-*+]\s|\s*\d+\.\s)/);
  if (listMatch) return `<span class="ed-list-marker">${esc(listMatch[0])}</span>${esc(line.slice(listMatch[0].length))}`;
  if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) return `<span class="ed-hr">${esc(line)}</span>`;

  if (!/[`!\[\]*_~]/.test(line)) return esc(line);

  let result = esc(line);
  result = result.replace(/`([^`]+)`/g, '<span class="ed-inline-code">`$1`</span>');
  result = result.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<span class="ed-image">![$1]($2)</span>');
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<span class="ed-link">[$1]($2)</span>');
  result = result.replace(/(\*\*|__)(.+?)\1/g, '<span class="ed-bold">$1$2$1</span>');
  result = result.replace(/(\*|_)(.+?)\1/g, '<span class="ed-italic">$1$2$1</span>');
  result = result.replace(/~~(.+?)~~/g, '<span class="ed-strikethrough">~~$1~~</span>');
  return result;
}

function createHighlightedLine(line: string): HTMLSpanElement {
  const span = document.createElement('span');
  span.className = 'editor-highlight-line';
  span.innerHTML = highlightMarkdownLine(line);
  return span;
}

function syncHighlightedLines(pre: HTMLPreElement, source: string, previousLines: string[]): string[] {
  const nextLines = source.split('\n');

  if (pre.children.length !== previousLines.length) {
    const fragment = document.createDocumentFragment();
    nextLines.forEach((line) => fragment.appendChild(createHighlightedLine(line)));
    pre.replaceChildren(fragment);
    return nextLines;
  }

  let start = 0;
  while (
    start < previousLines.length
    && start < nextLines.length
    && previousLines[start] === nextLines[start]
  ) {
    start += 1;
  }

  let previousEnd = previousLines.length - 1;
  let nextEnd = nextLines.length - 1;
  while (
    previousEnd >= start
    && nextEnd >= start
    && previousLines[previousEnd] === nextLines[nextEnd]
  ) {
    previousEnd -= 1;
    nextEnd -= 1;
  }

  if (start > previousEnd && start > nextEnd) return nextLines;

  for (let i = start; i <= previousEnd; i += 1) {
    pre.children[start]?.remove();
  }

  const fragment = document.createDocumentFragment();
  for (let i = start; i <= nextEnd; i += 1) {
    fragment.appendChild(createHighlightedLine(nextLines[i]));
  }
  pre.insertBefore(fragment, pre.children[start] ?? null);

  return nextLines;
}

/**
 * Markdown 文本编辑器——在编辑模式下替代 Content 区域。
 * 双层方案：透明 textarea 叠加高亮 <pre>，实现语法着色。
 * 高亮通过 debounce + 直接 innerHTML 更新，避免击键卡顿。
 */
export function Editor() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const highlightedLinesRef = useRef<string[]>([]);
  const activeTab = useTabsStore((s) => s.tabs.find((t) => t.id === s.activeTabId));
  const isDirty = useEditStore((s) => s.isDirty);
  const setDirty = useEditStore((s) => s.setDirty);
  const markSaved = useEditStore((s) => s.markSaved);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');

  /** 更新高亮层 — 按行替换变更节点，不重建整篇 HTML */
  const updateHighlight = useCallback((source: string) => {
    if (preRef.current) {
      highlightedLinesRef.current = syncHighlightedLines(
        preRef.current,
        source,
        highlightedLinesRef.current,
      );
    }
  }, []);

  // 同步初始内容到 textarea + 首次高亮
  useEffect(() => {
    if (textareaRef.current && activeTab) {
      textareaRef.current.value = activeTab.source;
      textareaRef.current.scrollTop = activeTab.scrollTop;
      if (preRef.current) {
        preRef.current.style.transform = `translateY(-${activeTab.scrollTop}px)`;
      }
      updateHighlight(activeTab.source);
      setDirty(false);
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [activeTab?.id, updateHighlight, setDirty]);

  const handleChange = useCallback(() => {
    setDirty(true);
    // debounce 高亮：150ms 内只触发一次
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const val = textareaRef.current?.value ?? '';
      updateHighlight(val);
    }, 150);
  }, [setDirty, updateHighlight]);

  const handleScroll = useCallback(() => {
    if (!activeTab || !textareaRef.current) return;
    useTabsStore.getState().setScrollTop(activeTab.id, textareaRef.current.scrollTop);
    if (preRef.current) {
      preRef.current.style.transform = `translateY(-${textareaRef.current.scrollTop}px)`;
    }
  }, [activeTab]);

  const handleSave = useCallback(async () => {
    if (!activeTab || !textareaRef.current || saveState !== 'idle') return;
    const content = textareaRef.current.value;
    setSaveState('saving');
    try {
      await writeFile(activeTab.filePath, content);
      const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      const toc = extractToc(content);
      const html = await highlightCodeBlocks(renderMarkdown(content), theme);
      useTabsStore.getState().updateSource(activeTab.id, content, html, toc);
      markSaved();
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 1500);
    } catch (err) {
      console.error('[Editor] save failed:', err);
      setSaveState('idle');
    }
  }, [activeTab, markSaved, saveState]);

  // Ctrl+S 快捷键
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = navigator.platform.includes('Mac') ? e.metaKey : e.ctrlKey;
      if (mod && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleSave]);

  if (!activeTab) return null;

  return (
    <div className="editor-shell">
      <div className="editor-toolbar">
        <span className="editor-filename">{activeTab.fileName}</span>
        {isDirty && <span className="editor-dirty">● 未保存</span>}
        <button
          className={`editor-save-btn ${saveState === 'saved' ? 'editor-save-btn-done' : ''} ${saveState === 'saving' ? 'editor-save-btn-saving' : ''}`}
          onClick={handleSave}
          disabled={saveState !== 'idle'}
          title="保存 (Ctrl+S)"
        >
          {saveState === 'saving' ? '保存中…' : saveState === 'saved' ? '已保存 ✓' : '保存'}
        </button>
        <button
          className="editor-exit-btn"
          onClick={() => useEditStore.getState().toggleEditing()}
          title="退出编辑，回到预览模式"
        >
          退出编辑
        </button>
      </div>
      <div className="editor-viewport">
        <pre
          ref={preRef}
          className="editor-highlight"
          aria-hidden="true"
        />
        <textarea
          ref={textareaRef}
          className="editor-textarea"
          defaultValue={activeTab.source}
          onChange={handleChange}
          onScroll={handleScroll}
          spellCheck={false}
          placeholder="输入 Markdown 内容…"
        />
      </div>
    </div>
  );
}
