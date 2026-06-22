import { useState } from 'react';
import { PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';
import { smoothScrollToElement } from '../../utils/smoothScroll';
import type { TocItem } from '../../types';

export interface TocNode extends TocItem {
  children?: TocNode[];
}

/** 将扁平 TOC 列表转换为嵌套树 */
export function buildTocTree(flat: TocItem[]): TocNode[] {
  const root: TocNode[] = [];
  const stack: TocNode[] = [];
  for (const item of flat) {
    const node: TocNode = { ...item };
    while (stack.length && stack[stack.length - 1].level >= node.level) stack.pop();
    if (stack.length === 0) {
      root.push(node);
    } else {
      const parent = stack[stack.length - 1];
      parent.children = parent.children || [];
      parent.children.push(node);
    }
    stack.push(node);
  }
  return root;
}

export function splitHighlightedText(text: string, keyword: string): Array<{ text: string; match: boolean }> {
  if (!keyword) return [{ text, match: false }];
  const lower = text.toLowerCase();
  const needle = keyword.toLowerCase();
  const parts: Array<{ text: string; match: boolean }> = [];
  let start = 0;
  let index = lower.indexOf(needle);

  while (index !== -1) {
    if (index > start) parts.push({ text: text.slice(start, index), match: false });
    parts.push({ text: text.slice(index, index + keyword.length), match: true });
    start = index + keyword.length;
    index = lower.indexOf(needle, start);
  }

  if (start < text.length) parts.push({ text: text.slice(start), match: false });
  return parts;
}

export function filterTocTree(nodes: TocNode[], keyword: string): TocNode[] {
  const needle = keyword.trim().toLowerCase();
  if (!needle) return nodes;

  return nodes.flatMap((node) => {
    const children = node.children ? filterTocTree(node.children, keyword) : [];
    const selfMatches = node.text.toLowerCase().includes(needle);
    if (!selfMatches && children.length === 0) return [];
    return [{ ...node, children }];
  });
}

export function Sidebar({ toc, activeId }: { toc: TocItem[]; activeId?: string | null }) {
  const [collapsed, setCollapsed] = useState(false);
  const [query, setQuery] = useState('');
  const tree = buildTocTree(toc);
  const visibleTree = filterTocTree(tree, query);

  if (!tree.length) return null;

  const renderNodes = (nodes: TocNode[]) => (
    <ul className="toc-list">
      {nodes.map((n) => (
        <li key={n.id} className="toc-item">
          <a
            href={`#${n.id}`}
            className={`toc-link ${activeId === n.id ? 'toc-link-active' : ''}`}
            style={{ paddingLeft: 12 + (n.level - 1) * 14 }}
            aria-current={activeId === n.id ? 'true' : undefined}
            onClick={(e) => {
              e.preventDefault();
              const el = document.getElementById(n.id);
              if (el) smoothScrollToElement(el, null, 'start');
            }}
          >
            {splitHighlightedText(n.text, query.trim()).map((part, index) => (
              part.match
                ? <mark key={`${part.text}-${index}`} className="toc-match">{part.text}</mark>
                : <span key={`${part.text}-${index}`}>{part.text}</span>
            ))}
          </a>
          {n.children && renderNodes(n.children)}
        </li>
      ))}
    </ul>
  );

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="sidebar-header">
        <span className="sidebar-title">目录</span>
        <button
          className="sidebar-toggle"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? '展开目录' : '收起目录'}
          aria-label={collapsed ? '展开目录' : '收起目录'}
        >
          {collapsed
            ? <PanelLeftOpen className="sidebar-toggle-icon" size={14} strokeWidth={1.5} />
            : <PanelLeftClose className="sidebar-toggle-icon" size={14} strokeWidth={1.5} />
          }
        </button>
      </div>
      {!collapsed && (
        <>
          <div className="toc-search">
            <div className="toc-search-input-wrap">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="toc-search-input"
                placeholder="搜索目录"
              />
              {query && (
                <button className="toc-search-clear" onClick={() => setQuery('')} title="清空目录搜索" aria-label="清空目录搜索">
                  <X size={12} strokeWidth={2} />
                </button>
              )}
            </div>
          </div>
          {visibleTree.length > 0 ? (
            renderNodes(visibleTree)
          ) : (
            <div className="toc-empty">没有匹配的标题</div>
          )}
        </>
      )}
    </aside>
  );
}
