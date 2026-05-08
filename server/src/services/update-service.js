import { getDb } from '../db.js';
import { t } from '../i18n.js';

function statusEmoji(status) {
  if (status === 'done') return '✅';
  if (status === 'cancelled') return '❌';
  return '🔄';
}

function formatTaskLine(task) {
  const emoji = statusEmoji(task.status);
  const summary =
    task.status === 'cancelled' || !task.summary ? '' : ` ${task.summary}`;
  return `[${task.category}] ${task.title} ${emoji}${summary}`;
}

function getTasksByDateAndGroup(date, group) {
  const db = getDb();
  if (!group) {
    return db.prepare('SELECT * FROM tasks WHERE date = ? ORDER BY position ASC').all(date);
  }
  return db.prepare(
    `SELECT t.* FROM tasks t
     JOIN categories c ON t.category = c.name
     WHERE t.date = ? AND c."group" = ?
     ORDER BY t.position ASC`
  ).all(date, group);
}

/**
 * Generates a Slack-style daily update from tasks for the given date.
 * Deterministic template, not LLM-based.
 * Saves result to daily_updates table (upsert).
 *
 * @param {string} date - ISO date string (YYYY-MM-DD)
 * @param {string|null} group - 'work' or 'personal', null for all
 * @returns {string} The generated update text
 */
export function generateUpdate(date, group = null) {
  const tasks = getTasksByDateAndGroup(date, group);

  const allCancelled = tasks.length === 0 || tasks.every((task) => task.status === 'cancelled');

  if (allCancelled) {
    const content = t('update_no_tasks');
    saveUpdate(date, content);
    return content;
  }

  const lines = tasks.map(formatTaskLine);

  const pendingTasks = tasks.filter(
    (task) => task.status === 'pending' || task.status === 'in_progress'
  );
  const pendingLine =
    pendingTasks.length > 0
      ? `${t('tomorrow')}: ${pendingTasks.map((task) => task.title).join(', ')}`
      : '';

  const parts = [t('update_header'), '', ...lines];
  if (pendingLine) {
    parts.push(pendingLine);
  }

  const content = parts.join('\n');
  saveUpdate(date, content);
  return content;
}

function saveUpdate(date, content) {
  const db = getDb();
  db.prepare(
    `INSERT INTO daily_updates (date, content, generated_at)
     VALUES (?, ?, datetime('now'))
     ON CONFLICT(date) DO UPDATE SET
       content = excluded.content,
       generated_at = excluded.generated_at`
  ).run(date, content);
}
