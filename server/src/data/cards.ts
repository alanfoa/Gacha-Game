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
  maxMana: number;
  element: Element;
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
  // ═══ COMUNES ═══ (solo ataque físico, mana 50)
  // c01
  { id: 'c01', name: 'Sakura', anime: 'Naruto', rarity: Rarity.Common, stats: S(20, 22, 15, 10, 40), hp: 105, maxMana: 50, element: Element.Earth, attackName: 'Impacto de Cerezo', attackCost: 0, attackCooldown: 0 },
  // c02
  { id: 'c02', name: 'Iruka', anime: 'Naruto', rarity: Rarity.Common, stats: S(22, 24, 12, 10, 38), hp: 110, maxMana: 50, element: Element.Wind, attackName: 'Lanzamiento de Shuriken', attackCost: 0, attackCooldown: 0 },
  // c03
  { id: 'c03', name: 'Coby', anime: 'One Piece', rarity: Rarity.Common, stats: S(18, 20, 14, 12, 42), hp: 100, maxMana: 50, element: Element.Light, attackName: 'Smasher de la Marina', attackCost: 0, attackCooldown: 0 },
  // c04
  { id: 'c04', name: 'Usopp', anime: 'One Piece', rarity: Rarity.Common, stats: S(25, 18, 10, 15, 38), hp: 100, maxMana: 50, element: Element.Wind, attackName: 'Kayaku Hoshi', attackCost: 0, attackCooldown: 0 },
  // c05
  { id: 'c05', name: 'Genya', anime: 'Demon Slayer', rarity: Rarity.Common, stats: S(28, 22, 8, 8, 35), hp: 115, maxMana: 50, element: Element.Earth, attackName: 'Disparo de Escopeta Nichirin', attackCost: 0, attackCooldown: 0 },
  // c06
  { id: 'c06', name: 'Murata', anime: 'Demon Slayer', rarity: Rarity.Common, stats: S(20, 24, 12, 10, 36), hp: 108, maxMana: 50, element: Element.Water, attackName: 'Estilo de Agua Básica', attackCost: 0, attackCooldown: 0 },
  // c07
  { id: 'c07', name: 'Armin', anime: 'Attack on Titan', rarity: Rarity.Common, stats: S(16, 20, 22, 10, 34), hp: 100, maxMana: 50, element: Element.Fire, attackName: 'Tajo de Presión', attackCost: 0, attackCooldown: 0 },
  // c08
  { id: 'c08', name: 'Connie', anime: 'Attack on Titan', rarity: Rarity.Common, stats: S(22, 20, 10, 8, 40), hp: 110, maxMana: 50, element: Element.Wind, attackName: 'Maniobra Rápida', attackCost: 0, attackCooldown: 0 },
  // c09
  { id: 'c09', name: 'Leorio', anime: 'Hunter x Hunter', rarity: Rarity.Common, stats: S(24, 18, 10, 12, 38), hp: 112, maxMana: 50, element: Element.Light, attackName: 'Golpe de Maletín', attackCost: 0, attackCooldown: 0 },
  // c10
  { id: 'c10', name: 'Kuwabara', anime: 'Yu Yu Hakusho', rarity: Rarity.Common, stats: S(30, 22, 8, 6, 36), hp: 120, maxMana: 50, element: Element.Shadow, attackName: 'Espada de Aura Astral', attackCost: 0, attackCooldown: 0 },
  // c11
  { id: 'c11', name: 'Matsuda', anime: 'Death Note', rarity: Rarity.Common, stats: S(20, 18, 10, 10, 35), hp: 100, maxMana: 50, element: Element.Light, attackName: 'Disparo de Retención', attackCost: 0, attackCooldown: 0 },
  // c12
  { id: 'c12', name: 'Pieck', anime: 'Attack on Titan', rarity: Rarity.Common, stats: S(22, 24, 12, 10, 32), hp: 118, maxMana: 50, element: Element.Earth, attackName: 'Carga de Suministros', attackCost: 0, attackCooldown: 0 },
  // c13
  { id: 'c13', name: 'Mineta', anime: 'My Hero Academia', rarity: Rarity.Common, stats: S(18, 16, 10, 14, 44), hp: 95, maxMana: 50, element: Element.Wind, attackName: 'Esferas Pegajosas Pop Off', attackCost: 0, attackCooldown: 0 },
  // c14
  { id: 'c14', name: 'Hide', anime: 'Tokyo Ghoul', rarity: Rarity.Common, stats: S(16, 18, 12, 12, 38), hp: 100, maxMana: 50, element: Element.Light, attackName: 'Aliento de Ánimo Físico', attackCost: 0, attackCooldown: 0 },

  // ═══ RAROS ═══ (ataque + magia, mana 70)
  // r01
  { id: 'r01', name: 'Nezuko', anime: 'Demon Slayer', rarity: Rarity.Rare, stats: S(38, 35, 32, 12, 58), hp: 145, maxMana: 70, element: Element.Fire, attackName: 'Garra Demoniaca', attackCost: 0, attackCooldown: 0, magicName: 'Exploding Blood', magicCost: 20, magicCooldown: 2 },
  // r02
  { id: 'r02', name: 'Zenitsu', anime: 'Demon Slayer', rarity: Rarity.Rare, stats: S(42, 28, 30, 10, 72), hp: 135, maxMana: 70, element: Element.Wind, attackName: 'Tajo del Relámpago', attackCost: 0, attackCooldown: 0, magicName: 'Destello del Relámpago', magicCost: 18, magicCooldown: 1 },
  // r03
  { id: 'r03', name: 'Inosuke', anime: 'Demon Slayer', rarity: Rarity.Rare, stats: S(44, 36, 18, 8, 55), hp: 155, maxMana: 70, element: Element.Earth, attackName: 'Colmillo Perforador', attackCost: 0, attackCooldown: 0, magicName: 'Cincel Loco', magicCost: 16, magicCooldown: 2 },
  // r04
  { id: 'r04', name: 'Mikasa', anime: 'Attack on Titan', rarity: Rarity.Rare, stats: S(46, 34, 22, 12, 68), hp: 142, maxMana: 70, element: Element.Wind, attackName: 'Tajo de Alta Velocidad', attackCost: 0, attackCooldown: 0, magicName: 'Lanza Relámpago', magicCost: 22, magicCooldown: 2 },
  // r05
  { id: 'r05', name: 'Gon', anime: 'Hunter x Hunter', rarity: Rarity.Rare, stats: S(44, 32, 24, 14, 62), hp: 148, maxMana: 70, element: Element.Fire, attackName: 'Puñetazo Fuerte', attackCost: 0, attackCooldown: 0, magicName: 'Jajanken: Papel', magicCost: 20, magicCooldown: 2 },
  // r06
  { id: 'r06', name: 'Yukari Takeba', anime: 'Persona 3', rarity: Rarity.Rare, stats: S(30, 28, 48, 14, 60), hp: 138, maxMana: 70, element: Element.Wind, attackName: 'Flecha de Viento', attackCost: 0, attackCooldown: 0, magicName: 'Garu Estelar', magicCost: 24, magicCooldown: 1 },
  // r07
  { id: 'r07', name: 'Junpei Iori', anime: 'Persona 3', rarity: Rarity.Rare, stats: S(42, 34, 26, 10, 55), hp: 152, maxMana: 70, element: Element.Fire, attackName: 'Tajo de Bate', attackCost: 0, attackCooldown: 0, magicName: 'Agi Ígneo', magicCost: 20, magicCooldown: 2 },
  // r08
  { id: 'r08', name: 'Yosuke Hanamura', anime: 'Persona 4', rarity: Rarity.Rare, stats: S(38, 30, 34, 12, 65), hp: 140, maxMana: 70, element: Element.Wind, attackName: 'Doble Daga', attackCost: 0, attackCooldown: 0, magicName: 'Garula Elástico', magicCost: 22, magicCooldown: 2 },
  // r09
  { id: 'r09', name: 'Chie Satonaka', anime: 'Persona 4', rarity: Rarity.Rare, stats: S(40, 36, 22, 12, 58), hp: 150, maxMana: 70, element: Element.Water, attackName: 'Patada Alta', attackCost: 0, attackCooldown: 0, magicName: 'Bufu de Hielo', magicCost: 18, magicCooldown: 1 },
  // r10
  { id: 'r10', name: 'Ryuji Sakamoto', anime: 'Persona 5', rarity: Rarity.Rare, stats: S(46, 34, 20, 10, 52), hp: 158, maxMana: 70, element: Element.Earth, attackName: 'Golpe de Tubo', attackCost: 0, attackCooldown: 0, magicName: 'Zio Eléctrico', magicCost: 20, magicCooldown: 2 },
  // r11
  { id: 'r11', name: 'Ann Takamaki', anime: 'Persona 5', rarity: Rarity.Rare, stats: S(34, 28, 44, 14, 62), hp: 136, maxMana: 70, element: Element.Fire, attackName: 'Latigazo', attackCost: 0, attackCooldown: 0, magicName: 'Agilao de Fuego', magicCost: 24, magicCooldown: 1 },
  // r12
  { id: 'r12', name: 'Misa Amane', anime: 'Death Note', rarity: Rarity.Rare, stats: S(24, 22, 38, 18, 58), hp: 130, maxMana: 70, element: Element.Shadow, attackName: 'Devoción de Shinigami', attackCost: 0, attackCooldown: 0, magicName: 'Ojos de Shinigami', magicCost: 25, magicCooldown: 3 },
  // r13
  { id: 'r13', name: 'Kana Arima', anime: 'Oshi no Ko', rarity: Rarity.Rare, stats: S(28, 24, 40, 16, 60), hp: 132, maxMana: 70, element: Element.Light, attackName: 'Pataleta de Actriz', attackCost: 0, attackCooldown: 0, magicName: 'Brillo de Lamer Enchufes', magicCost: 22, magicCooldown: 2 },
  // r14
  { id: 'r14', name: 'Mem-cho', anime: 'Oshi no Ko', rarity: Rarity.Rare, stats: S(26, 22, 36, 18, 62), hp: 130, maxMana: 70, element: Element.Light, attackName: 'Ataque de Streamer', attackCost: 0, attackCooldown: 0, magicName: 'Hype de Redes', magicCost: 20, magicCooldown: 2 },
  // r15
  { id: 'r15', name: 'Lucy Heartfilia', anime: 'Fairy Tail', rarity: Rarity.Rare, stats: S(28, 26, 42, 16, 54), hp: 135, maxMana: 70, element: Element.Water, attackName: 'Patada de Lucy', attackCost: 0, attackCooldown: 0, magicName: 'Invocación de Aquario', magicCost: 24, magicCooldown: 2 },
  // r16
  { id: 'r16', name: 'Gray Fullbuster', anime: 'Fairy Tail', rarity: Rarity.Rare, stats: S(40, 32, 36, 10, 58), hp: 146, maxMana: 70, element: Element.Water, attackName: 'Espada de Hielo', attackCost: 0, attackCooldown: 0, magicName: 'Ice-Make: Cañón', magicCost: 22, magicCooldown: 1 },
  // r17
  { id: 'r17', name: 'Uraraka', anime: 'My Hero Academia', rarity: Rarity.Rare, stats: S(32, 28, 30, 16, 60), hp: 138, maxMana: 70, element: Element.Wind, attackName: 'Golpe de Escombros', attackCost: 0, attackCooldown: 0, magicName: 'Gravedad Zero', magicCost: 20, magicCooldown: 2 },
  // r18
  { id: 'r18', name: 'Iida', anime: 'My Hero Academia', rarity: Rarity.Rare, stats: S(38, 34, 18, 10, 72), hp: 148, maxMana: 70, element: Element.Wind, attackName: 'Patada Recipro', attackCost: 0, attackCooldown: 0, magicName: 'Turbo Motor', magicCost: 18, magicCooldown: 1 },
  // r19
  { id: 'r19', name: 'Touka Kirishima', anime: 'Tokyo Ghoul', rarity: Rarity.Rare, stats: S(44, 30, 28, 12, 62), hp: 144, maxMana: 70, element: Element.Shadow, attackName: 'Zarpazo de Kagune', attackCost: 0, attackCooldown: 0, magicName: 'Cristal de Ukaku', magicCost: 22, magicCooldown: 2 },

  // ═══ ÉPICOS ═══ (ataque + magia + strike, mana 100)
  // e01
  { id: 'e01', name: 'Tanjiro', anime: 'Demon Slayer', rarity: Rarity.Epic, stats: S(55, 45, 42, 18, 68), hp: 190, maxMana: 100, element: Element.Fire, attackName: 'Tajo de la Superficie', attackCost: 0, attackCooldown: 0, magicName: 'Vals de Fuego', magicCost: 22, magicCooldown: 1, skillName: 'Dragón del Cambio', skillCost: 35, skillCooldown: 3 },
  // e02
  { id: 'e02', name: 'Naruto (Base)', anime: 'Naruto', rarity: Rarity.Epic, stats: S(52, 42, 50, 16, 65), hp: 195, maxMana: 100, element: Element.Light, attackName: 'Combo de Naruto', attackCost: 0, attackCooldown: 0, magicName: 'Rasengan', magicCost: 24, magicCooldown: 1, skillName: 'Odama Rasengan', skillCost: 38, skillCooldown: 3 },
  // e03
  { id: 'e03', name: 'Luffy (Base)', anime: 'One Piece', rarity: Rarity.Epic, stats: S(58, 44, 30, 18, 70), hp: 200, maxMana: 100, element: Element.Light, attackName: 'Gomu Gomu no Pistol', attackCost: 0, attackCooldown: 0, magicName: 'Red Hawk', magicCost: 24, magicCooldown: 2, skillName: 'Elephant Gun', skillCost: 36, skillCooldown: 3 },
  // e04
  { id: 'e04', name: 'Eren (Titán)', anime: 'Attack on Titan', rarity: Rarity.Epic, stats: S(62, 52, 22, 10, 58), hp: 210, maxMana: 100, element: Element.Earth, attackName: 'Golpe de Titán', attackCost: 0, attackCooldown: 0, magicName: 'Endurecimiento', magicCost: 20, magicCooldown: 2, skillName: 'Rugido de Ataque', skillCost: 34, skillCooldown: 3 },
  // e05
  { id: 'e05', name: 'Joseph Joestar', anime: "JoJo's", rarity: Rarity.Epic, stats: S(48, 40, 48, 24, 72), hp: 185, maxMana: 100, element: Element.Light, attackName: 'Golpe con Hilos', attackCost: 0, attackCooldown: 0, magicName: 'Hamon Overdrive', magicCost: 22, magicCooldown: 1, skillName: 'Elástico de Hamon', skillCost: 32, skillCooldown: 2 },
  // e06
  { id: 'e06', name: 'Gojo (Base)', anime: 'Jujutsu Kaisen', rarity: Rarity.Epic, stats: S(50, 48, 62, 20, 85), hp: 185, maxMana: 100, element: Element.Light, attackName: 'Golpe Directo', attackCost: 0, attackCooldown: 0, magicName: 'Azul (Ao)', magicCost: 26, magicCooldown: 1, skillName: 'Rojo (Aka)', skillCost: 40, skillCooldown: 3 },
  // e07
  { id: 'e07', name: 'Sukuna (Base)', anime: 'Jujutsu Kaisen', rarity: Rarity.Epic, stats: S(58, 46, 58, 18, 90), hp: 200, maxMana: 100, element: Element.Shadow, attackName: 'Desmantelar', attackCost: 0, attackCooldown: 0, magicName: 'Flecha de Fuego', magicCost: 28, magicCooldown: 2, skillName: 'Partir', skillCost: 42, skillCooldown: 3 },
  // e08
  { id: 'e08', name: 'Rudeus Greyrat', anime: 'Mushoku Tensei', rarity: Rarity.Epic, stats: S(40, 38, 68, 16, 62), hp: 185, maxMana: 100, element: Element.Water, attackName: 'Golpe de Bastón', attackCost: 0, attackCooldown: 0, magicName: 'Stone Cannon', magicCost: 28, magicCooldown: 1, skillName: 'Perturbación de Magia', skillCost: 40, skillCooldown: 3 },
  // e09
  { id: 'e09', name: 'Itadori', anime: 'Jujutsu Kaisen', rarity: Rarity.Epic, stats: S(56, 44, 38, 16, 68), hp: 192, maxMana: 100, element: Element.Fire, attackName: 'Puño Divergente', attackCost: 0, attackCooldown: 0, magicName: 'Destello Negro', magicCost: 22, magicCooldown: 1, skillName: 'Impacto de Alma', skillCost: 36, skillCooldown: 3 },
  // e10
  { id: 'e10', name: 'Killua', anime: 'Hunter x Hunter', rarity: Rarity.Epic, stats: S(50, 38, 44, 18, 88), hp: 182, maxMana: 100, element: Element.Wind, attackName: 'Garras de Asesino', attackCost: 0, attackCooldown: 0, magicName: 'Palma de Trueno', magicCost: 24, magicCooldown: 1, skillName: 'Godspeed', skillCost: 38, skillCooldown: 3 },
  // e11
  { id: 'e11', name: 'Sasuke (Base)', anime: 'Naruto', rarity: Rarity.Epic, stats: S(54, 42, 54, 16, 78), hp: 188, maxMana: 100, element: Element.Shadow, attackName: 'Tajo Kusanagi', attackCost: 0, attackCooldown: 0, magicName: 'Chidori', magicCost: 26, magicCooldown: 1, skillName: 'Kirin', skillCost: 44, skillCooldown: 3 },
  // e12
  { id: 'e12', name: 'Makoto Yuki (Joker P3)', anime: 'Persona 3', rarity: Rarity.Epic, stats: S(48, 42, 58, 18, 70), hp: 190, maxMana: 100, element: Element.Light, attackName: 'Corte de Espada', attackCost: 0, attackCooldown: 0, magicName: 'Agidyne', magicCost: 26, magicCooldown: 1, skillName: 'Cadenza de Orpheus', skillCost: 36, skillCooldown: 3 },
  // e13
  { id: 'e13', name: 'Yu Narukami', anime: 'Persona 4', rarity: Rarity.Epic, stats: S(50, 40, 56, 18, 72), hp: 188, maxMana: 100, element: Element.Wind, attackName: 'Tajo de Katana', attackCost: 0, attackCooldown: 0, magicName: 'Ziodyne', magicCost: 26, magicCooldown: 1, skillName: 'Myriad Truths', skillCost: 38, skillCooldown: 3 },
  // e14
  { id: 'e14', name: 'Ren Amamiya (Joker P5)', anime: 'Persona 5', rarity: Rarity.Epic, stats: S(46, 38, 60, 20, 74), hp: 185, maxMana: 100, element: Element.Shadow, attackName: 'Tiro de Pistola', attackCost: 0, attackCooldown: 0, magicName: 'Eigaon', magicCost: 28, magicCooldown: 1, skillName: 'Balas de Alta', skillCost: 40, skillCooldown: 3 },
  // e15
  { id: 'e15', name: 'Light Yagami', anime: 'Death Note', rarity: Rarity.Epic, stats: S(30, 28, 62, 28, 68), hp: 175, maxMana: 100, element: Element.Shadow, attackName: 'Estratagema Genial', attackCost: 0, attackCooldown: 0, magicName: 'Sentencia del Cuaderno', magicCost: 30, magicCooldown: 2, skillName: 'Dios del Nuevo Mundo', skillCost: 44, skillCooldown: 4 },
  // e16
  { id: 'e16', name: 'L Lawliet', anime: 'Death Note', rarity: Rarity.Epic, stats: S(28, 30, 58, 30, 72), hp: 175, maxMana: 100, element: Element.Light, attackName: 'Deducción Analítica', attackCost: 0, attackCooldown: 0, magicName: 'Trampa de Captura', magicCost: 26, magicCooldown: 2, skillName: 'Jaque Mate de Justicia', skillCost: 42, skillCooldown: 4 },
  // e17
  { id: 'e17', name: 'Aqua Hoshino', anime: 'Oshi no Ko', rarity: Rarity.Epic, stats: S(42, 36, 52, 22, 70), hp: 180, maxMana: 100, element: Element.Shadow, attackName: 'Mirada Fría', attackCost: 0, attackCooldown: 0, magicName: 'Ojos de Estrella Oscura', magicCost: 24, magicCooldown: 2, skillName: 'Venganza Calculada', skillCost: 40, skillCooldown: 3 },
  // e18
  { id: 'e18', name: 'Ruby Hoshino', anime: 'Oshi no Ko', rarity: Rarity.Epic, stats: S(38, 34, 54, 24, 66), hp: 178, maxMana: 100, element: Element.Light, attackName: 'Baile Escénico', attackCost: 0, attackCooldown: 0, magicName: 'Carisma de Idol', magicCost: 22, magicCooldown: 2, skillName: 'Renacimiento de Sarina', skillCost: 38, skillCooldown: 3 },
  // e19
  { id: 'e19', name: 'Natsu Dragneel', anime: 'Fairy Tail', rarity: Rarity.Epic, stats: S(60, 44, 44, 14, 74), hp: 200, maxMana: 100, element: Element.Fire, attackName: 'Puño de Hierro de Dragón de Fuego', attackCost: 0, attackCooldown: 0, magicName: 'Rugido del Dragón de Fuego', magicCost: 26, magicCooldown: 1, skillName: 'Loto Carmesí: Puño del Dragón de Fuego', skillCost: 40, skillCooldown: 3 },
  // e20
  { id: 'e20', name: 'Izuku Midoriya (Deku)', anime: 'My Hero Academia', rarity: Rarity.Epic, stats: S(56, 42, 28, 18, 76), hp: 192, maxMana: 100, element: Element.Light, attackName: 'Delaware Smash', attackCost: 0, attackCooldown: 0, magicName: 'Detroit Smash', magicCost: 24, magicCooldown: 2, skillName: 'One For All 20%', skillCost: 36, skillCooldown: 3 },
  // e21
  { id: 'e21', name: 'Ken Kaneki', anime: 'Tokyo Ghoul', rarity: Rarity.Epic, stats: S(54, 40, 46, 16, 70), hp: 195, maxMana: 100, element: Element.Shadow, attackName: 'Azote de Rize', attackCost: 0, attackCooldown: 0, magicName: 'Ciempiés de Kakuja', magicCost: 26, magicCooldown: 2, skillName: '¿Cuánto es 1000 menos 7?', skillCost: 42, skillCooldown: 3 },

  // ═══ LEGENDARIOS ═══ (ataque + magia + strike + ultimate, mana 130, power ~360-380 total stats)
  // l01
  { id: 'l01', name: 'Gojo (Awakened)', anime: 'Jujutsu Kaisen', rarity: Rarity.Legendary, stats: S(78, 68, 92, 22, 130), hp: 245, maxMana: 130, element: Element.Light,
    attackName: 'Destello Negro Crítico', attackCost: 0, attackCooldown: 0,
    magicName: 'Azul Máximo', magicCost: 25, magicCooldown: 1,
    skillName: 'Rojo Invertido', skillCost: 38, skillCooldown: 3,
    ultimateName: 'Vacío Inconmensurable', ultimateCost: 65, ultimateCooldown: 5 },
  // l02
  { id: 'l02', name: 'Sukuna (Rey Maldiciones)', anime: 'Jujutsu Kaisen', rarity: Rarity.Legendary, stats: S(84, 66, 88, 20, 135), hp: 250, maxMana: 130, element: Element.Shadow,
    attackName: 'Desmantelar Continuo', attackCost: 0, attackCooldown: 0,
    magicName: 'Fuga Absoluta', magicCost: 28, magicCooldown: 2,
    skillName: 'Corte que Divide el Mundo', skillCost: 42, skillCooldown: 3,
    ultimateName: 'Reliquia Malévola', ultimateCost: 70, ultimateCooldown: 5 },
  // l03
  { id: 'l03', name: 'Rudeus Greyrat (Dios Magia)', anime: 'Mushoku Tensei', rarity: Rarity.Legendary, stats: S(68, 60, 100, 20, 100), hp: 248, maxMana: 130, element: Element.Water,
    attackName: 'Armadura Mágica MK-I', attackCost: 0, attackCooldown: 0,
    magicName: 'Cañón de Piedra Nuclear', magicCost: 28, magicCooldown: 1,
    skillName: 'Hidro-Bomba Cataclísmica', skillCost: 44, skillCooldown: 3,
    ultimateName: 'Cumulonimbus Absoluto', ultimateCost: 72, ultimateCooldown: 5 },
  // l04
  { id: 'l04', name: 'Naruto (Sabio 6 Caminos)', anime: 'Naruto', rarity: Rarity.Legendary, stats: S(82, 72, 78, 22, 120), hp: 255, maxMana: 130, element: Element.Light,
    attackName: 'Rasen Shuriken de Lava', attackCost: 0, attackCooldown: 0,
    magicName: 'Rasengan Magnético', magicCost: 26, magicCooldown: 1,
    skillName: 'Toldo de Bestias con Cola', skillCost: 40, skillCooldown: 3,
    ultimateName: 'Flecha de Indra y Rasengan Final', ultimateCost: 68, ultimateCooldown: 5 },
  // l05
  { id: 'l05', name: 'Luffy (Gear 5)', anime: 'One Piece', rarity: Rarity.Legendary, stats: S(86, 70, 60, 24, 128), hp: 260, maxMana: 130, element: Element.Light,
    attackName: 'Gomu Gomu no Gigant', attackCost: 0, attackCooldown: 0,
    magicName: 'Gomu Gomu no Lightning', magicCost: 26, magicCooldown: 2,
    skillName: 'Gomu Gomu no Bajrang Gun', skillCost: 42, skillCooldown: 3,
    ultimateName: 'Amanecer Blanco de la Libertad', ultimateCost: 70, ultimateCooldown: 5 },
  // l06
  { id: 'l06', name: 'Sasuke (Rinnegan Supremo)', anime: 'Naruto', rarity: Rarity.Legendary, stats: S(80, 66, 88, 20, 125), hp: 248, maxMana: 130, element: Element.Shadow,
    attackName: 'Chidori Kagutsuchi', attackCost: 0, attackCooldown: 0,
    magicName: 'Amaterasu', magicCost: 30, magicCooldown: 2,
    skillName: 'Susanoo Perfecto: Flecha de Indra', skillCost: 44, skillCooldown: 3,
    ultimateName: 'Chibaku Tensei Celestial', ultimateCost: 72, ultimateCooldown: 6 },
  // l07
  { id: 'l07', name: 'Tanjiro (Marca Cazador)', anime: 'Demon Slayer', rarity: Rarity.Legendary, stats: S(82, 68, 70, 22, 115), hp: 250, maxMana: 130, element: Element.Fire,
    attackName: 'Danza del Dios del Fuego', attackCost: 0, attackCooldown: 0,
    magicName: 'Sol Poniente', magicCost: 24, magicCooldown: 1,
    skillName: 'Decimotercera Postura', skillCost: 40, skillCooldown: 3,
    ultimateName: 'Mundo Transparente: Tajo de la Cabeza del Dragón', ultimateCost: 68, ultimateCooldown: 5 },
  // l08
  { id: 'l08', name: 'Eren (Titán)', anime: 'Attack on Titan', rarity: Rarity.Legendary, stats: S(90, 80, 50, 16, 90), hp: 275, maxMana: 130, element: Element.Earth,
    attackName: 'Pisotón del Retumbar', attackCost: 0, attackCooldown: 0,
    magicName: 'Control de Titanes Puros', magicCost: 28, magicCooldown: 2,
    skillName: 'Endurecimiento de Cristal Divino', skillCost: 38, skillCooldown: 3,
    ultimateName: 'El Retumbar de la Tierra Absoluto', ultimateCost: 70, ultimateCooldown: 5 },
  // l09
  { id: 'l09', name: 'Joseph Joestar (Maestro)', anime: "JoJo's", rarity: Rarity.Legendary, stats: S(72, 64, 80, 30, 110), hp: 240, maxMana: 130, element: Element.Light,
    attackName: 'Clacker Volley Imbuido', attackCost: 0, attackCooldown: 0,
    magicName: 'Hamon Overdrive Máximo', magicCost: 24, magicCooldown: 1,
    skillName: 'Red de Hilos Solar', skillCost: 36, skillCooldown: 2,
    ultimateName: '¡Tu Siguiente Línea Es...!', ultimateCost: 60, ultimateCooldown: 5 },
  // l10
  { id: 'l10', name: 'Itadori (Despertado)', anime: 'Jujutsu Kaisen', rarity: Rarity.Legendary, stats: S(84, 68, 66, 20, 118), hp: 252, maxMana: 130, element: Element.Fire,
    attackName: 'Combo de Destellos Negros', attackCost: 0, attackCooldown: 0,
    magicName: 'Santuario Efímero', magicCost: 24, magicCooldown: 1,
    skillName: 'Impacto Punzante de Alma', skillCost: 40, skillCooldown: 3,
    ultimateName: 'Corte de Almas Separadas', ultimateCost: 68, ultimateCooldown: 5 },
  // l11
  { id: 'l11', name: 'Killua (Velocidad de Dios)', anime: 'Hunter x Hunter', rarity: Rarity.Legendary, stats: S(76, 60, 72, 22, 140), hp: 238, maxMana: 130, element: Element.Wind,
    attackName: 'Torbellino Eléctrico', attackCost: 0, attackCooldown: 0,
    magicName: 'Descarga Eléctrica Narukami', magicCost: 26, magicCooldown: 1,
    skillName: 'Godspeed: Velocidad Lumínica', skillCost: 40, skillCooldown: 3,
    ultimateName: 'Perforación de Corazón Silenciosa', ultimateCost: 66, ultimateCooldown: 5 },
  // l12
  { id: 'l12', name: 'Makoto Yuki (Mesías P3)', anime: 'Persona 3', rarity: Rarity.Legendary, stats: S(76, 68, 90, 22, 108), hp: 248, maxMana: 130, element: Element.Light,
    attackName: 'Tajo del Fin del Mundo', attackCost: 0, attackCooldown: 0,
    magicName: 'Megidolaon Cósmico', magicCost: 30, magicCooldown: 2,
    skillName: 'Gran Sello (Great Seal)', skillCost: 44, skillCooldown: 3,
    ultimateName: 'Armagedón de Tánatos y Orpheus', ultimateCost: 74, ultimateCooldown: 6 },
  // l13
  { id: 'l13', name: 'Yu Narukami (Izanagi)', anime: 'Persona 4', rarity: Rarity.Legendary, stats: S(74, 64, 92, 22, 112), hp: 245, maxMana: 130, element: Element.Light,
    attackName: 'Tajo de Espada de la Verdad', attackCost: 0, attackCooldown: 0,
    magicName: 'Ziodyne Absoluto', magicCost: 28, magicCooldown: 1,
    skillName: 'Espada de Justicia de Kaguya', skillCost: 42, skillCooldown: 3,
    ultimateName: 'Myriad Truths Divino', ultimateCost: 70, ultimateCooldown: 5 },
  // l14
  { id: 'l14', name: 'Ren Amamiya (Satanael P5)', anime: 'Persona 5', rarity: Rarity.Legendary, stats: S(72, 62, 96, 24, 115), hp: 242, maxMana: 130, element: Element.Shadow,
    attackName: 'Disparo de Alta Traición', attackCost: 0, attackCooldown: 0,
    magicName: 'Maeigaon Cósmico', magicCost: 30, magicCooldown: 2,
    skillName: 'Balas de la Rebelión Final', skillCost: 44, skillCooldown: 3,
    ultimateName: 'Pecado Fatal (Sinful Shell)', ultimateCost: 72, ultimateCooldown: 5 },
  // l15
  { id: 'l15', name: 'Light Yagami (Kira)', anime: 'Death Note', rarity: Rarity.Legendary, stats: S(56, 50, 98, 34, 105), hp: 235, maxMana: 130, element: Element.Shadow,
    attackName: 'Juicio Ejecutivo', attackCost: 0, attackCooldown: 0,
    magicName: 'Manipulación Total de Eventos', magicCost: 32, magicCooldown: 2,
    skillName: 'Sonrisa del Triunfo de Kira', skillCost: 46, skillCooldown: 4,
    ultimateName: 'Sentencia Final del Death Note', ultimateCost: 76, ultimateCooldown: 6 },
  // l16
  { id: 'l16', name: 'L Lawliet (Estratega)', anime: 'Death Note', rarity: Rarity.Legendary, stats: S(52, 52, 94, 36, 110), hp: 235, maxMana: 130, element: Element.Light,
    attackName: 'Análisis Forense Definitivo', attackCost: 0, attackCooldown: 0,
    magicName: 'Operación de Captura Internacional', magicCost: 30, magicCooldown: 2,
    skillName: 'Red de Espionaje Mundial', skillCost: 44, skillCooldown: 4,
    ultimateName: 'Jaque Mate de la Justicia Absoluta', ultimateCost: 74, ultimateCooldown: 6 },
  // l17
  { id: 'l17', name: 'Aqua Hoshino (Método Oscuro)', anime: 'Oshi no Ko', rarity: Rarity.Legendary, stats: S(70, 60, 82, 28, 112), hp: 240, maxMana: 130, element: Element.Shadow,
    attackName: 'Interpretación de Venganza', attackCost: 0, attackCooldown: 0,
    magicName: 'Ojos de Estrella de Doble Filo', magicCost: 26, magicCooldown: 2,
    skillName: 'Manipulación Mediática', skillCost: 40, skillCooldown: 3,
    ultimateName: 'Destrucción Psicológica', ultimateCost: 68, ultimateCooldown: 5 },
  // l18
  { id: 'l18', name: 'Ruby Hoshino (Nueva Era)', anime: 'Oshi no Ko', rarity: Rarity.Legendary, stats: S(64, 56, 88, 30, 108), hp: 238, maxMana: 130, element: Element.Light,
    attackName: 'Baile de Escenario Perfecto', attackCost: 0, attackCooldown: 0,
    magicName: 'Brillo de Estrella Celestial', magicCost: 24, magicCooldown: 2,
    skillName: 'Concierto del Domo de Tokio', skillCost: 38, skillCooldown: 3,
    ultimateName: 'Renacimiento de la Luz de Ai', ultimateCost: 66, ultimateCooldown: 5 },
  // l19
  { id: 'l19', name: 'Natsu Dragón de Fuego', anime: 'Fairy Tail', rarity: Rarity.Legendary, stats: S(88, 66, 74, 18, 120), hp: 260, maxMana: 130, element: Element.Fire,
    attackName: 'Espada del Fénix de Fuego', attackCost: 0, attackCooldown: 0,
    magicName: 'Rugido del Dios Dragón de Fuego', magicCost: 28, magicCooldown: 1,
    skillName: 'Loto Carmesí: Cuchilla de Llamas Explosivas', skillCost: 42, skillCooldown: 3,
    ultimateName: 'Puño de Destrucción del Rey Dragón de Fuego', ultimateCost: 72, ultimateCooldown: 5 },
  // l20
  { id: 'l20', name: 'Izuku Midoriya (100% Full Cowl)', anime: 'My Hero Academia', rarity: Rarity.Legendary, stats: S(86, 68, 56, 22, 130), hp: 252, maxMana: 130, element: Element.Light,
    attackName: 'Texas Smash Definitivo', attackCost: 0, attackCooldown: 0,
    magicName: 'Fa Jin + Quinto Látigo', magicCost: 26, magicCooldown: 2,
    skillName: 'United States of World Smash', skillCost: 42, skillCooldown: 3,
    ultimateName: 'One For All 100%: Shoot Style Overdrive', ultimateCost: 70, ultimateCooldown: 5 },
  // l21
  { id: 'l21', name: 'Ken Kaneki (Kakuja Dragón)', anime: 'Tokyo Ghoul', rarity: Rarity.Legendary, stats: S(82, 64, 76, 20, 112), hp: 255, maxMana: 130, element: Element.Shadow,
    attackName: 'Azote de Tentáculos de Ciempiés', attackCost: 0, attackCooldown: 0,
    magicName: 'Devoración de Células RC', magicCost: 28, magicCooldown: 2,
    skillName: 'Ruina de la CCG', skillCost: 44, skillCooldown: 3,
    ultimateName: 'El Despertar del Dragón: ¿Cuánto es 1000 menos 7?', ultimateCost: 74, ultimateCooldown: 6 },
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
