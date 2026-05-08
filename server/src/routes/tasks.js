import { Router } from 'express';
import {
  createTask,
  getTasksByDate,
  getTasksForToday,
  updateTaskStatus,
  updateTaskPosition,
  updateTaskDate,
  deleteTask,
  reopenTask,
  getCompletedTasksHistory,
} from '../services/task-service.js';
import { broadcast } from '../ws.js';

const router = Router();

/**
 * GET /api/tasks?date=YYYY-MM-DD
 * Returns tasks for the given date (defaults to today).
 */
router.get('/', (req, res) => {
  const date = req.query.date || new Date().toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  const includeCarryOver = req.query.includeCarryOver === 'true';
  const tasks = (includeCarryOver && date === today)
    ? getTasksForToday(date)
    : getTasksByDate(date);
  res.json(tasks);
});

/**
 * GET /api/tasks/history?days=30
 * Returns completed/cancelled tasks for the last N days.
 */
router.get('/history', (req, res) => {
  const days = parseInt(req.query.days, 10) || 30;
  const tasks = getCompletedTasksHistory(days);
  res.json(tasks);
});

/**
 * POST /api/tasks
 * Creates a new task. Body: { title, category, priority, date }
 */
router.post('/', (req, res) => {
  const { title, category, priority, date } = req.body;

  if (!title || !category || !priority || !date) {
    return res.status(400).json({ error: 'title, category, priority, and date are required' });
  }

  try {
    const task = createTask({ title, category, priority, date });
    broadcast('tasks:changed', { date });
    return res.status(201).json(task);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

/**
 * PATCH /api/tasks/:id/status
 * Updates task status. Body: { status, summary }
 */
router.patch('/:id/status', (req, res) => {
  const { status, summary } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'status is required' });
  }

  try {
    const task = updateTaskStatus(Number(req.params.id), status, summary || null);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    broadcast('tasks:changed', { id: task.id, date: task.date });
    return res.json(task);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

/**
 * PATCH /api/tasks/:id/move
 * Moves task position. Body: { direction: 'up'|'down' }
 */
router.patch('/:id/move', (req, res) => {
  const { direction } = req.body;

  if (!direction || !['up', 'down'].includes(direction)) {
    return res.status(400).json({ error: 'direction must be "up" or "down"' });
  }

  try {
    const task = updateTaskPosition(Number(req.params.id), direction);
    broadcast('tasks:changed', { id: task.id, date: task.date });
    return res.json(task);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

/**
 * PATCH /api/tasks/:id/date
 * Changes task date. Body: { date }
 */
router.patch('/:id/date', (req, res) => {
  const { date } = req.body;

  if (!date) {
    return res.status(400).json({ error: 'date is required' });
  }

  try {
    const task = updateTaskDate(Number(req.params.id), date);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    broadcast('tasks:changed', { id: task.id, date: task.date });
    return res.json(task);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

/**
 * PATCH /api/tasks/:id/reopen
 * Reopens a completed/cancelled task as pending on today's date.
 */
router.patch('/:id/reopen', (req, res) => {
  try {
    const task = reopenTask(Number(req.params.id));
    broadcast('tasks:changed', { id: task.id, date: task.date });
    return res.json(task);
  } catch (err) {
    const status = err.message.includes('not found') ? 404 : 400;
    return res.status(status).json({ error: err.message });
  }
});

/**
 * DELETE /api/tasks/:id
 * Deletes a task.
 */
router.delete('/:id', (req, res) => {
  const deleted = deleteTask(Number(req.params.id));

  if (!deleted) {
    return res.status(404).json({ error: 'Task not found' });
  }

  broadcast('tasks:changed', { id: Number(req.params.id) });
  return res.status(204).send();
});

export default router;
