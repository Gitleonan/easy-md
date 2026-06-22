import { describe, it, expect } from 'vitest';
import { renderMarkdown } from './render';
import { highlightCodeBlocks } from './highlight';

const SOURCE = [
  '```python',
  'def process(data):',
  '    result = []          # [!code highlight]',
  '    for item in data:',
  '        if item > 0:     # [!code focus]',
  '            result.append(item * 2)  # [!code ++]',
  '        else:',
  '            result.append(0)         # [!code --]',
  '    return result',
  '```',
].join('\n');

const TITLED_SOURCE = SOURCE.replace('```python', '```python title="demo.py"');

describe('code line marks pipeline', () => {
  it('emits data-line-marks on the wrapper', () => {
    const raw = renderMarkdown(SOURCE);
    expect(raw).toContain('data-line-marks=');
  });

  it('strips the marker comments from the visible source', () => {
    const raw = renderMarkdown(SOURCE);
    expect(raw).not.toContain('[!code');
  });

  it('attaches code-line-* classes onto the correct <span class="line"> after shiki', async () => {
    const raw = renderMarkdown(SOURCE);
    const html = await highlightCodeBlocks(raw, 'light');
    // 类必须落在 .line 节点上（CSS 样式的目标），而非游离的 span。
    expect(html).toMatch(/<span class="line code-line-highlight"/);
    expect(html).toMatch(/<span class="line code-line-focus"/);
    expect(html).toMatch(/<span class="line code-line-add"/);
    expect(html).toMatch(/<span class="line code-line-remove"/);
  });

  it('attaches line mark classes inside titled code blocks', async () => {
    const raw = renderMarkdown(TITLED_SOURCE);
    const html = await highlightCodeBlocks(raw, 'light');

    expect(html).toContain('<div class="code-block-title">demo.py</div>');
    expect(html).toMatch(/<span class="line code-line-highlight"/);
    expect(html).toMatch(/<span class="line code-line-focus"/);
    expect(html).toMatch(/<span class="line code-line-add"/);
    expect(html).toMatch(/<span class="line code-line-remove"/);
  });
});
