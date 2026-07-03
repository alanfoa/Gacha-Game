import db from '../db/schema.js';

const MISSION_DEFS = [
  { id: 'win_battles', goal: 3 },
  { id: 'open_packs', goal: 3 },
  { id: 'earn_coins', goal: 200 },
];

function getDate() {
  return new Date().toISOString().slice(0, 10);
}

export function ensureMissions(userId: string) {
  const date = getDate();
  const insert = db.prepare(
    'INSERT OR IGNORE INTO daily_missions (user_id, mission_id, progress, goal, completed, claimed, date) VALUES (?, ?, 0, ?, 0, 0, ?)'
  );
  for (const def of MISSION_DEFS) {
    insert.run(userId, def.id, def.goal, date);
  }
}

export function incrementMission(userId: string, missionId: string, amount: number = 1) {
  try {
    ensureMissions(userId);
    const date = getDate();
    const row = db.prepare(
      'SELECT progress, goal, completed FROM daily_missions WHERE user_id = ? AND mission_id = ? AND date = ?'
    ).get(userId, missionId, date) as { progress: number; goal: number; completed: number } | undefined;

    if (!row || row.completed) return;

    const newProgress = Math.min(row.progress + amount, row.goal);
    const completed = newProgress >= row.goal ? 1 : 0;

    db.prepare(
      'UPDATE daily_missions SET progress = ?, completed = ? WHERE user_id = ? AND mission_id = ? AND date = ?'
    ).run(newProgress, completed, userId, missionId, date);
  } catch {
    // silently fail
  }
}
