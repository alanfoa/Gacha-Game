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

function getStrikeEffect(cardId: string): SkillEffect | undefined {
  switch (cardId) {
    case 'joseph_e': return { type: 'IGNORE_DEF', value: 20 };
    case 'orsted_e': return { type: 'MAG_DOWN', value: 30, duration: 1 };
    case 'sukuna_e': return { type: 'BLEED', value: 15, duration: 2 };
    case 'madara_e': return { type: 'CRIT_BONUS', value: 15 };
    case 'kaido_e':  return { type: 'STUN', chance: 20 };
    case 'giorno_l': return { type: 'HEAL_ALLY', value: 40 };
    case 'rudeus_god_l': return { type: 'DEF_DOWN', value: 40, duration: 2 };
    case 'gojo_awak_l': return { type: 'SPD_DOWN', value: 30, duration: 2 };
    default: return undefined;
  }
}

function getUltimateEffect(cardId: string): SkillEffect | undefined {
  switch (cardId) {
    case 'giorno_l':    return { type: 'SPD_DOWN', value: 100, duration: 1 };
    case 'rudeus_god_l': return { type: 'FREEZE' };
    case 'gojo_awak_l':  return { type: 'IGNORE_ALL_DEF' };
    default: return undefined;
  }
}

function getStrikeName(cardId: string): string {
  switch (cardId) {
    case 'joseph_e': return 'Hamon Overdrive';
    case 'orsted_e': return 'Perturbación de Magia';
    case 'sukuna_e': return 'Dismantle';
    case 'madara_e': return 'Katon: Gōka Mekkyaku';
    case 'kaido_e':  return 'Raimei Hakke';
    case 'giorno_l': return 'Gold Experience';
    case 'rudeus_god_l': return 'Stone Cannon Máximo';
    case 'gojo_awak_l': return 'Rojo (Aka)';
    default: return `${cards.find((c) => c.id === cardId)?.element ?? ''} Strike`;
  }
}

function getUltimateName(cardId: string): string {
  switch (cardId) {
    case 'giorno_l':    return 'Gold Experience Requiem';
    case 'rudeus_god_l': return 'Cumulonimbus Absoluto';
    case 'gojo_awak_l':  return 'Púrpura (Murasaki)';
    default: return 'Ultimate';
  }
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
    const strikeEffect = getStrikeEffect(card.id);
    const strikeName = getStrikeName(card.id);
    skills.push({
      id: `skill_${card.id}`, name: strikeName, type: 'SKILL', power: 120,
      description: `Golpe elemental ${card.element}`,
      effect: strikeEffect,
    });
  }
  if (rarityLevel >= 3) {
    const ultEffect = getUltimateEffect(card.id);
    const ultName = getUltimateName(card.id);
    skills.push({
      id: `ult_${card.id}`, name: ultName, type: 'SKILL', power: 180,
      description: 'Poder definitivo',
      effect: ultEffect,
    });
  }

  return skills;
}

function calcDamageNew(atk: number, power: number, def: number, elementMult: number, luck: number): { damage: number; critical: boolean } {
  const base = (atk * power / 100) * (100 / (100 + def));
  const crit = Math.random() * 100 < luck;
  const critMult = crit ? 1.5 : 1;
  return { damage: Math.max(1, Math.round(base * elementMult * critMult)), critical: crit };
}

function generateEnemyActions(
  enemies: BattleCard[],
  players: BattleCard[],
): { cardId: string; action: ActionType; targetId: string; skillId?: string }[] {
  const actions: { cardId: string; action: ActionType; targetId: string; skillId?: string }[] = [];
  const alivePlayers = players.filter((c) => c.currentHp > 0);

  for (const ec of enemies) {
    if (ec.currentHp <= 0 || ec.skipNextTurn) continue;

    const target = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
    if (!target) continue;

    const roll = Math.random();
    if (roll < 0.6) {
      actions.push({ cardId: ec.cardId, action: 'ATTACK', targetId: target.cardId });
    } else if (roll < 0.9 && ec.skills.length > 2) {
      const skill = ec.skills[Math.floor(Math.random() * (ec.skills.length - 1)) + 1];
      actions.push({ cardId: ec.cardId, action: 'SKILL', targetId: target.cardId, skillId: skill.id });
    } else {
      actions.push({ cardId: ec.cardId, action: 'DEFEND', targetId: ec.cardId });
    }
  }

  return actions;
}

function applyDamageToCard(
  target: BattleCard,
  skill: Skill,
  elementMult: number,
  isDefending: boolean,
  luck: number,
  atkStat: number,
): { damage: number; critical: boolean } {
  const effectiveDef = target.statusEffects.some((e) => e.type === 'DEF_DOWN')
    ? target.stats.defense * (1 - (target.statusEffects.find((e) => e.type === 'DEF_DOWN')!.value / 100))
    : target.stats.defense;
  const defMult = isDefending ? 0.5 : 1;
  const { damage, critical } = calcDamageNew(atkStat, skill.power, effectiveDef * defMult, elementMult, luck);

  target.currentHp -= damage;
  clampHp(target);

  return { damage, critical };
}

function applySkillEffect(
  attacker: BattleCard,
  target: BattleCard,
  skill: Skill,
  logs: BattleLogAction[],
) {
  if (!skill.effect || skill.effect.type === 'NONE') return;

  const { effect } = skill;
  const roll = Math.random();
  const chance = effect.chance ?? 100;

  if (roll * 100 >= chance) return;

  switch (effect.type) {
    case 'BLEED': {
      const bleedDmg = Math.round((effect.value ?? 15) / 100 * attacker.stats.attack);
      target.statusEffects.push({
        type: 'BLEED',
        remainingTurns: effect.duration ?? 2,
        value: bleedDmg,
        sourceName: attacker.name,
      });
      logs.push({
        cardId: attacker.cardId, targetId: target.cardId,
        damage: 0, critical: false, action: 'SKILL',
        message: `${target.name} sangra (${effect.duration ?? 2} turnos)`,
      });
      break;
    }
    case 'DEF_DOWN': {
      target.statusEffects.push({
        type: 'DEF_DOWN',
        remainingTurns: effect.duration ?? 2,
        value: effect.value ?? 40,
        sourceName: attacker.name,
      });
      logs.push({
        cardId: attacker.cardId, targetId: target.cardId,
        damage: 0, critical: false, action: 'SKILL',
        message: `DEF de ${target.name} baja ${effect.value ?? 40}% (${effect.duration ?? 2} turnos)`,
      });
      break;
    }
    case 'SPD_DOWN': {
      const spdReduce = effect.value ?? 30;
      target.statusEffects.push({
        type: 'SPD_DOWN',
        remainingTurns: effect.duration ?? 2,
        value: spdReduce,
        sourceName: attacker.name,
      });
      logs.push({
        cardId: attacker.cardId, targetId: target.cardId,
        damage: 0, critical: false, action: 'SKILL',
        message: `VEL de ${target.name} baja ${spdReduce}% (${effect.duration ?? 2} turnos)`,
      });
      break;
    }
    case 'MAG_DOWN': {
      target.statusEffects.push({
        type: 'MAG_DOWN',
        remainingTurns: effect.duration ?? 2,
        value: effect.value ?? 30,
        sourceName: attacker.name,
      });
      logs.push({
        cardId: attacker.cardId, targetId: target.cardId,
        damage: 0, critical: false, action: 'SKILL',
        message: `MAG de ${target.name} baja ${effect.value ?? 30}% (${effect.duration ?? 2} turnos)`,
      });
      break;
    }
    case 'STUN': {
      target.statusEffects.push({
        type: 'STUN',
        remainingTurns: 1,
        value: 0,
        sourceName: attacker.name,
      });
      target.skipNextTurn = true;
      logs.push({
        cardId: attacker.cardId, targetId: target.cardId,
        damage: 0, critical: false, action: 'SKILL',
        message: `${target.name} aturdido!`,
      });
      break;
    }
    case 'FREEZE': {
      target.skipNextTurn = true;
      logs.push({
        cardId: attacker.cardId, targetId: target.cardId,
        damage: 0, critical: false, action: 'SKILL',
        message: `${target.name} congelado!`,
      });
      break;
    }
    case 'HEAL_ALLY': {
      // Handled at the call site (requires knowing the ally)
      break;
    }
    case 'CRIT_BONUS': {
      // Handled at the call site (modifies luck stat)
      break;
    }
  }
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

  // Step 1: Process status effects (bleed, expire)
  for (const card of [...playerCards, ...enemyCards]) {
    if (card.currentHp <= 0) continue;

    const bleed = card.statusEffects.find((e) => e.type === 'BLEED');
    if (bleed) {
      const bleedDmg = Math.max(1, Math.round(bleed.value));
      card.currentHp -= bleedDmg;
      clampHp(card);
      logs.push({
        cardId: card.cardId, targetId: card.cardId,
        damage: bleedDmg, critical: false, action: 'SKILL',
        message: `${card.name} recibe ${bleedDmg} de sangrado`,
      });
    }

    card.statusEffects = card.statusEffects
      .map((e) => ({ ...e, remainingTurns: e.remainingTurns - 1 }))
      .filter((e) => e.remainingTurns > 0);
  }

  // Step 2: Reset flags
  playerCards.forEach((c) => { c.isDefending = false; });
  enemyCards.forEach((c) => { c.isDefending = false; });

  // Step 3: Generate enemy actions
  const enemyActions = generateEnemyActions(enemyCards, playerCards);

  // Step 4: Build combined pool of all actions
  interface PendingAction {
    card: BattleCard;
    actionType: ActionType;
    target: BattleCard;
    skillId?: string;
  }

  const pool: PendingAction[] = [];

  for (const pa of playerActions) {
    const card = playerCards.find((c) => c.cardId === pa.cardId);
    if (!card || card.currentHp <= 0 || card.skipNextTurn) continue;

    if (pa.action === 'DEFEND') {
      card.isDefending = true;
      logs.push({
        cardId: card.cardId, targetId: card.cardId,
        damage: 0, critical: false, action: 'DEFEND',
        message: `${card.name} se defiende`,
      });
      continue;
    }

    const target = pa.targetId
      ? [...enemyCards, ...playerCards].find((c) => c.cardId === pa.targetId)
      : undefined;
    if (!target || target.currentHp <= 0) continue;

    pool.push({ card, actionType: pa.action, target, skillId: pa.skillId });
  }

  for (const ea of enemyActions) {
    const card = enemyCards.find((c) => c.cardId === ea.cardId);
    if (!card || card.currentHp <= 0 || card.skipNextTurn) continue;

    if (ea.action === 'DEFEND') {
      card.isDefending = true;
      logs.push({
        cardId: card.cardId, targetId: card.cardId,
        damage: 0, critical: false, action: 'DEFEND',
        message: `${card.name} se defiende`,
      });
      continue;
    }

    const target = playerCards.find((c) => c.cardId === ea.targetId);
    if (!target || target.currentHp <= 0) continue;

    pool.push({ card, actionType: ea.action, target, skillId: ea.skillId });
  }

  // Log skipped turns
  for (const card of [...playerCards, ...enemyCards]) {
    if (card.skipNextTurn) {
      card.skipNextTurn = false;
      if (card.currentHp > 0) {
        logs.push({
          cardId: card.cardId, targetId: card.cardId,
          damage: 0, critical: false, action: 'DEFEND',
          message: `${card.name} no puede moverse`,
        });
      }
    }
  }

  // Step 5: Sort by speed descending (accounting for SPD_DOWN)
  pool.sort((a, b) => {
    const getSpeed = (card: BattleCard) => {
      const spdDebuff = card.statusEffects.find((e) => e.type === 'SPD_DOWN');
      return spdDebuff ? Math.round(card.stats.speed * (1 - spdDebuff.value / 100)) : card.stats.speed;
    };
    return getSpeed(b.card) - getSpeed(a.card);
  });

  // Step 6: Process actions in speed order
  for (const pending of pool) {
    if (pending.card.currentHp <= 0 || pending.target.currentHp <= 0) continue;

    const skill = pending.skillId
      ? pending.card.skills.find((s) => s.id === pending.skillId)
      : pending.card.skills[0];
    if (!skill) continue;

    // HEAL_ALLY: heal lowest HP ally
    if (skill.effect?.type === 'HEAL_ALLY') {
      const allies = playerCards.includes(pending.card) ? playerCards : enemyCards;
      const healTarget = allies
        .filter((c) => c.currentHp > 0)
        .sort((a, b) => a.currentHp / a.maxHp - b.currentHp / b.maxHp)[0];

      if (healTarget) {
        const elementMult = skill.type === 'SKILL' ? getElementMultiplier(pending.card.element, pending.target.element) : 1;
        const atkStat = skill.type === 'MAGIC' ? pending.card.stats.magic : pending.card.stats.attack;
        const { damage } = applyDamageToCard(pending.target, skill, elementMult, pending.target.isDefending, pending.card.stats.luck, atkStat);
        const healAmt = Math.round(damage * 0.4);
        healTarget.currentHp = Math.min(healTarget.currentHp + healAmt, healTarget.maxHp);
        logs.push({
          cardId: pending.card.cardId, targetId: pending.target.cardId,
          damage, critical: false, action: 'SKILL',
          message: `${pending.card.name} usa ${skill.name} → ${pending.target.name}: -${damage}, ${healTarget.name} recupera ${healAmt}`,
        });
        applySkillEffect(pending.card, pending.target, skill, logs);
      }
      continue;
    }

    // CRIT_BONUS: extra crit chance
    let effectiveLuck = pending.card.stats.luck;
    if (skill.effect?.type === 'CRIT_BONUS') {
      effectiveLuck += skill.effect.value ?? 15;
    }

    // IGNORE_DEF: skip portion of DEF
    if (skill.effect?.type === 'IGNORE_DEF') {
      const elementMult = skill.type === 'SKILL' ? getElementMultiplier(pending.card.element, pending.target.element) : 1;
      const atkStat = skill.type === 'MAGIC' ? pending.card.stats.magic : pending.card.stats.attack;
      const reducedDef = pending.target.stats.defense * (1 - (skill.effect.value ?? 20) / 100);
      const originalDef = pending.target.stats.defense;
      pending.target.stats.defense = reducedDef;
      const { damage, critical } = applyDamageToCard(pending.target, skill, elementMult, pending.target.isDefending, effectiveLuck, atkStat);
      pending.target.stats.defense = originalDef;
      logs.push({
        cardId: pending.card.cardId, targetId: pending.target.cardId,
        damage, critical, action: skill.type,
        message: `${pending.card.name} usa ${skill.name} → ${pending.target.name}: -${damage}${critical ? ' ¡CRÍTICO!' : ''}`,
      });
      applySkillEffect(pending.card, pending.target, skill, logs);
      continue;
    }

    // IGNORE_ALL_DEF: ignore 100% DEF
    if (skill.effect?.type === 'IGNORE_ALL_DEF') {
      const elementMult = skill.type === 'SKILL' ? getElementMultiplier(pending.card.element, pending.target.element) : 1;
      const atkStat = skill.type === 'MAGIC' ? pending.card.stats.magic : pending.card.stats.attack;
      const originalDef = pending.target.stats.defense;
      pending.target.stats.defense = 0;
      const { damage, critical } = applyDamageToCard(pending.target, skill, elementMult, false, effectiveLuck, atkStat);
      pending.target.stats.defense = originalDef;
      logs.push({
        cardId: pending.card.cardId, targetId: pending.target.cardId,
        damage, critical, action: skill.type,
        message: `${pending.card.name} usa ${skill.name} → ${pending.target.name}: -${damage}${critical ? ' ¡CRÍTICO!' : ''}`,
      });
      applySkillEffect(pending.card, pending.target, skill, logs);
      continue;
    }

    // Normal attack
    const elementMult = skill.type === 'SKILL' ? getElementMultiplier(pending.card.element, pending.target.element) : 1;
    const atkStat = skill.type === 'MAGIC' ? pending.card.stats.magic : pending.card.stats.attack;
    const { damage, critical } = applyDamageToCard(pending.target, skill, elementMult, pending.target.isDefending, effectiveLuck, atkStat);
    logs.push({
      cardId: pending.card.cardId, targetId: pending.target.cardId,
      damage, critical, action: skill.type,
      message: `${pending.card.name} usa ${skill.name} → ${pending.target.name}: -${damage}${critical ? ' ¡CRÍTICO!' : ''}`,
    });
    applySkillEffect(pending.card, pending.target, skill, logs);
  }

  // Step 7: Check winner
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
