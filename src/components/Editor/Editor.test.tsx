import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { useTabsStore } from '../../stores/tabsStore';
import { useEditStore } from '../../stores/editStore';
import { Editor } from './Editor';

vi.mock('../../ipc/files', () => ({
  writeFile: vi.fn().mockResolvedValue(undefined),
}));

describe('Editor', () => {
  let innerHTMLDescriptor: PropertyDescriptor | undefined;

  beforeEach(() => {
    vi.useRealTimers();
    useEditStore.setState({ isEditing: false, isDirty: false, lastSaveAt: 0 });
    useTabsStore.setState({
      activeTabId: 'tab-1',
      tabs: [{
        id: 'tab-1',
        filePath: 'C:\\doc.md',
        fileName: 'doc.md',
        source: Array.from({ length: 80 }, (_, i) => `line ${i + 1}`).join('\n'),
        html: '<p>doc</p>',
        toc: [],
        scrollTop: 320,
        tocExpanded: {},
        isLoading: false,
      }],
    });
  });

  afterEach(() => {
    if (innerHTMLDescriptor) {
      Object.defineProperty(Element.prototype, 'innerHTML', innerHTMLDescriptor);
      innerHTMLDescriptor = undefined;
    }
    vi.useRealTimers();
  });

  it('starts at the preview scroll position when entering edit mode', () => {
    const { container } = render(<Editor />);
    const textarea = container.querySelector<HTMLTextAreaElement>('.editor-textarea');

    expect(textarea?.scrollTop).toBe(320);
  });

  it('does not rebuild the whole highlight layer with innerHTML while typing', () => {
    vi.useFakeTimers();
    const source = Array.from({ length: 5_000 }, (_, i) => `line ${i + 1}`).join('\n');
    useTabsStore.setState({
      activeTabId: 'tab-1',
      tabs: [{
        id: 'tab-1',
        filePath: 'C:\\large.md',
        fileName: 'large.md',
        source,
        html: '<p>large</p>',
        toc: [],
        scrollTop: 0,
        tocExpanded: {},
        isLoading: false,
      }],
    });

    innerHTMLDescriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
    const innerHTMLWrites = vi.fn();
    Object.defineProperty(Element.prototype, 'innerHTML', {
      configurable: true,
      get() {
        return innerHTMLDescriptor?.get?.call(this);
      },
      set(value) {
        if (this instanceof HTMLPreElement) {
          innerHTMLWrites(value);
        }
        innerHTMLDescriptor?.set?.call(this, value);
      },
    });

    const { container } = render(<Editor />);
    const textarea = container.querySelector<HTMLTextAreaElement>('.editor-textarea');
    expect(textarea).not.toBeNull();
    const writesAfterInitialRender = innerHTMLWrites.mock.calls.length;

    fireEvent.change(textarea!, { target: { value: `${source}\n# new heading` } });
    vi.advanceTimersByTime(200);

    expect(innerHTMLWrites).toHaveBeenCalledTimes(writesAfterInitialRender);
  });
});
