import { useEffect, useRef } from 'react';
import { useSearchStore } from '../../stores/searchStore';
import { useTabsStore } from '../../stores/tabsStore';
import { highlightMatches, clearHighlights, focusMatch } from '../../features/search/search';

interface SearchBarProps {
  contentRef: React.RefObject<HTMLDivElement>;
}

export function SearchBar({ contentRef }: SearchBarProps) {
  const { visible, keyword, total, current, setKeyword, setVisible, setResult, next, prev } =
    useSearchStore();
  const activeTabId = useTabsStore((s) => s.activeTabId);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (visible) inputRef.current?.focus();
  }, [visible]);

  useEffect(() => {
    const el = contentRef.current;
    if (!visible && el) {
      clearHighlights(el);
      setResult(0, 0);
    }
  }, [visible, contentRef, setResult]);

  // 搜索关键词变化时重新高亮
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    if (!keyword) {
      clearHighlights(el);
      setResult(0, 0);
      return;
    }
    const total = highlightMatches(el, keyword);
    if (total > 0) {
      const marks = Array.from(el.querySelectorAll<HTMLElement>('mark.search-mark'));
      focusMatch(marks, 0);
      setResult(total, 0);
    } else {
      setResult(0, 0);
    }
  }, [keyword, activeTabId, contentRef, setResult]);

  // 当前匹配项变化时聚焦
  useEffect(() => {
    const el = contentRef.current;
    if (!el || total === 0) return;
    const marks = Array.from(el.querySelectorAll<HTMLElement>('mark.search-mark'));
    focusMatch(marks, current);
  }, [current, total, contentRef]);

  if (!visible) return null;

  const clearKeyword = () => {
    const el = contentRef.current;
    if (el) clearHighlights(el);
    setKeyword('');
    setResult(0, 0);
    inputRef.current?.focus();
  };

  return (
    <div className="searchbar">
      <div className="searchbar-input-wrap">
        <input
          ref={inputRef}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.shiftKey ? prev() : next(); }
            if (e.key === 'Escape') setVisible(false);
          }}
          placeholder="搜索..."
          className="searchbar-input"
        />
        {keyword && (
          <button className="searchbar-clear" onClick={clearKeyword} title="清空搜索" aria-label="清空搜索">
            ×
          </button>
        )}
      </div>
      <span className="searchbar-count">
        {total > 0 ? `${current + 1}/${total}` : '0/0'}
      </span>
      <button className="searchbar-btn" onClick={prev} title="上一个">↑</button>
      <button className="searchbar-btn" onClick={next} title="下一个">↓</button>
      <button className="searchbar-btn" onClick={() => setVisible(false)} title="关闭">×</button>
    </div>
  );
}
