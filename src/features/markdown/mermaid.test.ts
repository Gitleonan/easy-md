import { describe, it, expect } from 'vitest';
import { extractMermaidBlocks } from './mermaid';

describe('extractMermaidBlocks', () => {
  it('extracts mermaid diagram source from html', () => {
    const html = '<div class="mermaid">graph TD\nA-->B</div>';
    const blocks = extractMermaidBlocks(html);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].source).toContain('graph TD');
    expect(blocks[0].id).toBeTruthy();
  });

  it('extracts multiple mermaid blocks', () => {
    const html = '<div class="mermaid">graph TD\nA-->B</div><p>text</p><div class="mermaid">sequenceDiagram\nA->>B: Hello</div>';
    const blocks = extractMermaidBlocks(html);
    expect(blocks).toHaveLength(2);
    expect(blocks[0].id).not.toBe(blocks[1].id);
  });

  it('returns empty array for no mermaid blocks', () => {
    const html = '<p>just text</p>';
    expect(extractMermaidBlocks(html)).toEqual([]);
  });

  it('handles empty source gracefully', () => {
    const html = '<div class="mermaid"></div>';
    const blocks = extractMermaidBlocks(html);
    expect(blocks).toHaveLength(1);
  });
});
