import { create } from 'zustand';

interface LightboxState {
  src: string | null;
  open: (src: string) => void;
  close: () => void;
}

export const useLightbox = create<LightboxState>((set) => ({
  src: null,
  open: (src) => set({ src }),
  close: () => set({ src: null }),
}));
