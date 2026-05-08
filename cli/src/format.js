import chalk from 'chalk';
import { t } from './i18n.js';

const PRIORITY_COLORS = {
  high: chalk.red,
  medium: chalk.yellow,
  low: chalk.green,
};

const STATUS_ICONS = {
  pending: '○',
  in_progress: '◐',
  done: '●',
  cancelled: '✗',
};

/**
 * Formats a single task as a terminal-friendly string.
 * Format: #id icon title [category] priority — summary
 * @param {object} task
 * @returns {string}
 */
export function formatTask(task) {
  const icon = STATUS_ICONS[task.status] || '?';
  const colorize = PRIORITY_COLORS[task.priority] || chalk.white;
  const parts = [
    chalk.dim(`#${task.id}`),
    icon,
    task.title,
    chalk.cyan(`[${task.category}]`),
    colorize(task.priority),
  ];

  if (task.summary) {
    parts.push(chalk.dim(`— ${task.summary}`));
  }

  return parts.join(' ');
}

/**
 * Formats a list of tasks for terminal output.
 * @param {object[]} tasks
 * @returns {string}
 */
export function formatTaskList(tasks) {
  if (!tasks || tasks.length === 0) {
    return t('no_tasks_today');
  }

  return tasks.map(formatTask).join('\n');
}
