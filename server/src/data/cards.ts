export const Rarity = {
  Common: 'COMUN',
  Rare: 'RARO',
  Epic: 'EPICO',
  Legendary: 'LEGENDARIO',
} as const;

export type Rarity = (typeof Rarity)[keyof typeof Rarity];

export const Element = {
  Fire: 'FUEGO',
  Water: 'AGUA',
  Earth: 'TIERRA',
  Wind: 'VIENTO',
  Light: 'LUZ',
  Shadow: 'SOMBRA',
} as const;

export type Element = (typeof Element)[keyof typeof Element];

export interface CardStats {
  attack: number;
  defense: number;
  magic: number;
  luck: number;
}

export interface Card {
  id: string;
  name: string;
  anime: string;
  rarity: Rarity;
  stats: CardStats;
  hp: number;
  element: Element;
}

export const ELEMENT_CHART: Record<Element, { strong: Element; weak: Element }> = {
  FUEGO:  { strong: 'VIENTO', weak: 'AGUA' },
  AGUA:   { strong: 'FUEGO', weak: 'TIERRA' },
  TIERRA: { strong: 'AGUA', weak: 'VIENTO' },
  VIENTO: { strong: 'TIERRA', weak: 'FUEGO' },
  LUZ:    { strong: 'SOMBRA', weak: 'SOMBRA' },
  SOMBRA: { strong: 'LUZ', weak: 'LUZ' },
};

export function getElementMultiplier(atk: Element, def: Element): number {
  if (atk === def) return 1;
  const chart = ELEMENT_CHART[atk];
  if (chart.strong === def) return 1.5;
  if (chart.weak === def) return 0.5;
  return 1;
}

const S = (a: number, d: number, m: number, l: number): CardStats => ({ attack: a, defense: d, magic: m, luck: l });

export const cards: Card[] = [
  // --- COMUN ---
  { id: 'c01', name: 'Tanjiro',  anime: 'Demon Slayer',          rarity: Rarity.Common, stats: S(40, 30, 20, 25), hp: 180, element: Element.Fire },
  { id: 'c02', name: 'Nezuko',   anime: 'Demon Slayer',          rarity: Rarity.Common, stats: S(35, 25, 30, 30), hp: 180, element: Element.Fire },
  { id: 'c03', name: 'Zenitsu',  anime: 'Demon Slayer',          rarity: Rarity.Common, stats: S(45, 20, 15, 10), hp: 160, element: Element.Wind },
  { id: 'c04', name: 'Inosuke',  anime: 'Demon Slayer',          rarity: Rarity.Common, stats: S(50, 35, 10, 15), hp: 190, element: Element.Earth },
  { id: 'c05', name: 'Eren',     anime: 'Attack on Titan',       rarity: Rarity.Common, stats: S(45, 30, 15, 20), hp: 180, element: Element.Earth },
  { id: 'c06', name: 'Mikasa',   anime: 'Attack on Titan',       rarity: Rarity.Common, stats: S(50, 35, 10, 20), hp: 190, element: Element.Wind },
  { id: 'c07', name: 'Naruto',   anime: 'Naruto',                rarity: Rarity.Common, stats: S(40, 25, 35, 30), hp: 200, element: Element.Light },
  { id: 'c08', name: 'Sasuke',   anime: 'Naruto',                rarity: Rarity.Common, stats: S(45, 20, 40, 15), hp: 210, element: Element.Shadow },
  { id: 'c09', name: 'Luffy',    anime: 'One Piece',             rarity: Rarity.Common, stats: S(45, 30, 15, 35), hp: 180, element: Element.Light },
  { id: 'c10', name: 'Zoro',     anime: 'One Piece',             rarity: Rarity.Common, stats: S(55, 35, 10, 10), hp: 200, element: Element.Wind },

  // --- RARO ---
  { id: 'r01', name: 'Gojo',           anime: 'Jujutsu Kaisen',        rarity: Rarity.Rare, stats: S(60, 40, 70, 40), hp: 340, element: Element.Light },
  { id: 'r02', name: 'Rudeus',         anime: 'Mushoku Tensei',        rarity: Rarity.Rare, stats: S(45, 35, 65, 30), hp: 290, element: Element.Water },
  { id: 'r03', name: 'Jotaro',         anime: 'JoJo Bizarre Adventure', rarity: Rarity.Rare, stats: S(65, 50, 20, 45), hp: 270, element: Element.Light },
  { id: 'r04', name: 'Dio',            anime: 'JoJo Bizarre Adventure', rarity: Rarity.Rare, stats: S(60, 45, 50, 35), hp: 310, element: Element.Shadow },
  { id: 'r05', name: 'Itadori',        anime: 'Jujutsu Kaisen',        rarity: Rarity.Rare, stats: S(55, 40, 30, 40), hp: 250, element: Element.Fire },
  { id: 'r06', name: 'Eren (Titan)',   anime: 'Attack on Titan',       rarity: Rarity.Rare, stats: S(70, 55, 15, 25), hp: 280, element: Element.Earth },
  { id: 'r07', name: 'Gon',            anime: 'Hunter x Hunter',       rarity: Rarity.Rare, stats: S(55, 35, 30, 45), hp: 240, element: Element.Fire },
  { id: 'r08', name: 'Killua',         anime: 'Hunter x Hunter',       rarity: Rarity.Rare, stats: S(50, 30, 40, 50), hp: 240, element: Element.Wind },

  // --- EPICO ---
  { id: 'e01', name: 'Joseph Joestar', anime: 'JoJo Bizarre Adventure', rarity: Rarity.Epic, stats: S(70, 55, 40, 80), hp: 330, element: Element.Light },
  { id: 'e02', name: 'Orsted',         anime: 'Mushoku Tensei',        rarity: Rarity.Epic, stats: S(85, 70, 75, 40), hp: 460, element: Element.Water },
  { id: 'e03', name: 'Sukuna',         anime: 'Jujutsu Kaisen',        rarity: Rarity.Epic, stats: S(90, 65, 80, 35), hp: 470, element: Element.Shadow },
  { id: 'e04', name: 'Madara',         anime: 'Naruto',                rarity: Rarity.Epic, stats: S(85, 60, 75, 40), hp: 440, element: Element.Shadow },
  { id: 'e05', name: 'Kaido',          anime: 'One Piece',             rarity: Rarity.Epic, stats: S(90, 75, 40, 30), hp: 410, element: Element.Fire },

  // --- LEGENDARIO ---
  { id: 'l01', name: 'Giorno Giovanna',  anime: 'JoJo Bizarre Adventure', rarity: Rarity.Legendary, stats: S(95, 80, 90, 99), hp: 530, element: Element.Light },
  { id: 'l02', name: 'Rudeus (God)',     anime: 'Mushoku Tensei',        rarity: Rarity.Legendary, stats: S(90, 85, 99, 70), hp: 548, element: Element.Water },
  { id: 'l03', name: 'Gojo (Awakened)',  anime: 'Jujutsu Kaisen',        rarity: Rarity.Legendary, stats: S(95, 90, 99, 60), hp: 568, element: Element.Light },
];

export function getCardsByRarity(rarity: Rarity): Card[] {
  return cards.filter((c) => c.rarity === rarity);
}
