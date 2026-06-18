import { useState } from 'react';
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

export function Sidebar({ toc }: { toc: TocItem[] }) {
  const [collapsed, setCollapsed] = useState(false);
  const tree = buildTocTree(toc);

  if (!tree.length) return null;

  const renderNodes = (nodes: TocNode[]) => (
    <ul className="toc-list">
      {nodes.map((n) => (
        <li key={n.id} className="toc-item">
          <a
            href={`#${n.id}`}
            className="toc-link"
            style={{ paddingLeft: (n.level - 1) * 12 }}
            onClick={(e) => {
              e.preventDefault();
              const el = document.getElementById(n.id);
              el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
          >
            {n.text}
          </a>
          {n.children && renderNodes(n.children)}
        </li>
      ))}
    </ul>
  );

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="sidebar-header">
        <span>目录</span>
        <button
          className="sidebar-toggle"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? '展开目录' : '收起目录'}
        >
          {collapsed ? '▶' : '◀'}
        </button>
      </div>
      {!collapsed && renderNodes(tree)}
    </aside>
  );
}
