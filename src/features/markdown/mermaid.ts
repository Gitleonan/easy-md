export interface MermaidBlock {
  id: string;
  source: string;
}

const MERMAID_RE = /<div class="mermaid">([\s\S]*?)<\/div>/g;

/** 从渲染后的 HTML 提取 mermaid 块源码 */
export function extractMermaidBlocks(html: string): MermaidBlock[] {
  const blocks: MermaidBlock[] = [];
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = MERMAID_RE.exec(html)) !== null) {
    blocks.push({ id: `mermaid-${i++}`, source: m[1].trim() });
  }
  return blocks;
}

/** 异步把指定容器内的 mermaid div 替换为 SVG（在 DOM 注入后调用） */
export async function renderMermaidInContainer(container: HTMLElement): Promise<void> {
  const { default: mermaid } = await import('mermaid');
  const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'default';
  mermaid.initialize({ startOnLoad: false, theme });

  const nodes = container.querySelectorAll<HTMLElement>('.mermaid');
  for (const node of Array.from(nodes)) {
    const source = node.textContent || '';
    if (!source.trim()) continue;
    try {
      const id = `m-${Math.random().toString(36).slice(2)}`;
      const { svg } = await mermaid.render(id, source);
      node.innerHTML = svg;
    } catch {
      node.innerHTML = '<div style="color:#cc0000">Mermaid diagram error</div>';
    }
  }
}
