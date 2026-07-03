import { Rarity, cards } from '../data/cards.js';
import type { Card } from '../data/cards.js';

export interface PullResult {
  card: Card;
  wasPity: boolean;
}

const RARITY_RANGES = [
  { rarity: Rarity.Legendary, chance: 0.01 },
  { rarity: Rarity.Epic, chance: 0.09 },
  { rarity: Rarity.Rare, chance: 0.20 },
  { rarity: Rarity.Common, chance: 0.70 },
];

const RARITY_ORDER: Record<string, number> = {
  [Rarity.Common]: 0,
  [Rarity.Rare]: 1,
  [Rarity.Epic]: 2,
  [Rarity.Legendary]: 3,
};

function rollRarity(pityActive: boolean): Rarity {
  if (pityActive) return Rarity.Legendary;

  const roll = Math.random();
  let cumulative = 0;

  for (const { rarity, chance } of RARITY_RANGES) {
    cumulative += chance;
    if (roll < cumulative) return rarity;
  }

  return Rarity.Common;
}

function rollRarityWithFloor(floor: string): Rarity {
  const filtered = RARITY_RANGES.filter((r) => RARITY_ORDER[r.rarity] >= RARITY_ORDER[floor]);
  const totalChance = filtered.reduce((s, r) => s + r.chance, 0);

  const roll = Math.random() * totalChance;
  let cumulative = 0;

  for (const { rarity, chance } of filtered) {
    cumulative += chance;
    if (roll < cumulative) return rarity;
  }

  return filtered[filtered.length - 1].rarity;
}

function pickCard(rarity: Rarity): Card {
  const pool = cards.filter((c) => c.rarity === rarity);
  return pool[Math.floor(Math.random() * pool.length)] ?? cards[0];
}

export function pullCard(pityCount: number): PullResult {
  const wasPity = pityCount >= 49;
  const rarity = rollRarity(wasPity);
  const card = pickCard(rarity);
  return { card, wasPity };
}

export function pullCardWithGuarantee(pityCount: number, guaranteeRarity: string | null): PullResult {
  const wasPity = pityCount >= 49;
  const rarity = guaranteeRarity && RARITY_ORDER[guaranteeRarity] >= 0
    ? rollRarityWithFloor(guaranteeRarity)
    : rollRarity(wasPity);
  const card = pickCard(rarity);
  return { card, wasPity };
}
