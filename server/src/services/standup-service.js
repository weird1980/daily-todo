import { getDb } from '../db.js';
import { getTasksByDate } from './task-service.js';
import { t } from '../i18n.js';

/**
 * Generates a standup summary from tasks for the given date.
 * Saves result to daily_standups table (upsert).
 *
 * @param {string} date - ISO date string (YYYY-MM-DD)
 * @returns {{ summary: string, tasks_total: number, tasks_done: number }}
 */
export function generateStandup(date) {
  const tasks = getTasksByDate(date);

  const tasksTotal = tasks.length;
  const tasksDone = tasks.filter((task) => task.status === 'done').length;

  if (tasksTotal === 0) {
    const result = { summary: t('no_tasks'), tasks_total: 0, tasks_done: 0 };
    saveStandup(date, result);
    return result;
  }

  const completed = tasks.filter((task) => task.status === 'done');
  const pending = tasks.filter(
    (task) => task.status === 'pending' || task.status === 'in_progress'
  );

  const sections = [];

  if (completed.length > 0) {
    const completedLines = completed.map(
      (task) => `  - ${task.title}: ${task.summary || t('no_summary')}`
    );
    sections.push([t('completed'), ...completedLines].join('\n'));
  }

  if (pending.length > 0) {
    const pendingLines = pending.map((task) => {
      const summaryPart = task.summary ? ` (${task.summary})` : '';
      return `  - ${task.title}${summaryPart}`;
    });
    sections.push([t('pending'), ...pendingLines].join('\n'));
  }

  const summary = sections.join('\n');

  const result = { summary, tasks_total: tasksTotal, tasks_done: tasksDone };
  saveStandup(date, result);
  return result;
}

/**
 * Gets an existing standup for a given date.
 * @param {string} date
 * @returns {object|undefined}
 */
export function getStandup(date) {
  const db = getDb();
  return db.prepare('SELECT * FROM daily_standups WHERE date = ?').get(date);
}

function saveStandup(date, { summary, tasks_total, tasks_done }) {
  const db = getDb();
  db.prepare(
    `INSERT INTO daily_standups (date, summary, tasks_total, tasks_done, generated_at)
     VALUES (?, ?, ?, ?, datetime('now'))
     ON CONFLICT(date) DO UPDATE SET
       summary = excluded.summary,
       tasks_total = excluded.tasks_total,
       tasks_done = excluded.tasks_done,
       generated_at = excluded.generated_at`
  ).run(date, summary, tasks_total, tasks_done);
}
