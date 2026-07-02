import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', '..', 'data.db');

const db = new DatabaseSync(DB_PATH);

db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    coins INTEGER NOT NULL DEFAULT 500,
    pity_count INTEGER NOT NULL DEFAULT 0,
    total_pulls INTEGER NOT NULL DEFAULT 0,
    legendary_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    card_id TEXT NOT NULL,
    obtained_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

db.exec('CREATE INDEX IF NOT EXISTS idx_inventory_user ON inventory(user_id)');
db.exec('CREATE INDEX IF NOT EXISTS idx_users_token ON users(token)');

try {
  db.exec('ALTER TABLE users ADD COLUMN win_streak INTEGER NOT NULL DEFAULT 0');
  db.exec('ALTER TABLE users ADD COLUMN total_battles INTEGER NOT NULL DEFAULT 0');
} catch {
  // columns already exist
}

// Migration v13: remove old-format card IDs (c01, c02, etc.)
const oldCards = db.prepare("SELECT id FROM inventory WHERE card_id GLOB 'c[0-9]*'").all() as { id: number }[];
if (oldCards.length > 0) {
  const ids = oldCards.map((r) => r.id);
  db.exec(`DELETE FROM inventory WHERE id IN (${ids.join(',')})`);
  console.log(`[migracion] Eliminadas ${ids.length} cartas con IDs antiguos del inventario`);
}

export default db;
