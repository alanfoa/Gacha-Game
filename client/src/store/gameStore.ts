import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';
import type { PersistStorage, StorageValue } from 'zustand/middleware';

const API = '/api';

export interface UserProfile {
  id: string;
  name: string;
  coins: number;
  pityCount: number;
  totalPulls: number;
  legendaryCount: number;
  playTime?: number;
  lastPlayed?: string | null;
}

export interface CardData {
  id: string;
  name: string;
  anime: string;
  rarity: string;
  stats: { attack: number; defense: number; magic: number; luck: number; speed: number };
  element: string;
  hp: number;
  maxMana: number;
  attackName: string;
  attackCost: number;
  attackCooldown: number;
  magicName?: string;
  magicCost?: number;
  magicCooldown?: number;
  skillName?: string;
  skillCost?: number;
  skillCooldown?: number;
  ultimateName?: string;
  ultimateCost?: number;
  ultimateCooldown?: number;
}

export interface BattleSkill {
  id: string;
  name: string;
  type: 'ATTACK' | 'MAGIC' | 'SKILL' | 'ULTIMATE' | 'DEFEND';
  power: number;
  cost: number;
  cooldown: number;
  currentCooldown: number;
  description: string;
}

export interface BattleCardState {
  uid?: string;
  cardId: string;
  name: string;
  rarity: string;
  element: string;
  stats: { attack: number; defense: number; magic: number; luck: number; speed: number };
  currentHp: number;
  maxHp: number;
  currentMana: number;
  maxMana: number;
  skills: BattleSkill[];
  statusEffects: { type: string; remainingTurns: number; value: number; sourceName: string }[];
  skipNextTurn: boolean;
}

export interface BattleLogEntry {
  cardId: string;
  cardUid?: string;
  targetId: string;
  targetUid?: string;
  damage: number;
  critical: boolean;
  action: string;
  skillId?: string;
  message: string;
}

export interface Mission {
  id: string;
  name: string;
  description: string;
  progress: number;
  goal: number;
  completed: boolean;
  claimed: boolean;
  reward: number;
}

export interface PackTypeInfo {
  id: string;
  name: string;
  cost: number;
  cardCount: number;
  guaranteeRarity: string | null;
  color: string;
  badgeLabel: string;
  description: string;
}

interface OpenPackResult {
  cards: { card: CardData; isNew: boolean }[];
  user: UserProfile;
}

interface GameState {
  token: string | null;
  user: UserProfile | null;
  inventory: string[];
  unlockedCards: string[];
  allCards: CardData[];
  packTypes: PackTypeInfo[];
  loading: boolean;
  error: string | null;

  // Missions
  missions: Mission[];
  missionDate: string;

  // Battle state
  selectedCardIds: string[];
  battleId: string | null;
  playerBattleCards: BattleCardState[];
  enemyBattleCards: BattleCardState[];
  battleLog: BattleLogEntry[];
  battleTurn: number;
  battleWinner: string | null;
  battleCoinsEarned: number;

  register: (name: string) => Promise<void>;
  fetchProfile: () => Promise<void>;
  fetchCards: () => Promise<void>;
  fetchPacks: () => Promise<void>;
  openPack: (packType?: string, free?: boolean) => Promise<OpenPackResult | null>;
  importSave: (json: string) => boolean;
  switchToken: (newToken: string | null) => void;
  logout: () => void;
  fetchMissions: () => Promise<void>;
  claimMission: (missionId: string) => Promise<boolean>;

  // Battle actions
  toggleSelectCard: (cardId: string) => void;
  startBattle: () => Promise<void>;
  submitBattleActions: (actions: { cardId: string; action: string; targetId: string; skillId?: string }[]) => Promise<void>;
  clearBattle: () => void;
}

const storage: PersistStorage<{ token: string | null }> = {
  getItem: async (name) => {
    const val = await get(name);
    return val as StorageValue<{ token: string | null }> | null;
  },
  setItem: async (name, value) => {
    await set(name, value);
  },
  removeItem: async (name) => {
    await del(name);
  },
};

async function api<T>(path: string, token?: string | null, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API}${path}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error ?? 'Error del servidor');
  }

  return data as T;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      inventory: [],
      unlockedCards: [],
      allCards: [],
      packTypes: [],
      loading: false,
      error: null,

      missions: [],
      missionDate: '',

      selectedCardIds: [],
      battleId: null,
      playerBattleCards: [],
      enemyBattleCards: [],
      battleLog: [],
      battleTurn: 0,
      battleWinner: null,
      battleCoinsEarned: 0,

      register: async (name) => {
        set({ loading: true, error: null });
        try {
          const data = await api<{ user: UserProfile; token: string }>('/register', null, {
            method: 'POST',
            body: JSON.stringify({ name }),
          });
          set({ token: data.token, user: data.user, loading: false });
          await get().fetchCards();
          await get().fetchPacks();
        } catch (e) {
          set({ loading: false, error: (e as Error).message });
        }
      },

      fetchProfile: async () => {
        const { token } = get();
        if (!token) return;
        set({ loading: true, error: null });
        try {
          const data = await api<{ user: UserProfile; inventory: string[]; unlockedCards: string[] }>(
            '/profile', token
          );
          set({
            user: data.user,
            inventory: data.inventory,
            unlockedCards: data.unlockedCards,
            loading: false,
          });
        } catch (e) {
          set({ loading: false, error: (e as Error).message });
        }
      },

      fetchCards: async () => {
        try {
          const data = await api<{ cards: CardData[] }>('/cards');
          set({ allCards: data.cards });
        } catch {
          // Non-critical
        }
      },

      fetchPacks: async () => {
        try {
          const data = await api<{ packs: PackTypeInfo[] }>('/packs');
          set({ packTypes: data.packs });
        } catch { /* non-critical */ }
      },

      openPack: async (packType = 'basico', free = false) => {
        const { token } = get();
        if (!token) return null;
        set({ loading: true, error: null });
        try {
          const data = await api<OpenPackResult>('/open', token, {
            method: 'POST',
            body: JSON.stringify({ packType, free }),
          });
          const cardIds = data.cards.map((c) => c.card.id);
          const newIds = data.cards.filter((c) => c.isNew).map((c) => c.card.id);
          set((s) => ({
            user: data.user,
            inventory: [...s.inventory, ...cardIds],
            unlockedCards: [...new Set([...s.unlockedCards, ...newIds])],
            loading: false,
          }));
          return data;
        } catch (e) {
          set({ loading: false, error: (e as Error).message });
          return null;
        }
      },

      importSave: (json: string) => {
        try {
          const data = JSON.parse(json);
          if (!data.token || typeof data.token !== 'string') return false;
          set({ token: data.token, user: null, inventory: [], unlockedCards: [], error: null });
          return true;
        } catch {
          return false;
        }
      },

      fetchMissions: async () => {
        const { token } = get();
        if (!token) return;
        try {
          const data = await api<{ missions: Mission[]; date: string }>('/missions', token);
          set({ missions: data.missions, missionDate: data.date });
        } catch { /* non-critical */ }
      },

      claimMission: async (missionId: string): Promise<boolean> => {
        const { token } = get();
        if (!token) return false;
        try {
          const data = await api<{
            claimed: boolean; rewardType: string; rewardAmount: number;
            freePack: boolean; user: UserProfile;
          }>('/missions/claim', token, {
            method: 'POST',
            body: JSON.stringify({ missionId }),
          });
          set((s) => ({
            user: data.user,
            missions: s.missions.map((m) =>
              m.id === missionId ? { ...m, claimed: true } : m
            ),
          }));
          return data.freePack;
        } catch { return false; }
      },

      switchToken: (newToken: string | null) => {
        set({ token: newToken, user: null, inventory: [], unlockedCards: [], error: null });
      },

      logout: () => {
        set({ token: null, user: null, inventory: [], unlockedCards: [], allCards: [], missions: [], missionDate: '' });
      },

      toggleSelectCard: (cardId: string) => {
        set((s) => {
          const already = s.selectedCardIds.includes(cardId);
          if (already) {
            return { selectedCardIds: s.selectedCardIds.filter((id) => id !== cardId) };
          }
          if (s.selectedCardIds.length >= 3) {
            return { error: 'Máximo 3 cartas por equipo' };
          }
          return { selectedCardIds: [...s.selectedCardIds, cardId] };
        });
      },

      startBattle: async () => {
        const { token, selectedCardIds } = get();
        if (!token || selectedCardIds.length !== 3) return;
        set({ loading: true, error: null });
        try {
          const data = await api<{
            battleId: string;
            playerCards: BattleCardState[];
            enemyCards: BattleCardState[];
          }>('/battle/start', token, {
            method: 'POST',
            body: JSON.stringify({ cardIds: selectedCardIds }),
          });
          set({
            battleId: data.battleId,
            playerBattleCards: data.playerCards,
            enemyBattleCards: data.enemyCards,
            battleLog: [],
            battleTurn: 0,
            battleWinner: null,
            battleCoinsEarned: 0,
            loading: false,
          });
        } catch (e) {
          set({ loading: false, error: (e as Error).message });
        }
      },

      submitBattleActions: async (actions) => {
        const { token, battleId } = get();
        if (!token || !battleId) return;
        set({ loading: true, error: null });
        try {
          const data = await api<{
            turn: number;
            actions: BattleLogEntry[];
            playerCards: BattleCardState[];
            enemyCards: BattleCardState[];
            winner: string | null;
            coinsEarned: number;
          }>('/battle/action', token, {
            method: 'POST',
            body: JSON.stringify({ battleId, actions }),
          });
          set((s) => ({
            playerBattleCards: data.playerCards,
            enemyBattleCards: data.enemyCards,
            battleLog: [...s.battleLog, ...data.actions],
            battleTurn: data.turn,
            battleWinner: data.winner,
            battleCoinsEarned: data.coinsEarned,
            loading: false,
          }));
          if (data.winner) {
            await get().fetchProfile();
          }
        } catch (e) {
          set({ loading: false, error: (e as Error).message });
        }
      },

      clearBattle: () => {
        set({
          selectedCardIds: [],
          battleId: null,
          playerBattleCards: [],
          enemyBattleCards: [],
          battleLog: [],
          battleTurn: 0,
          battleWinner: null,
          battleCoinsEarned: 0,
        });
      },
    }),
    {
      name: 'gacha-persona-auth',
      storage,
      partialize: (state) => ({ token: state.token }),
    }
  )
);
