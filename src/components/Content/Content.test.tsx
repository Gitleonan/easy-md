import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { useTabsStore } from '../../stores/tabsStore';
import { countMarkdownWords, getActiveHeadingId, Content } from './Content';

vi.mock('../../ipc/files', () => ({
  resolveImages: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../features/markdown/mermaid', () => ({
  renderMermaidInContainer: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../ipc/opener', () => ({
  openExternalUrl: vi.fn(),
  openLocalPath: vi.fn(),
}));

beforeEach(() => {
  useTabsStore.setState({ tabs: [], activeTabId: null });
});

describe('countMarkdownWords', () => {
  it('counts CJK characters and latin words from markdown text', () => {
    const source = '# 开发进度记录\n\n完成 export PDF and smooth scroll.\n\n`ignoredCode()`';

    expect(countMarkdownWords(source)).toBe(13);
  });
});

describe('getActiveHeadingId', () => {
  it('returns the latest heading above the viewport offset', () => {
    const container = document.createElement('div');
    container.innerHTML = '<h1 id="intro">Intro</h1><h2 id="details">Details</h2>';
    const [intro, details] = Array.from(container.querySelectorAll<HTMLElement>('h1,h2'));

    Object.defineProperty(intro, 'offsetTop', { value: 20 });
    Object.defineProperty(details, 'offsetTop', { value: 240 });
    container.scrollTop = 160;

    expect(getActiveHeadingId(container, 96)).toBe('details');
  });

  it('returns null without headings', () => {
    const container = document.createElement('div');
    container.innerHTML = '<p>No headings</p>';

    expect(getActiveHeadingId(container)).toBeNull();
  });
});

describe('Content', () => {
  it('injects the current html after loading finishes even when the html string did not change', async () => {
    useTabsStore.setState({
      activeTabId: 'tab-1',
      tabs: [{
        id: 'tab-1',
        filePath: 'C:\\doc.md',
        fileName: 'doc.md',
        source: '# Title',
        html: '<h1>Title</h1>',
        toc: [],
        scrollTop: 0,
        tocExpanded: {},
        isLoading: true,
      }],
    });

    const { container } = render(<Content />);
    expect(screen.getByText('正在加载文件…')).toBeInTheDocument();

    await act(async () => {
      useTabsStore.setState((state) => ({
        tabs: state.tabs.map((tab) => ({ ...tab, isLoading: false })),
      }));
    });

    const main = container.querySelector('.md-content');
    expect(main).toHaveTextContent('Title');
  });

  it('opens relative markdown links in a new tab', async () => {
    const openTab = vi.fn().mockResolvedValue(undefined);
    useTabsStore.setState({
      openTab,
      activeTabId: 'tab-1',
      tabs: [{
        id: 'tab-1',
        filePath: 'C:\\docs\\current.md',
        fileName: 'current.md',
        source: '[Next](./next.md)',
        html: '<p><a href="./next.md">Next</a></p>',
        toc: [],
        scrollTop: 0,
        tocExpanded: {},
        isLoading: false,
      }],
    });

    render(<Content />);
    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => {
      expect(openTab).toHaveBeenCalledWith('C:\\docs\\next.md');
    });
  });

  it('selects only the preview content on Ctrl+A', async () => {
    const sidebar = document.createElement('aside');
    sidebar.textContent = '目录标题';
    document.body.appendChild(sidebar);

    useTabsStore.setState({
      activeTabId: 'tab-1',
      tabs: [{
        id: 'tab-1',
        filePath: 'C:\\docs\\current.md',
        fileName: 'current.md',
        source: '# Title\n\nBody',
        html: '<h1>Title</h1><p>Body</p>',
        toc: [],
        scrollTop: 0,
        tocExpanded: {},
        isLoading: false,
      }],
    });

    const { container } = render(<Content />);
    const main = container.querySelector<HTMLElement>('.md-content');
    expect(main).not.toBeNull();

    await waitFor(() => expect(main).toHaveTextContent('Title'));

    const event = new KeyboardEvent('keydown', {
      key: 'a',
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });
    main!.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(window.getSelection()?.toString()).toBe('TitleBody');
    expect(window.getSelection()?.toString()).not.toContain('目录标题');

    sidebar.remove();
  });

  it('creates line numbers from the real code text line count', async () => {
    useTabsStore.setState({
      activeTabId: 'tab-1',
      tabs: [{
        id: 'tab-1',
        filePath: 'C:\\docs\\current.md',
        fileName: 'current.md',
        source: '```js\n\n```',
        html: '<div class="code-block-wrapper"><pre class="shiki"><code><span class="line">a</span>\n\n<span class="line">b</span>\n\n<span class="line">c</span></code></pre></div>',
        toc: [],
        scrollTop: 0,
        tocExpanded: {},
        isLoading: false,
      }],
    });

    const { container } = render(<Content />);

    await waitFor(() => {
      expect(container.querySelectorAll('.line-number')).toHaveLength(5);
    });
  });
});
