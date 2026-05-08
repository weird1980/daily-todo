import { apiPatch } from '../client.js';
import { formatTask } from '../format.js';
import { t } from '../i18n.js';

/**
 * Registers the "cancel" command.
 * Usage: todo cancel <id>
 * @param {import('commander').Command} program
 */
export function registerCancel(program) {
  program
    .command('cancel <id>')
    .description(t('cancel_description'))
    .action(async (id) => {
      const task = await apiPatch(`/api/tasks/${id}/status`, {
        status: 'cancelled',
      });
      console.log(formatTask(task));
    });
}
