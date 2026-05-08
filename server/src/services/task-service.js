import { getDb } from '../db.js';

/**
 * Returns tasks for today PLUS any pending/in_progress tasks from previous days.
 * This ensures unfinished tasks always show up on today's board.
 * @param {string} today - date string YYYY-MM-DD
 * @returns {Array} tasks sorted by date desc then position asc
 */
export function getTasksForToday(today) {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM tasks
    WHERE (date = ?)
       OR (date < ? AND status IN ('pending', 'in_progress'))
    ORDER BY date DESC, position ASC
  `).all(today, today);
}

/**
 * Validates that a category exists in the database.
 * @param {string} category
 * @throws {Error} if category does not exist
 */
function validateCategory(category) {
  const db = getDb();
  const row = db.prepare('SELECT name FROM categories WHERE name = ?').get(category);
  if (!row) {
    throw new Error(`Invalid category: "${category}" does not exist`);
  }
}

/**
 * Returns the next available position for a given date.
 * @param {string} date
 * @returns {number}
 */
function getNextPosition(date) {
  const db = getDb();
  const row = db
    .prepare('SELECT MAX(position) AS maxPos FROM tasks WHERE date = ?')
    .get(date);
  return row.maxPos == null ? 0 : row.maxPos + 1;
}

/**
 * Creates a new task with auto-assigned position.
 * @param {{ title: string, category: string, priority: string, date: string }} params
 * @returns {object} The created task row
 */
export function createTask({ title, category, priority, date }) {
  validateCategory(category);

  const db = getDb();
  const position = getNextPosition(date);

  const result = db
    .prepare(
      `INSERT INTO tasks (title, category, priority, date, position)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(title, category, priority, date, position);

  return db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
}

/**
 * Returns a task by its id.
 * @param {number} id
 * @returns {object|undefined}
 */
export function getTaskById(id) {
  const db = getDb();
  return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
}

/**
 * Returns all tasks for a given date, sorted by position.
 * @param {string} date
 * @returns {object[]}
 */
export function getTasksByDate(date) {
  const db = getDb();
  return db
    .prepare('SELECT * FROM tasks WHERE date = ? ORDER BY position ASC')
    .all(date);
}

/**
 * Updates the status (and optionally summary) of a task.
 * Sets completed_at when status is 'done', clears it otherwise.
 * @param {number} id
 * @param {string} status
 * @param {string|null} summary
 * @returns {object} The updated task row
 */
export function updateTaskStatus(id, status, summary = null) {
  const db = getDb();
  const completedAt = status === 'done' ? new Date().toISOString() : null;

  db.prepare(
    `UPDATE tasks
     SET status = ?, summary = ?, completed_at = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(status, summary, completedAt, id);

  return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
}

/**
 * Swaps a task's position with its neighbor in the given direction.
 * @param {number} id
 * @param {'up'|'down'} direction
 * @returns {object} The updated task row
 */
export function updateTaskPosition(id, direction) {
  const db = getDb();
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  if (!task) {
    throw new Error(`Task with id ${id} not found`);
  }

  const operator = direction === 'up' ? '<' : '>';
  const order = direction === 'up' ? 'DESC' : 'ASC';

  const neighbor = db
    .prepare(
      `SELECT * FROM tasks
       WHERE date = ? AND position ${operator} ?
       ORDER BY position ${order}
       LIMIT 1`
    )
    .get(task.date, task.position);

  if (!neighbor) {
    return task;
  }

  const swap = db.transaction(() => {
    db.prepare('UPDATE tasks SET position = ?, updated_at = datetime(\'now\') WHERE id = ?')
      .run(neighbor.position, task.id);
    db.prepare('UPDATE tasks SET position = ?, updated_at = datetime(\'now\') WHERE id = ?')
      .run(task.position, neighbor.id);
  });

  swap();

  return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
}

/**
 * Moves a task to a new date, assigning it the next available position.
 * @param {number} id
 * @param {string} newDate
 * @returns {object} The updated task row
 */
export function updateTaskDate(id, newDate) {
  const db = getDb();
  const position = getNextPosition(newDate);

  db.prepare(
    `UPDATE tasks
     SET date = ?, position = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(newDate, position, id);

  return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
}

/**
 * Moves all pending/in_progress tasks from past dates to today.
 * Preserves their existing summary and status. Runs once at server start.
 * @returns {number} Number of tasks carried over
 */
export function carryOverPendingTasks() {
  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);

  const stale = db.prepare(
    `SELECT id FROM tasks
     WHERE date < ? AND status IN ('pending', 'in_progress')`
  ).all(today);

  if (stale.length === 0) return 0;

  const maxPos = db.prepare(
    'SELECT COALESCE(MAX(position), -1) AS maxPos FROM tasks WHERE date = ?'
  ).get(today).maxPos;

  const move = db.transaction(() => {
    let pos = maxPos + 1;
    for (const row of stale) {
      db.prepare(
        `UPDATE tasks SET date = ?, position = ?, updated_at = datetime('now') WHERE id = ?`
      ).run(today, pos, row.id);
      pos++;
    }
  });
  move();

  return stale.length;
}

/**
 * Reopens a completed/cancelled task, setting it back to 'pending' on today's date.
 * Clears summary and completed_at.
 * @param {number} id
 * @returns {object} The updated task row
 */
export function reopenTask(id) {
  const db = getDb();
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  if (!task) {
    throw new Error(`Task with id ${id} not found`);
  }
  if (task.status !== 'done' && task.status !== 'cancelled') {
    throw new Error('Only done or cancelled tasks can be reopened');
  }

  const today = new Date().toISOString().slice(0, 10);
  const position = getNextPosition(today);

  db.prepare(
    `UPDATE tasks
     SET status = 'pending', summary = NULL, completed_at = NULL,
         date = ?, position = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(today, position, id);

  return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
}

/**
 * Returns completed/cancelled tasks grouped by date, for the last N days.
 * @param {number} days
 * @returns {object[]}
 */
export function getCompletedTasksHistory(days = 30) {
  const db = getDb();
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString().slice(0, 10);

  return db.prepare(
    `SELECT t.*, c.color AS category_color, c."group" AS category_group
     FROM tasks t
     LEFT JOIN categories c ON t.category = c.name
     WHERE t.status IN ('done', 'cancelled')
       AND t.date >= ?
     ORDER BY t.date DESC, t.completed_at DESC`
  ).all(sinceStr);
}

/**
 * Deletes a task by id.
 * @param {number} id
 * @returns {boolean} true if a row was deleted, false otherwise
 */
export function deleteTask(id) {
  const db = getDb();
  const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  return result.changes > 0;
}
