import { Router } from 'express';
import db from '../db/schema.js';

interface DbUser {
  id: string; name: string; coins: number; token: string;
}

const router = Router();

router.get('/debug/token', (_req, res) => {
  const users = db.prepare('SELECT id, name, token FROM users LIMIT 5').all() as unknown as DbUser[];
  res.json({ users: users.map(u => ({ id: u.id, name: u.name, token: u.token })) });
});

router.post('/debug/coins', (req, res) => {
  const { token, amount } = req.body;
  if (!token) return res.status(400).json({ error: 'token requerido' });

  const user = db.prepare('SELECT id, name, coins FROM users WHERE token = ?').get(token) as unknown as DbUser | undefined;
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

  const coins = typeof amount === 'number' ? amount : 999999;
  db.prepare('UPDATE users SET coins = ? WHERE id = ?').run(coins, user.id);
  user.coins = coins;

  res.json({ user });
});

export default router;
