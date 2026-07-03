export interface PackType {
  id: string;
  name: string;
  cost: number;
  cardCount: number;
  guaranteeRarity: string | null;
  color: string;
  badgeLabel: string;
  description: string;
}

export const PACK_TYPES: PackType[] = [
  {
    id: 'basico',
    name: 'Sobre Básico',
    cost: 100,
    cardCount: 1,
    guaranteeRarity: null,
    color: '#3b82f6',
    badgeLabel: 'COMÚN',
    description: '1 carta · Cualquier rareza',
  },
  {
    id: 'deluxe',
    name: 'Sobre Deluxe',
    cost: 300,
    cardCount: 3,
    guaranteeRarity: 'RARO',
    color: '#94a3b8',
    badgeLabel: 'RARO+',
    description: '3 cartas · 1 Rara o mejor',
  },
  {
    id: 'premium',
    name: 'Sobre Premium',
    cost: 600,
    cardCount: 5,
    guaranteeRarity: 'EPICO',
    color: '#f59e0b',
    badgeLabel: 'ÉPICO+',
    description: '5 cartas · 1 Épica o mejor',
  },
  {
    id: 'legendario',
    name: 'Sobre Legendario',
    cost: 1000,
    cardCount: 7,
    guaranteeRarity: 'LEGENDARIO',
    color: '#dc2626',
    badgeLabel: '★ LEGENDARIO',
    description: '7 cartas · 1 Legendaria',
  },
];
