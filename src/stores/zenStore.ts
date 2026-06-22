import { create } from 'zustand';

interface ZenState {
  isZen: boolean;
  toggle: () => void;
  enable: () => void;
  disable: () => void;
}

export const useZenStore = create<ZenState>((set, get) => ({
  isZen: false,
  toggle() {
    set({ isZen: !get().isZen });
  },
  enable() {
    set({ isZen: true });
  },
  disable() {
    set({ isZen: false });
  },
}));
