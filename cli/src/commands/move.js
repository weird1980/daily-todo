import { apiPatch } from '../client.js';
import { formatTask } from '../format.js';
import { t } from '../i18n.js';

/**
 * Registers the "move" command.
 * Usage: todo move <id> --up/--down
 * @param {import('commander').Command} program
 */
export function registerMove(program) {
  program
    .command('move <id>')
    .description(t('move_description'))
    .option('--up', t('move_up'))
    .option('--down', t('move_down'))
    .action(async (id, opts) => {
      if (!opts.up && !opts.down) {
        console.error(t('move_required'));
        process.exit(1);
      }

      const direction = opts.up ? 'up' : 'down';
      const task = await apiPatch(`/api/tasks/${id}/move`, { direction });
      console.log(formatTask(task));
    });
}
