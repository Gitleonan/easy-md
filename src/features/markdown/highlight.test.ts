import { describe, it, expect } from 'vitest';
import { highlightCodeBlocks } from './highlight';

describe('highlightCodeBlocks', () => {
  it('replaces code block with shiki output', async () => {
    const input = '<pre><code class="language-ts">const x = 1;</code></pre>';
    const result = await highlightCodeBlocks(input, 'light');
    // shiki 渲染后会输出带 shiki 类的 <pre>
    expect(result).toContain('shiki');
    expect(result).toContain('const');
    // 原始的 <code class="language-ts"> 应该被替换
    expect(result).not.toContain('<code class="language-ts">');
  });

  it('leaves unknown language as plain', async () => {
    const input = '<pre><code class="language-xyz">hello</code></pre>';
    const result = await highlightCodeBlocks(input, 'light');
    expect(result).toContain('hello');
  });

  it('handles multiple code blocks', async () => {
    const input = '<pre><code class="language-ts">const a = 1;</code></pre><pre><code class="language-bash">echo hi</code></pre>';
    const result = await highlightCodeBlocks(input, 'light');
    // 两个都应被处理
    expect(result).toContain('const');
    expect(result).toContain('echo');
  });

  it('returns empty string for empty input', async () => {
    expect(await highlightCodeBlocks('', 'light')).toBe('');
  });
});
