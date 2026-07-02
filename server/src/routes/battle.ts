import { Router } from 'express';
import type { Request, Response } from 'express';
import db from '../db/schema.js';
import { cards } from '../data/cards.js';
import { generateEnemyTeam, processTurn, createBattleCard, type BattleCard, type BattleAction } from '../logic/battle.js';

interface DbUser {
  id: string; name: string; coins: number; pity_count: number;
  total_pulls: number; legendary_count: number; token: string;
  win_streak: number;
}

interface BattleSession {
  id: string;
  playerCards: BattleCard[];
  enemyCards: BattleCard[];
  turn: number;
  winner: 'player' | 'enemy' | null;
  coinsEarned: number;
}

function getUser(req: Request): DbUser | null {
  try {
    const raw = req.headers.authorization ?? '';
    const token = raw.replace('Bearer ', '');
    if (!token) return null;
    const row = db.prepare('SELECT * FROM users WHERE token = ?').get(token);
    return row ? (row as unknown as DbUser) : null;
  } catch {
    return null;
  }
}

function sendError(res: Response, status: number, message: string) {
  res.status(status).json({ error: message });
}

const router = Router();

const sessions = new Map<string, BattleSession>();
let sessionCounter = 0;

router.post('/battle/start', (req, res) => {
  try {
    const user = getUser(req);
    if (!user) return sendError(res, 401, 'Token invalido');

    const { cardIds } = req.body as { cardIds: string[] };
    if (!cardIds || !Array.isArray(cardIds) || cardIds.length !== 3) {
      return sendError(res, 400, 'Se requieren exactamente 3 cartas');
    }

    const inventory = db.prepare(
      'SELECT card_id FROM inventory WHERE user_id = ?'
    ).all(user.id) as { card_id: string }[];

    const owned = new Set(inventory.map((i) => i.card_id));
    for (const id of cardIds) {
      if (!owned.has(id)) return sendError(res, 400, `No posees la carta ${id}`);
    }

    const playerCards = cardIds.map((id) => {
      const card = cards.find((c) => c.id === id);
      if (!card) throw new Error(`Carta no encontrada: ${id}`);
      return createBattleCard(card);
    });

    const enemyCards = generateEnemyTeam(user.win_streak ?? 0);

    const id = `b_${++sessionCounter}`;
    sessions.set(id, { id, playerCards, enemyCards, turn: 0, winner: null, coinsEarned: 0 });

    res.json({
      battleId: id,
      playerCards: playerCards.map((c) => ({
        cardId: c.cardId, name: c.name, rarity: c.rarity, element: c.element,
        stats: c.stats, currentHp: c.currentHp, maxHp: c.maxHp,
        skills: c.skills,
      })),
      enemyCards: enemyCards.map((c) => ({
        cardId: c.cardId, name: c.name, rarity: c.rarity, element: c.element,
        stats: c.stats, currentHp: c.currentHp, maxHp: c.maxHp,
        skills: c.skills,
      })),
    });
  } catch {
    sendError(res, 500, 'Error al iniciar batalla');
  }
});

router.post('/battle/action', (req, res) => {
  try {
    const user = getUser(req);
    if (!user) return sendError(res, 401, 'Token invalido');

    const { battleId, actions } = req.body as { battleId: string; actions: BattleAction[] };

    const session = sessions.get(battleId);
    if (!session) return sendError(res, 404, 'Batalla no encontrada o expirada');
    if (session.winner) return sendError(res, 400, 'La batalla ya terminó');

    if (!actions || actions.length === 0) {
      return sendError(res, 400, 'Se requieren acciones');
    }

    session.turn++;

    const result = processTurn(session.playerCards, session.enemyCards, actions, session.turn);

    session.playerCards = result.playerCards;
    session.enemyCards = result.enemyCards;
    session.winner = result.winner;
    session.coinsEarned = result.coinsEarned;

    if (result.winner === 'player') {
      db.prepare('UPDATE users SET coins = coins + ?, win_streak = win_streak + 1 WHERE id = ?')
        .run(result.coinsEarned, user.id);
      sessions.delete(battleId);
    } else if (result.winner === 'enemy') {
      const loseCost = 10;
      db.prepare('UPDATE users SET coins = MAX(0, coins - ?), win_streak = 0 WHERE id = ?')
        .run(loseCost, user.id);
      result.coinsEarned = -loseCost;
      sessions.delete(battleId);
    }

    res.json({
      turn: result.turn,
      actions: result.actions,
      playerCards: result.playerCards.map((c) => ({
        cardId: c.cardId, name: c.name, rarity: c.rarity, element: c.element,
        stats: c.stats, currentHp: c.currentHp, maxHp: c.maxHp,
        skills: c.skills,
      })),
      enemyCards: result.enemyCards.map((c) => ({
        cardId: c.cardId, name: c.name, rarity: c.rarity, element: c.element,
        stats: c.stats, currentHp: c.currentHp, maxHp: c.maxHp,
        skills: c.skills,
      })),
      winner: result.winner,
      coinsEarned: result.coinsEarned,
    });
  } catch {
    sendError(res, 500, 'Error al procesar acción');
  }
});

export default router;
