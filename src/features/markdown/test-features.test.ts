import { beforeAll, describe, expect, it } from 'vitest';
import mermaid from 'mermaid';
import featuresMd from '../../../features.md?raw';

function extractFirstMermaidFence(source: string): string {
  const match = source.match(/```mermaid\n([\s\S]*?)```/);
  return match?.[1].trim() ?? '';
}

describe('features.md', () => {
  beforeAll(() => {
    if (!('getBBox' in SVGElement.prototype)) {
      Object.defineProperty(SVGElement.prototype, 'getBBox', {
        value: () => ({ x: 0, y: 0, width: 120, height: 24 }),
      });
    }
  });

  it('contains Mermaid syntax that Mermaid 11 can parse', async () => {
    const source = extractFirstMermaidFence(featuresMd);

    expect(source).not.toBe('');
    await expect(mermaid.parse(source)).resolves.toBeDefined();
  });

  it('contains Mermaid syntax that Mermaid 11 can render', async () => {
    const source = extractFirstMermaidFence(featuresMd);
    mermaid.initialize({ startOnLoad: false, theme: 'default' });

    await expect(mermaid.render('test-features-mermaid', source)).resolves.toEqual(
      expect.objectContaining({ svg: expect.stringContaining('<svg') }),
    );
  });
});
