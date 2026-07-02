import { cards, getElementMultiplier, type Card, type Element, type Rarity } from '../data/cards.js';

const RARITY_ORDER: Record<Rarity, number> = {
  COMUN: 0, RARO: 1, EPICO: 2, LEGENDARIO: 3,
};

const REWARD_COINS = [30, 60, 100, 200];

export type ActionType = 'ATTACK' | 'MAGIC' | 'DEFEND' | 'SKILL';

export interface Skill {
  id: string;
  name: string;
  type: ActionType;
  power: number;
  description: string;
}

export interface BattleCard {
  cardId: string;
  name: string;
  rarity: Rarity;
  element: Element;
  stats: { attack: number; defense: number; magic: number; luck: number };
  currentHp: number;
  maxHp: number;
  isDefending: boolean;
  skills: Skill[];
}

export interface BattleAction {
  cardId: string;
  action: ActionType;
  targetId: string;
  skillId?: string;
}

export interface BattleResult {
  turn: number;
  actions: { cardId: string; targetId: string; damage: number; critical: boolean; action: ActionType; message: string }[];
  playerCards: BattleCard[];
  enemyCards: BattleCard[];
  winner: 'player' | 'enemy' | null;
  coinsEarned: number;
}

function generateSkills(element: Element, rarity: Rarity): Skill[] {
  const rarityLevel = RARITY_ORDER[rarity];
  const skills: Skill[] = [
    { id: `atk_${element}`, name: 'Ataque', type: 'ATTACK', power: 80, description: 'Ataque físico' },
  ];

  if (rarityLevel >= 1) {
    skills.push({
      id: `mag_${element}`, name: 'Magia', type: 'MAGIC', power: 75,
      description: 'Ataque mágico',
    });
  }
  if (rarityLevel >= 2) {
    skills.push({
      id: `skill_${element}`, name: `${element} Strike`, type: 'SKILL', power: 120,
      description: `Golpe elemental ${element}`,
    });
  }
  if (rarityLevel >= 3) {
    skills.push({
      id: `ult_${element}`, name: 'Ultimate', type: 'SKILL', power: 180,
      description: 'Poder definitivo',
    });
  }

  return skills;
}

function calcDamage(atk: number, power: number, def: number, elementMult: number, luck: number): { damage: number; critical: boolean } {
  const base = Math.max(1, (atk * power / 100) - (def * 0.3));
  const crit = Math.random() * 100 < luck;
  const critMult = crit ? 1.5 : 1;
  return { damage: Math.round(base * elementMult * critMult), critical: crit };
}

export function createBattleCard(card: Card): BattleCard {
    const skills = generateSkills(card.element, card.rarity);
  return {
    cardId: card.id,
    name: card.name,
    rarity: card.rarity,
    element: card.element,
    stats: { ...card.stats },
    currentHp: card.hp,
    maxHp: card.hp,
    isDefending: false,
    skills,
  };
}

function clampHp(card: BattleCard) {
  card.currentHp = Math.max(0, Math.min(card.currentHp, card.maxHp));
}

export function generateEnemyTeam(winStreak: number): BattleCard[] {
  const maxRarityIndex = Math.min(Math.floor(winStreak / 3), RARITY_ORDER.LEGENDARIO);
  const pool = cards.filter((c) => RARITY_ORDER[c.rarity] <= maxRarityIndex);

  const selected: Card[] = [];
  const used = new Set<string>();

  while (selected.length < 3 && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    const card = pool[idx];
    if (!used.has(card.id)) {
      used.add(card.id);
      selected.push(card);
    }
  }

  while (selected.length < 3) {
    const fallbacks = cards.filter((c) => !used.has(c.id));
    if (fallbacks.length === 0) break;
    const idx = Math.floor(Math.random() * fallbacks.length);
    used.add(fallbacks[idx].id);
    selected.push(fallbacks[idx]);
  }

  return selected.map(createBattleCard);
}

export function processTurn(
  playerCards: BattleCard[],
  enemyCards: BattleCard[],
  playerActions: BattleAction[],
  turn: number,
): BattleResult {
  const logs: BattleResult['actions'] = [];

  playerCards.forEach((c) => { c.isDefending = false; });
  enemyCards.forEach((c) => { c.isDefending = false; });

  const allActions: { card: BattleCard; target: BattleCard; action: BattleAction; isEnemy: boolean }[] = [];

  for (const pa of playerActions) {
    const card = playerCards.find((c) => c.cardId === pa.cardId);
    const target = enemyCards.find((c) => c.cardId === pa.targetId);
    if (!card || !target || card.currentHp <= 0 || target.currentHp <= 0) continue;

    if (pa.action === 'DEFEND') {
      card.isDefending = true;
      logs.push({ cardId: card.cardId, targetId: card.cardId, damage: 0, critical: false, action: 'DEFEND', message: `${card.name} se defiende` });
      continue;
    }

    allActions.push({ card, target, action: pa, isEnemy: false });
  }

  const aliveEnemies = enemyCards.filter((c) => c.currentHp > 0);
  const alivePlayers = playerCards.filter((c) => c.currentHp > 0);

  for (const ec of aliveEnemies) {
    const target = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
    if (!target) continue;

    const roll = Math.random();
    let chosenAction: ActionType;
    let chosenSkill: Skill | undefined;

    if (roll < 0.6) {
      chosenAction = 'ATTACK';
    } else if (roll < 0.9 && ec.skills.length > 2) {
      chosenAction = 'SKILL';
      chosenSkill = ec.skills[Math.floor(Math.random() * (ec.skills.length - 1)) + 1];
    } else {
      chosenAction = 'DEFEND';
    }

    if (chosenAction === 'DEFEND') {
      ec.isDefending = true;
      logs.push({ cardId: ec.cardId, targetId: ec.cardId, damage: 0, critical: false, action: 'DEFEND', message: `${ec.name} se defiende` });
      continue;
    }

    const skill = chosenSkill ?? ec.skills[0];
    const elementMult = skill.type === 'SKILL' ? getElementMultiplier(ec.element, target.element) : 1;
    const atkStat = skill.type === 'MAGIC' ? ec.stats.magic : ec.stats.attack;
    const defMult = target.isDefending ? 0.5 : 1;
    const { damage, critical } = calcDamage(atkStat, skill.power, target.stats.defense * defMult, elementMult, ec.stats.luck);

    target.currentHp -= damage;
    clampHp(target);

    logs.push({
      cardId: ec.cardId,
      targetId: target.cardId,
      damage,
      critical,
      action: skill.type,
      message: `${ec.name} usa ${skill.name} → ${target.name}: -${damage}${critical ? ' ¡CRÍTICO!' : ''}`,
    });
  }

  for (const { card, target, action } of allActions) {
    if (card.currentHp <= 0) continue;

    const skill = action.skillId ? card.skills.find((s) => s.id === action.skillId) : card.skills[0];
    if (!skill) continue;

    const elementMult = skill.type === 'SKILL' ? getElementMultiplier(card.element, target.element) : 1;
    const atkStat = skill.type === 'MAGIC' ? card.stats.magic : card.stats.attack;
    const defMult = target.isDefending ? 0.5 : 1;
    const { damage, critical } = calcDamage(atkStat, skill.power, target.stats.defense * defMult, elementMult, card.stats.luck);

    target.currentHp -= damage;
    clampHp(target);

    logs.push({
      cardId: card.cardId,
      targetId: target.cardId,
      damage,
      critical,
      action: skill.type,
      message: `${card.name} usa ${skill.name} → ${target.name}: -${damage}${critical ? ' ¡CRÍTICO!' : ''}`,
    });
  }

  const playerAlive = playerCards.some((c) => c.currentHp > 0);
  const enemyAlive = enemyCards.some((c) => c.currentHp > 0);

  let winner: 'player' | 'enemy' | null = null;
  let coinsEarned = 0;

  if (!playerAlive) {
    winner = 'enemy';
  } else if (!enemyAlive) {
    winner = 'player';
    const maxRarity = Math.max(...playerCards.filter((c) => c.currentHp > 0).map((c) => RARITY_ORDER[c.rarity]));
    coinsEarned = REWARD_COINS[maxRarity] ?? 50;
  }

  if (winner) {
    playerCards.forEach((c) => clampHp(c));
    enemyCards.forEach((c) => clampHp(c));
  }

  return { turn, actions: logs, playerCards, enemyCards, winner, coinsEarned };
}
