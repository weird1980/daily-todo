import { Router } from 'express';
import { generateUpdate } from '../services/update-service.js';
import { getDb } from '../db.js';

const router = Router();

/**
 * POST /api/updates/generate
 * Generates a daily update. Body: { date } (defaults to today).
 */
router.post('/generate', (req, res) => {
  const date = req.body.date || new Date().toISOString().slice(0, 10);
  const group = req.body.group || null;

  try {
    const content = generateUpdate(date, group);
    return res.json({ date, content });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/updates
 * Returns the last 30 daily updates.
 */
router.get('/', (_req, res) => {
  const db = getDb();
  const updates = db
    .prepare('SELECT * FROM daily_updates ORDER BY date DESC LIMIT 30')
    .all();
  res.json(updates);
});

export default router;
