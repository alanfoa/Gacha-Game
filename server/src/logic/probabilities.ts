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

export function pullCard(pityCount: number): PullResult {
  const wasPity = pityCount >= 49;
  const rarity = rollRarity(wasPity);

  const pool = cards.filter((c) => c.rarity === rarity);
  const card = pool[Math.floor(Math.random() * pool.length)] ?? cards[0];

  return { card, wasPity };
}
