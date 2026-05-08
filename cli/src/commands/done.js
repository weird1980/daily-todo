import { apiPatch } from '../client.js';
import { formatTask } from '../format.js';
import { t } from '../i18n.js';

/**
 * Registers the "done" command.
 * Usage: todo done <id> [-s summary]
 * @param {import('commander').Command} program
 */
export function registerDone(program) {
  program
    .command('done <id>')
    .description(t('done_description'))
    .option('-s, --summary <summary>', t('done_summary'))
    .action(async (id, opts) => {
      const task = await apiPatch(`/api/tasks/${id}/status`, {
        status: 'done',
        summary: opts.summary || null,
      });
      console.log(formatTask(task));
    });
}
