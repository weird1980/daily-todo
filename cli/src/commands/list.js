import { apiGet } from '../client.js';
import { formatTaskList } from '../format.js';
import { t } from '../i18n.js';

/**
 * Registers the "list" command.
 * Usage: todo list [--date YYYY-MM-DD]
 * @param {import('commander').Command} program
 */
export function registerList(program) {
  program
    .command('list')
    .description(t('list_description'))
    .option('-d, --date <date>', t('add_date'), new Date().toISOString().slice(0, 10))
    .action(async (opts) => {
      const today = new Date().toISOString().slice(0, 10);
      const carryOver = opts.date === today ? '&includeCarryOver=true' : '';
      const tasks = await apiGet(`/api/tasks?date=${opts.date}${carryOver}`);
      console.log(formatTaskList(tasks));
    });
}
