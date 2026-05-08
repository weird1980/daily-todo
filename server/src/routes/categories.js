import { Router } from 'express';
import { getAllCategories, createCategory } from '../services/category-service.js';

const router = Router();

/**
 * GET /api/categories
 * Returns all categories.
 */
router.get('/', (_req, res) => {
  const categories = getAllCategories();
  res.json(categories);
});

/**
 * POST /api/categories
 * Creates a new category. Body: { name, color }
 */
router.post('/', (req, res) => {
  const { name, color, group } = req.body;

  if (!name || !color) {
    return res.status(400).json({ error: 'name and color are required' });
  }

  try {
    const category = createCategory(name, color, group || 'work');
    return res.status(201).json(category);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

export default router;
