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
    <aside className="sidebar">
      <div className="sidebar-header">目录</div>
      {renderNodes(tree)}
    </aside>
  );
}
