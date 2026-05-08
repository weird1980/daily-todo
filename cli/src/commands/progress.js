import { apiPatch } from '../client.js';
import { formatTask } from '../format.js';
import { t } from '../i18n.js';

/**
 * Registers the "progress" command.
 * Usage: todo progress <id> [-s summary]
 * @param {import('commander').Command} program
 */
export function registerProgress(program) {
  program
    .command('progress <id>')
    .description(t('progress_description'))
    .option('-s, --summary <summary>', t('progress_summary'))
    .action(async (id, opts) => {
      const task = await apiPatch(`/api/tasks/${id}/status`, {
        status: 'in_progress',
        summary: opts.summary || null,
      });
      console.log(formatTask(task));
    });
}
