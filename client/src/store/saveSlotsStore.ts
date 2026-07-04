import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const API = '/api';

async function api<T>(path: string, token?: string | null, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Error del servidor');
  return data as T;
}

export interface SlotData {
  token: string | null;
  name: string;
  coins: number;
  cardCount: number;
  playTime: number;
  lastPlayed: string | null;
}

const EMPTY_SLOT: SlotData = {
  token: null,
  name: '',
  coins: 0,
  cardCount: 0,
  playTime: 0,
  lastPlayed: null,
};

function createEmptySlots(): SlotData[] {
  return Array.from({ length: 10 }, () => ({ ...EMPTY_SLOT }));
}

interface SaveSlotsState {
  slots: SlotData[];
  activeSlot: number | null;
  setSlot: (index: number, data: Partial<SlotData>) => void;
  activateSlot: (index: number) => void;
  deleteSlot: (index: number) => void;
  refreshSlots: () => Promise<void>;
}

export const useSaveSlotsStore = create<SaveSlotsState>()(
  persist(
    (set, get) => ({
      slots: createEmptySlots(),
      activeSlot: null,

      setSlot: (index, data) => {
        set((s) => {
          const slots = [...s.slots];
          slots[index] = { ...slots[index], ...data };
          return { slots };
        });
      },

      activateSlot: (index) => {
        set({ activeSlot: index });
      },

      deleteSlot: (index) => {
        set((s) => {
          const slots = [...s.slots];
          slots[index] = { ...EMPTY_SLOT };
          const activeSlot = s.activeSlot === index ? null : s.activeSlot;
          return { slots, activeSlot };
        });
      },

      refreshSlots: async () => {
        const { slots } = get();
        const tokens = slots.map((s) => s.token);
        try {
          const data = await api<{ profiles: (SlotData | null)[] }>('/profiles/batch', null, {
            method: 'POST',
            body: JSON.stringify({ tokens }),
          });
          if (data.profiles) {
            set((s) => {
              const updated = [...s.slots];
              data.profiles!.forEach((profile, i) => {
                if (profile) {
                  updated[i] = { ...updated[i], ...profile };
                }
              });
              return { slots: updated };
            });
          }
        } catch { /* non-critical */ }
      },
    }),
    {
      name: 'gacha-persona-slots',
      partialize: (state) => ({ slots: state.slots, activeSlot: state.activeSlot }),
    }
  )
);
