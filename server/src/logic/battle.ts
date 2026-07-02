import { cards, getElementMultiplier, RARITY_ORDER, type Card, type Element, type Rarity } from '../data/cards.js';

const REWARD_COINS = [30, 60, 100, 200];

export type ActionType = 'ATTACK' | 'MAGIC' | 'DEFEND' | 'SKILL';

export type StatusEffectType =
  | 'BLEED'
  | 'STUN'
  | 'DEF_DOWN'
  | 'SPD_DOWN'
  | 'MAG_DOWN'
  | 'FROZEN'
  | 'CRIT_UP';

export interface StatusEffect {
  type: StatusEffectType;
  remainingTurns: number;
  value: number;
  sourceName: string;
}

export interface SkillEffect {
  type: 'NONE' | 'IGNORE_DEF' | 'MAG_DOWN' | 'BLEED' | 'CRIT_BONUS' | 'STUN' | 'HEAL_ALLY' | 'SPD_DOWN' | 'DEF_DOWN' | 'FREEZE' | 'IGNORE_ALL_DEF';
  value?: number;
  duration?: number;
  chance?: number;
}

export interface Skill {
  id: string;
  name: string;
  type: ActionType;
  power: number;
  description: string;
  effect?: SkillEffect;
}

export interface BattleCard {
  cardId: string;
  name: string;
  rarity: Rarity;
  element: Element;
  stats: { attack: number; defense: number; magic: number; luck: number; speed: number };
  currentHp: number;
  maxHp: number;
  isDefending: boolean;
  skills: Skill[];
  statusEffects: StatusEffect[];
  skipNextTurn: boolean;
}

export interface BattleAction {
  cardId: string;
  action: ActionType;
  targetId: string;
  skillId?: string;
}

export interface BattleLogAction {
  cardId: string;
  targetId: string;
  damage: number;
  critical: boolean;
  action: ActionType;
  message: string;
}

export interface BattleResult {
  turn: number;
  actions: BattleLogAction[];
  playerCards: BattleCard[];
  enemyCards: BattleCard[];
  winner: 'player' | 'enemy' | null;
  coinsEarned: number;
}

function generateSkills(card: Card): Skill[] {
  const rarityLevel = RARITY_ORDER[card.rarity];
  const skills: Skill[] = [
    { id: `atk_${card.id}`, name: card.attackName, type: 'ATTACK', power: 80, description: 'Ataque físico' },
  ];

  if (rarityLevel >= 1 && card.magicName) {
    skills.push({
      id: `mag_${card.id}`, name: card.magicName, type: 'MAGIC', power: 75,
      description: 'Ataque mágico',
    });
  }
  if (rarityLevel >= 2) {
    skills.push({
      id: `skill_${card.id}`, name: `${card.element} Strike`, type: 'SKILL', power: 120,
      description: `Golpe elemental ${card.element}`,
    });
  }
  if (rarityLevel >= 3) {
    skills.push({
      id: `ult_${card.id}`, name: 'Ultimate', type: 'SKILL', power: 180,
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
  const skills = generateSkills(card);
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
    statusEffects: [],
    skipNextTurn: false,
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
  const logs: BattleLogAction[] = [];

  // Step 1: Process status effects (expire, bleed damage)
  for (const card of [...playerCards, ...enemyCards]) {
    if (card.currentHp <= 0) continue;

    // Bleed damage
    const bleed = card.statusEffects.find((e) => e.type === 'BLEED');
    if (bleed) {
      const bleedDmg = Math.max(1, Math.round(bleed.value));
      card.currentHp -= bleedDmg;
      clampHp(card);
      logs.push({
        cardId: card.cardId,
        targetId: card.cardId,
        damage: bleedDmg,
        critical: false,
        action: 'SKILL',
        message: `${card.name} recibe ${bleedDmg} de sangrado`,
      });
    }

    // Decrease durations and remove expired
    card.statusEffects = card.statusEffects
      .map((e) => ({ ...e, remainingTurns: e.remainingTurns - 1 }))
      .filter((e) => e.remainingTurns > 0);
  }

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
