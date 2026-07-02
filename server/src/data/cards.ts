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
  speed: number;
}

export interface Card {
  id: string;
  name: string;
  anime: string;
  rarity: Rarity;
  stats: CardStats;
  hp: number;
  element: Element;
  attackName: string;
  magicName?: string;
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

const S = (a: number, d: number, m: number, l: number, spd: number): CardStats => ({ attack: a, defense: d, magic: m, luck: l, speed: spd });

export const cards: Card[] = [
  // --- COMUN ---
  { id: 'tanjiro_c', name: 'Tanjiro',  anime: 'Demon Slayer',          rarity: Rarity.Common, stats: S(32, 22, 10, 5, 55), hp: 110, element: Element.Fire,   attackName: 'Primera Postura: Tajo de la Superficie' },
  { id: 'nezuko_c',  name: 'Nezuko',   anime: 'Demon Slayer',          rarity: Rarity.Common, stats: S(30, 25, 10, 5, 50), hp: 120, element: Element.Fire,   attackName: 'Garra Demoniaca' },
  { id: 'zenitsu_c', name: 'Zenitsu',  anime: 'Demon Slayer',          rarity: Rarity.Common, stats: S(35, 20, 10, 5, 60), hp: 100, element: Element.Wind,   attackName: 'Destello del Relámpago' },
  { id: 'inosuke_c', name: 'Inosuke',  anime: 'Demon Slayer',          rarity: Rarity.Common, stats: S(33, 24, 10, 5, 52), hp: 115, element: Element.Earth,  attackName: 'Colmillo Perforador' },
  { id: 'eren_c',    name: 'Eren',     anime: 'Attack on Titan',       rarity: Rarity.Common, stats: S(34, 21, 10, 5, 54), hp: 110, element: Element.Earth,  attackName: 'Corte de Cuchillas' },
  { id: 'mikasa_c',  name: 'Mikasa',   anime: 'Attack on Titan',       rarity: Rarity.Common, stats: S(35, 22, 10, 5, 58), hp: 105, element: Element.Wind,   attackName: 'Tajo de Alta Velocidad' },
  { id: 'naruto_c',  name: 'Naruto',   anime: 'Naruto',                rarity: Rarity.Common, stats: S(31, 23, 10, 5, 53), hp: 115, element: Element.Light,  attackName: 'Combo de Naruto' },
  { id: 'sasuke_c',  name: 'Sasuke',   anime: 'Naruto',                rarity: Rarity.Common, stats: S(34, 21, 10, 5, 57), hp: 105, element: Element.Shadow, attackName: 'Tajo Kusanagi' },
  { id: 'luffy_c',   name: 'Luffy',    anime: 'One Piece',             rarity: Rarity.Common, stats: S(32, 24, 10, 5, 51), hp: 120, element: Element.Light,  attackName: 'Gomu Gomu no Pistol' },
  { id: 'zoro_c',    name: 'Zoro',     anime: 'One Piece',             rarity: Rarity.Common, stats: S(35, 23, 10, 5, 56), hp: 110, element: Element.Wind,   attackName: 'Corte Oni Giri' },

  // --- RARO ---
  { id: 'gojo_r',     name: 'Gojo',           anime: 'Jujutsu Kaisen',        rarity: Rarity.Rare, stats: S(45, 38, 48, 10, 75), hp: 150, element: Element.Light, attackName: 'Golpe Directo',    magicName: 'Destello de Luz' },
  { id: 'rudeus_r',   name: 'Rudeus',         anime: 'Mushoku Tensei',        rarity: Rarity.Rare, stats: S(40, 35, 50, 10, 72), hp: 140, element: Element.Water, attackName: 'Golpe de Bastón',  magicName: 'Proyectil de Agua' },
  { id: 'jotaro_r',   name: 'Jotaro',         anime: 'JoJo Bizarre Adventure', rarity: Rarity.Rare, stats: S(50, 40, 40, 10, 78), hp: 160, element: Element.Light, attackName: 'Golpe de Stand',   magicName: 'Aura de Luz Estelar' },
  { id: 'dio_r',      name: 'Dio',            anime: 'JoJo Bizarre Adventure', rarity: Rarity.Rare, stats: S(48, 39, 42, 10, 74), hp: 155, element: Element.Shadow, attackName: 'Corte de Cuchillo', magicName: 'Drenaje Vampírico' },
  { id: 'itadori_r',  name: 'Itadori',        anime: 'Jujutsu Kaisen',        rarity: Rarity.Rare, stats: S(50, 37, 40, 10, 73), hp: 150, element: Element.Fire,   attackName: 'Puño Divergente',  magicName: 'Chispa de Fuego Interno' },
  { id: 'eren_t_r',   name: 'Eren (Titan)',   anime: 'Attack on Titan',       rarity: Rarity.Rare, stats: S(52, 40, 35, 10, 65), hp: 160, element: Element.Earth,  attackName: 'Golpe de Titán',   magicName: 'Fuerza de la Tierra' },
  { id: 'gon_r',      name: 'Gon',            anime: 'Hunter x Hunter',       rarity: Rarity.Rare, stats: S(49, 36, 41, 10, 70), hp: 145, element: Element.Fire,   attackName: 'Puñetazo Fuerte',  magicName: 'Jajanken: Papel' },
  { id: 'killua_r',   name: 'Killua',         anime: 'Hunter x Hunter',       rarity: Rarity.Rare, stats: S(47, 35, 45, 10, 80), hp: 140, element: Element.Wind,   attackName: 'Garras de Asesino', magicName: 'Palma de Trueno' },

  // --- EPICO ---
  { id: 'joseph_e',  name: 'Joseph Joestar', anime: 'JoJo Bizarre Adventure', rarity: Rarity.Epic, stats: S(65, 50, 55, 15, 90), hp: 185, element: Element.Light, attackName: 'Golpe Hermano',     magicName: 'Hamon Solar' },
  { id: 'orsted_e',  name: 'Orsted',         anime: 'Mushoku Tensei',        rarity: Rarity.Epic, stats: S(68, 52, 70, 15, 85), hp: 195, element: Element.Water, attackName: 'Espada de Dragón',  magicName: 'Ráfaga de Maná' },
  { id: 'sukuna_e',  name: 'Sukuna',         anime: 'Jujutsu Kaisen',        rarity: Rarity.Epic, stats: S(70, 50, 68, 15, 100), hp: 200, element: Element.Shadow, attackName: 'Corte Maldito',     magicName: 'Llama Maldita' },
  { id: 'madara_e',  name: 'Madara',         anime: 'Naruto',                rarity: Rarity.Epic, stats: S(66, 52, 65, 15, 88), hp: 190, element: Element.Shadow, attackName: 'Gunbai Strike',     magicName: 'Bola de Fuego' },
  { id: 'kaido_e',   name: 'Kaido',          anime: 'One Piece',             rarity: Rarity.Epic, stats: S(70, 55, 40, 15, 86), hp: 200, element: Element.Fire,   attackName: 'Golpe de Kanabo',   magicName: 'Aliento de Fuego' },

  // --- LEGENDARIO ---
  { id: 'giorno_l',      name: 'Giorno Giovanna', anime: 'JoJo Bizarre Adventure', rarity: Rarity.Legendary, stats: S(85, 68, 88, 20, 115), hp: 245, element: Element.Light, attackName: 'Golpe de Gold Experience', magicName: 'Vida Solar' },
  { id: 'rudeus_god_l',  name: 'Rudeus (God)',    anime: 'Mushoku Tensei',        rarity: Rarity.Legendary, stats: S(82, 70, 90, 20, 105), hp: 255, element: Element.Water, attackName: 'Bastónrugiente',            magicName: 'Acumular Maná' },
  { id: 'gojo_awak_l',   name: 'Gojo (Awakened)', anime: 'Jujutsu Kaisen',        rarity: Rarity.Legendary, stats: S(88, 72, 90, 20, 125), hp: 240, element: Element.Light, attackName: 'Golpe Infinito',            magicName: 'Azul (Ao)' },
];

export function getCardsByRarity(rarity: Rarity): Card[] {
  return cards.filter((c) => c.rarity === rarity);
}

export function getCardById(id: string): Card | undefined {
  return cards.find((c) => c.id === id);
}

export const RARITY_ORDER: Record<Rarity, number> = {
  COMUN: 0, RARO: 1, EPICO: 2, LEGENDARIO: 3,
};
