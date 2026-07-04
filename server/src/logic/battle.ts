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
  cost: number;
  cooldown: number;
  currentCooldown: number;
  description: string;
  effect?: SkillEffect;
}

export interface BattleCard {
  uid: string;
  cardId: string;
  name: string;
  rarity: Rarity;
  element: Element;
  stats: { attack: number; defense: number; magic: number; luck: number; speed: number };
  currentHp: number;
  maxHp: number;
  currentMana: number;
  maxMana: number;
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
  cardUid: string;
  targetId: string;
  targetUid: string;
  damage: number;
  critical: boolean;
  action: ActionType;
  skillId?: string;
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

function getSkillEffect(cardId: string, skillType: 'strike' | 'ultimate'): SkillEffect | undefined {
  const effects: Record<string, { strike?: SkillEffect; ultimate?: SkillEffect }> = {
    'e05': { strike: { type: 'IGNORE_DEF', value: 20 } },
    'e08': { strike: { type: 'MAG_DOWN', value: 30, duration: 1 } },
    'e07': { strike: { type: 'BLEED', value: 15, duration: 2 } },
    'e15': { strike: { type: 'IGNORE_DEF', value: 30 } },
    'e21': { strike: { type: 'STUN', chance: 15 } },
    'e19': { strike: { type: 'DEF_DOWN', value: 20, duration: 2 } },
    'e17': { strike: { type: 'IGNORE_DEF', value: 50 } },
    'e18': { strike: { type: 'HEAL_ALLY', value: 30 } },
    'l01': { ultimate: { type: 'IGNORE_ALL_DEF' } },
    'l02': { strike: { type: 'BLEED', value: 25, duration: 2 }, ultimate: { type: 'IGNORE_ALL_DEF' } },
    'l03': { ultimate: { type: 'FREEZE' } },
    'l05': { strike: { type: 'STUN', chance: 30 } },
    'l07': { strike: { type: 'IGNORE_DEF', value: 40 }, ultimate: { type: 'IGNORE_ALL_DEF' } },
    'l08': { ultimate: { type: 'STUN', chance: 50 } },
    'l09': { ultimate: { type: 'SPD_DOWN', value: 50, duration: 1 } },
    'l11': { strike: { type: 'SPD_DOWN', value: 40, duration: 2 } },
    'l12': { ultimate: { type: 'STUN', chance: 100 } },
    'l13': { strike: { type: 'HEAL_ALLY', value: 35 } },
    'l15': { ultimate: { type: 'SPD_DOWN', value: 100, duration: 1 } },
    'l16': { ultimate: { type: 'STUN', chance: 60 } },
    'l18': { ultimate: { type: 'HEAL_ALLY', value: 100 } },
    'l19': { strike: { type: 'DEF_DOWN', value: 30, duration: 2 } },
    'l20': { strike: { type: 'IGNORE_DEF', value: 50 }, ultimate: { type: 'IGNORE_ALL_DEF' } },
    'l21': { ultimate: { type: 'STUN', chance: 80 } },
  };
  const entry = effects[cardId];
  if (!entry) return undefined;
  return skillType === 'strike' ? entry.strike : entry.ultimate;
}

function generateSkills(card: Card): Skill[] {
  const skills: Skill[] = [
    { id: `atk_${card.id}`, name: card.attackName, type: 'ATTACK', power: 80, cost: card.attackCost, cooldown: card.attackCooldown, currentCooldown: 0, description: 'Ataque físico' },
  ];

  if (card.magicName) {
    skills.push({
      id: `mag_${card.id}`, name: card.magicName, type: 'MAGIC', power: 75,
      cost: card.magicCost ?? 20, cooldown: card.magicCooldown ?? 1, currentCooldown: 0,
      description: 'Ataque mágico',
    });
  }
  if (card.skillName) {
    const strikeEffect = getSkillEffect(card.id, 'strike');
    skills.push({
      id: `skill_${card.id}`, name: card.skillName, type: 'SKILL', power: 120,
      cost: card.skillCost ?? 35, cooldown: card.skillCooldown ?? 2, currentCooldown: 0,
      description: `Golpe ${card.element}`, effect: strikeEffect,
    });
  }
  if (card.ultimateName) {
    const ultEffect = getSkillEffect(card.id, 'ultimate');
    skills.push({
      id: `ult_${card.id}`, name: card.ultimateName, type: 'SKILL', power: 180,
      cost: card.ultimateCost ?? 65, cooldown: card.ultimateCooldown ?? 4, currentCooldown: 0,
      description: 'Poder definitivo', effect: ultEffect,
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
      logs.push(logEntry(attacker, target, 'SKILL', 0, false, `${target.name} sangra (${effect.duration ?? 2} turnos)`));
      break;
    }
    case 'DEF_DOWN': {
      target.statusEffects.push({
        type: 'DEF_DOWN',
        remainingTurns: effect.duration ?? 2,
        value: effect.value ?? 40,
        sourceName: attacker.name,
      });
      logs.push(logEntry(attacker, target, 'SKILL', 0, false, `DEF de ${target.name} baja ${effect.value ?? 40}% (${effect.duration ?? 2} turnos)`));
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
      logs.push(logEntry(attacker, target, 'SKILL', 0, false, `VEL de ${target.name} baja ${spdReduce}% (${effect.duration ?? 2} turnos)`));
      break;
    }
    case 'MAG_DOWN': {
      target.statusEffects.push({
        type: 'MAG_DOWN',
        remainingTurns: effect.duration ?? 2,
        value: effect.value ?? 30,
        sourceName: attacker.name,
      });
      logs.push(logEntry(attacker, target, 'SKILL', 0, false, `MAG de ${target.name} baja ${effect.value ?? 30}% (${effect.duration ?? 2} turnos)`));
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
      logs.push(logEntry(attacker, target, 'SKILL', 0, false, `${target.name} aturdido!`));
      break;
    }
    case 'FREEZE': {
      target.skipNextTurn = true;
      logs.push(logEntry(attacker, target, 'SKILL', 0, false, `${target.name} congelado!`));
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

function logEntry(
  card: BattleCard,
  target: BattleCard | null,
  action: ActionType,
  damage: number,
  critical: boolean,
  message: string,
  skillId?: string,
): BattleLogAction {
  return {
    cardId: card.cardId,
    cardUid: card.uid,
    targetId: target?.cardId ?? card.cardId,
    targetUid: target?.uid ?? card.uid,
    damage,
    critical,
    action,
    skillId,
    message,
  };
}

export function createBattleCard(card: Card): BattleCard {
  const skills = generateSkills(card);
  return {
    uid: `${card.id}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    cardId: card.id,
    name: card.name,
    rarity: card.rarity,
    element: card.element,
    stats: { ...card.stats },
    currentHp: card.hp,
    maxHp: card.hp,
    currentMana: card.maxMana,
    maxMana: card.maxMana,
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

  // Step 1: Regen mana + reduce cooldowns + process status effects
  for (const card of [...playerCards, ...enemyCards]) {
    if (card.currentHp <= 0) continue;

    // Regen 20% maxMana per turn
    card.currentMana = Math.min(card.maxMana, card.currentMana + Math.round(card.maxMana * 0.2));

    // Reduce cooldowns
    card.skills.forEach((s) => { s.currentCooldown = Math.max(0, s.currentCooldown - 1); });

    // Status effects
    const bleed = card.statusEffects.find((e) => e.type === 'BLEED');
    if (bleed) {
      const bleedDmg = Math.max(1, Math.round(bleed.value));
      card.currentHp -= bleedDmg;
      clampHp(card);
      logs.push(logEntry(card, card, 'SKILL', bleedDmg, false, `${card.name} recibe ${bleedDmg} de sangrado`));
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

  // Step 4: Build combined pool of all actions (check mana + cooldown)
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
      pool.push({ card, actionType: 'DEFEND', target: card });
      continue;
    }

    const target = pa.targetId
      ? [...enemyCards, ...playerCards].find((c) => c.cardId === pa.targetId)
      : undefined;
    if (!target || target.currentHp <= 0) continue;

    const skill = pa.skillId
      ? card.skills.find((s) => s.id === pa.skillId)
      : card.skills[0];
    if (!skill) continue;

    // Check mana
    if (card.currentMana < skill.cost) {
      logs.push(logEntry(card, card, 'ATTACK', 0, false, `${card.name} no tiene maná para ${skill.name} (${card.currentMana}/${skill.cost}) — ataca básico`));
      pool.push({ card, actionType: 'ATTACK', target, skillId: card.skills[0].id });
      continue;
    }
    // Check cooldown
    if (skill.currentCooldown > 0) {
      logs.push(logEntry(card, card, 'ATTACK', 0, false, `${skill.name} de ${card.name} en cooldown (${skill.currentCooldown}t) — ataca básico`));
      pool.push({ card, actionType: 'ATTACK', target, skillId: card.skills[0].id });
      continue;
    }

    // Deduct mana
    card.currentMana -= skill.cost;
    // Set cooldown
    skill.currentCooldown = skill.cooldown;

    pool.push({ card, actionType: pa.action, target, skillId: pa.skillId });
  }

  for (const ea of enemyActions) {
    const card = enemyCards.find((c) => c.cardId === ea.cardId);
    if (!card || card.currentHp <= 0 || card.skipNextTurn) continue;

    if (ea.action === 'DEFEND') {
      pool.push({ card, actionType: 'DEFEND', target: card });
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
        logs.push(logEntry(card, card, 'DEFEND', 0, false, `${card.name} no puede moverse`));
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

    if (pending.actionType === 'DEFEND') {
      pending.card.isDefending = true;
      logs.push(logEntry(pending.card, pending.card, 'DEFEND', 0, false, `${pending.card.name} se defiende`));
      continue;
    }

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
        logs.push(logEntry(pending.card, pending.target, 'SKILL', damage, false, `${pending.card.name} usa ${skill.name} → ${pending.target.name}: -${damage}, ${healTarget.name} recupera ${healAmt}`, skill.id));
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
      logs.push(logEntry(pending.card, pending.target, skill.type, damage, critical, `${pending.card.name} usa ${skill.name} → ${pending.target.name}: -${damage}${critical ? ' ¡CRÍTICO!' : ''}`, skill.id));
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
      logs.push(logEntry(pending.card, pending.target, skill.type, damage, critical, `${pending.card.name} usa ${skill.name} → ${pending.target.name}: -${damage}${critical ? ' ¡CRÍTICO!' : ''}`, skill.id));
      applySkillEffect(pending.card, pending.target, skill, logs);
      continue;
    }

    // Normal attack
    const elementMult = skill.type === 'SKILL' ? getElementMultiplier(pending.card.element, pending.target.element) : 1;
    const atkStat = skill.type === 'MAGIC' ? pending.card.stats.magic : pending.card.stats.attack;
    const { damage, critical } = applyDamageToCard(pending.target, skill, elementMult, pending.target.isDefending, effectiveLuck, atkStat);
    logs.push(logEntry(pending.card, pending.target, skill.type, damage, critical, `${pending.card.name} usa ${skill.name} → ${pending.target.name}: -${damage}${critical ? ' ¡CRÍTICO!' : ''}`, skill.id));
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
