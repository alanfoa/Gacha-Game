import { create } from 'zustand';

export type Screen = 'mainmenu' | 'login' | 'saveSlots' | 'menu' | 'pack' | 'album' | 'options' | 'teamSelect' | 'battle' | 'missions';

interface ScreenState {
  current: Screen;
  screenParams: Record<string, any> | null;
  previous: Screen | null;
  navigate: (screen: Screen, params?: Record<string, any>) => void;
  back: () => void;
  isTransitioning: boolean;
  setTransitioning: (v: boolean) => void;
}

export const useScreenStore = create<ScreenState>((set, get) => ({
  current: 'mainmenu',
  screenParams: null,
  previous: null,
  isTransitioning: false,

  navigate: (screen, params) =>
    set((s) => ({ previous: s.current, current: screen, screenParams: params ?? null })),

  back: () => {
    const { previous, current } = get();
    if (current === 'mainmenu') return;
    set({ current: previous ?? 'mainmenu', screenParams: null, previous: null });
  },

  setTransitioning: (v) => set({ isTransitioning: v }),
}));
