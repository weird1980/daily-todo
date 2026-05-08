import { apiPost } from '../client.js';
import { formatTask } from '../format.js';
import { t } from '../i18n.js';

/**
 * Registers the "add" command.
 * Usage: todo add "Title" -c category -p priority [-d date]
 * @param {import('commander').Command} program
 */
export function registerAdd(program) {
  program
    .command('add <title>')
    .description(t('add_description'))
    .requiredOption('-c, --category <category>', t('add_category'))
    .requiredOption('-p, --priority <priority>', t('add_priority'))
    .option('-d, --date <date>', t('add_date'), new Date().toISOString().slice(0, 10))
    .action(async (title, opts) => {
      const date = opts.date;
      const task = await apiPost('/api/tasks', {
        title,
        category: opts.category,
        priority: opts.priority,
        date,
      });
      console.log(formatTask(task));
    });
}
