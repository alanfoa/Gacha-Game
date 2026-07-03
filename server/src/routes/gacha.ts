import { Router } from 'express';
import type { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/schema.js';
import { pullCard, pullCardWithGuarantee } from '../logic/probabilities.js';
import { cards, Rarity } from '../data/cards.js';
import { PACK_TYPES } from '../data/packs.js';
import { incrementMission } from '../logic/missions.js';

interface DbUser {
  id: string; name: string; coins: number; pity_count: number;
  total_pulls: number; legendary_count: number; token: string;
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

const DUPLICATE_REWARD = 25;

router.post('/register', (req, res) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return sendError(res, 400, 'Nombre requerido');
    }
    if (name.trim().length > 30) {
      return sendError(res, 400, 'Nombre demasiado largo (max 30 caracteres)');
    }

    const id = uuidv4();
    const token = uuidv4();
    const trimmed = name.trim();

    db.prepare('INSERT INTO users (id, name, token) VALUES (?, ?, ?)').run(id, trimmed, token);

    res.json({
      user: { id, name: trimmed, coins: 999999, pityCount: 0, totalPulls: 0, legendaryCount: 0 },
      token,
    });
  } catch {
    sendError(res, 500, 'Error al registrar');
  }
});

router.get('/profile', (req, res) => {
  try {
    const user = getUser(req);
    if (!user) return sendError(res, 401, 'Token invalido');

    const inventory = db.prepare(
      'SELECT card_id FROM inventory WHERE user_id = ?'
    ).all(user.id) as { card_id: string }[];

    const cardIds = inventory.map((i) => i.card_id);
    const uniqueCards = [...new Set(cardIds)];

    res.json({
      user: {
        id: user.id,
        name: user.name,
        coins: user.coins,
        pityCount: user.pity_count,
        totalPulls: user.total_pulls,
        legendaryCount: user.legendary_count,
      },
      inventory: cardIds,
      unlockedCards: uniqueCards,
    });
  } catch {
    sendError(res, 500, 'Error al obtener perfil');
  }
});

router.get('/packs', (_req, res) => {
  res.json({ packs: PACK_TYPES });
});

router.post('/open', (req, res) => {
  const user = getUser(req);
  if (!user) return sendError(res, 401, 'Token invalido');

  const packId: string = req.body.packType ?? 'basico';
  const packType = PACK_TYPES.find((p) => p.id === packId);
  if (!packType) return sendError(res, 400, 'Tipo de sobre invalido');

  if (user.coins < packType.cost) {
    return sendError(res, 400, 'Monedas insuficientes');
  }

  try {
    db.exec('BEGIN');

    // Pull all cards for this pack
    const results: { card: typeof cards[0]; isNew: boolean }[] = [];
    let totalCoinsEarned = 0;
    let newPityCount = user.pity_count;
    let newTotalPulls = user.total_pulls;
    let newLegendaryCount = user.legendary_count;

    for (let i = 0; i < packType.cardCount; i++) {
      const isGuaranteed = packType.guaranteeRarity && i === packType.cardCount - 1;
      const result = isGuaranteed
        ? pullCardWithGuarantee(newPityCount, packType.guaranteeRarity)
        : pullCard(newPityCount);

      const existing = db.prepare(
        'SELECT id FROM inventory WHERE user_id = ? AND card_id = ? LIMIT 1'
      ).get(user.id, result.card.id) as { id: number } | undefined;

      const isNew = !existing;

      db.prepare(
        'INSERT INTO inventory (user_id, card_id) VALUES (?, ?)'
      ).run(user.id, result.card.id);

      const coinsEarned = isNew ? 0 : DUPLICATE_REWARD;
      totalCoinsEarned += coinsEarned;
      newTotalPulls++;

      if (result.card.rarity === Rarity.Legendary) {
        newPityCount = 0;
        newLegendaryCount++;
      } else {
        newPityCount++;
      }

      results.push({ card: result.card, isNew });
    }

    // Update user coins and stats
    db.prepare(
      'UPDATE users SET coins = coins - ? + ?, pity_count = ?, total_pulls = ?, legendary_count = ? WHERE id = ?'
    ).run(packType.cost, totalCoinsEarned, newPityCount, newTotalPulls, newLegendaryCount, user.id);

    const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id) as DbUser | undefined;

    if (!updated) {
      db.exec('ROLLBACK');
      return sendError(res, 500, 'Error al actualizar usuario');
    }

    db.exec('COMMIT');

    // Track missions
    incrementMission(user.id, 'open_packs');
    if (totalCoinsEarned > 0) {
      incrementMission(user.id, 'earn_coins', totalCoinsEarned);
    }

    res.json({
      cards: results,
      user: {
        id: updated.id,
        name: updated.name,
        coins: updated.coins,
        pityCount: updated.pity_count,
        totalPulls: updated.total_pulls,
        legendaryCount: updated.legendary_count,
      },
    });
  } catch (e) {
    try { db.exec('ROLLBACK'); } catch { /* ignore */ }
    sendError(res, 500, 'Error al abrir sobre');
  }
});

router.get('/cards', (_req, res) => {
  res.json({ cards });
});

export default router;
