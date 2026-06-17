import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTabsStore } from './tabsStore';

// Mock Tauri API
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn().mockResolvedValue('# Hello'),
}));

describe('tabsStore', () => {
  beforeEach(() => {
    useTabsStore.setState({ tabs: [], activeTabId: null });
  });

  it('opens a new tab', async () => {
    await useTabsStore.getState().openTab('C:/a.md');
    const s = useTabsStore.getState();
    expect(s.tabs).toHaveLength(1);
    expect(s.tabs[0].fileName).toBe('a.md');
    expect(s.tabs[0].filePath).toBe('C:/a.md');
    expect(s.activeTabId).toBe(s.tabs[0].id);
  });

  it('deduplicates same path', async () => {
    await useTabsStore.getState().openTab('C:/a.md');
    await useTabsStore.getState().openTab('C:/a.md');
    expect(useTabsStore.getState().tabs).toHaveLength(1);
  });

  it('closes a tab and clears active if last', async () => {
    await useTabsStore.getState().openTab('C:/a.md');
    const id = useTabsStore.getState().tabs[0].id;
    useTabsStore.getState().closeTab(id);
    expect(useTabsStore.getState().tabs).toHaveLength(0);
    expect(useTabsStore.getState().activeTabId).toBeNull();
  });

  it('sets active tab', async () => {
    await useTabsStore.getState().openTab('C:/a.md');
    await useTabsStore.getState().openTab('C:/b.md');
    const id = useTabsStore.getState().tabs[0].id;
    useTabsStore.getState().setActive(id);
    expect(useTabsStore.getState().activeTabId).toBe(id);
  });

  it('sets scroll position', async () => {
    await useTabsStore.getState().openTab('C:/a.md');
    const id = useTabsStore.getState().tabs[0].id;
    useTabsStore.getState().setScrollTop(id, 150);
    expect(useTabsStore.getState().tabs[0].scrollTop).toBe(150);
  });

  it('updates source', async () => {
    await useTabsStore.getState().openTab('C:/a.md');
    const id = useTabsStore.getState().tabs[0].id;
    useTabsStore.getState().updateSource(id, '# New', '<h1>New</h1>', []);
    expect(useTabsStore.getState().tabs[0].source).toBe('# New');
    expect(useTabsStore.getState().tabs[0].html).toBe('<h1>New</h1>');
  });
});
