import { create } from 'zustand';

interface SearchState {
  keyword: string;
  visible: boolean;
  total: number;
  current: number;
  setKeyword: (k: string) => void;
  setVisible: (v: boolean) => void;
  setResult: (total: number, current: number) => void;
  next: () => void;
  prev: () => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  keyword: '',
  visible: false,
  total: 0,
  current: 0,
  setKeyword: (keyword) => set({ keyword }),
  setVisible: (visible) => set({ visible }),
  setResult: (total, current) => set({ total, current }),
  next: () => set((s) => ({ current: s.total ? (s.current + 1) % s.total : 0 })),
  prev: () => set((s) => ({ current: s.total ? (s.current - 1 + s.total) % s.total : 0 })),
}));
