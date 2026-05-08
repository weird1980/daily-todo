import { Router } from 'express';
import { generateStandup, getStandup } from '../services/standup-service.js';

const router = Router();

/**
 * GET /api/standups/:date
 * Returns standup for the given date. Generates if it doesn't exist.
 */
router.get('/:date', (req, res) => {
  const { date } = req.params;

  try {
    const existing = getStandup(date);
    if (existing) {
      return res.json(existing);
    }

    const generated = generateStandup(date);
    const standup = getStandup(date);
    return res.json(standup || generated);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
