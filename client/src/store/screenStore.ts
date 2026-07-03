import { create } from 'zustand';

export type Screen = 'menu' | 'pack' | 'album' | 'options' | 'teamSelect' | 'battle' | 'missions';

interface ScreenState {
  current: Screen;
  previous: Screen | null;
  navigate: (screen: Screen) => void;
  back: () => void;
  isTransitioning: boolean;
  setTransitioning: (v: boolean) => void;
}

export const useScreenStore = create<ScreenState>((set, get) => ({
  current: 'menu',
  previous: null,
  isTransitioning: false,

  navigate: (screen) =>
    set((s) => ({ previous: s.current, current: screen })),

  back: () => {
    const { previous, current } = get();
    if (current === 'menu') return;
    set({ current: previous ?? 'menu', previous: null });
  },

  setTransitioning: (v) => set({ isTransitioning: v }),
}));
