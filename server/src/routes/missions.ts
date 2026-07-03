import { Router } from 'express';
import type { Request, Response } from 'express';
import db from '../db/schema.js';

interface DbUser {
  id: string; name: string; coins: number; pity_count: number;
  total_pulls: number; legendary_count: number; token: string;
  win_streak: number; total_battles: number;
}

const MISSION_DEFS = [
  { id: 'win_battles', name: 'Ganar Batallas', description: 'Ganá 3 batallas', goal: 3, reward: 100 },
  { id: 'open_packs', name: 'Abrir Sobres', description: 'Abrí 3 sobres', goal: 3, reward: 1 },
  { id: 'earn_coins', name: 'Ganar Monedas', description: 'Ganá 200 monedas', goal: 200, reward: 50 },
];

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

function getDate() {
  return new Date().toISOString().slice(0, 10);
}

function sendError(res: Response, status: number, message: string) {
  res.status(status).json({ error: message });
}

function ensureMissions(userId: string) {
  const date = getDate();
  const insert = db.prepare(
    'INSERT OR IGNORE INTO daily_missions (user_id, mission_id, progress, goal, completed, claimed, date) VALUES (?, ?, 0, ?, 0, 0, ?)'
  );
  for (const def of MISSION_DEFS) {
    insert.run(userId, def.id, def.goal, date);
  }
}

const router = Router();

router.get('/missions', (req, res) => {
  const user = getUser(req);
  if (!user) return sendError(res, 401, 'Token invalido');

  try {
    ensureMissions(user.id);
    const date = getDate();
    const rows = db.prepare(
      'SELECT mission_id, progress, goal, completed, claimed FROM daily_missions WHERE user_id = ? AND date = ?'
    ).all(user.id, date) as { mission_id: string; progress: number; goal: number; completed: number; claimed: number }[];

    const missions = rows.map((r) => {
      const def = MISSION_DEFS.find((m) => m.id === r.mission_id);
      return {
        id: r.mission_id,
        name: def?.name ?? r.mission_id,
        description: def?.description ?? '',
        progress: r.progress,
        goal: r.goal,
        completed: !!r.completed,
        claimed: !!r.claimed,
        reward: def?.reward ?? 0,
      };
    });

    res.json({ missions, date });
  } catch {
    sendError(res, 500, 'Error al obtener misiones');
  }
});

router.post('/missions/claim', (req, res) => {
  const user = getUser(req);
  if (!user) return sendError(res, 401, 'Token invalido');

  const { missionId } = req.body;
  if (!missionId || typeof missionId !== 'string') {
    return sendError(res, 400, 'missionId requerido');
  }

  try {
    const date = getDate();
    const row = db.prepare(
      'SELECT mission_id, completed, claimed FROM daily_missions WHERE user_id = ? AND mission_id = ? AND date = ?'
    ).get(user.id, missionId, date) as { mission_id: string; completed: number; claimed: number } | undefined;

    if (!row) return sendError(res, 404, 'Mision no encontrada');
    if (!row.completed) return sendError(res, 400, 'Mision no completada');
    if (row.claimed) return sendError(res, 400, 'Mision ya reclamada');

    const def = MISSION_DEFS.find((m) => m.id === missionId);
    if (!def) return sendError(res, 404, 'Mision no definida');

    db.exec('BEGIN');

    db.prepare(
      'UPDATE daily_missions SET claimed = 1 WHERE user_id = ? AND mission_id = ? AND date = ?'
    ).run(user.id, missionId, date);

    if (def.reward > 1) {
      // reward is coins
      db.prepare('UPDATE users SET coins = coins + ? WHERE id = ?').run(def.reward, user.id);
    }

    const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id) as DbUser | undefined;
    if (!updated) { db.exec('ROLLBACK'); return sendError(res, 500, 'Error'); }

    let freePack = false;
    if (def.reward === 1) {
      freePack = true;
    }

    db.exec('COMMIT');

    res.json({
      claimed: true,
      rewardType: def.reward === 1 ? 'pack' : 'coins',
      rewardAmount: def.reward === 1 ? 0 : def.reward,
      freePack,
      user: {
        id: updated.id, name: updated.name, coins: updated.coins,
        pityCount: updated.pity_count, totalPulls: updated.total_pulls,
        legendaryCount: updated.legendary_count,
      },
    });
  } catch {
    try { db.exec('ROLLBACK'); } catch { /* ignore */ }
    sendError(res, 500, 'Error al reclamar mision');
  }
});

router.post('/missions/progress', (req, res) => {
  const user = getUser(req);
  if (!user) return sendError(res, 401, 'Token invalido');

  // This endpoint is called by the server internally or by the client to report progress
  // For now, progress is tracked server-side on battle wins and pack opens
  // This endpoint can be used for manual progress updates if needed
  sendError(res, 400, 'Use /missions directly');
});

export default router;
