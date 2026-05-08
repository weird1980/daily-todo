import chalk from 'chalk';
import { apiGet } from '../client.js';
import { t } from '../i18n.js';

function yesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Registers the "standup" command.
 * Usage: todo standup [-d date]
 * @param {import('commander').Command} program
 */
export function registerStandup(program) {
  program
    .command('standup')
    .description(t('standup_description'))
    .option('-d, --date <date>', t('add_date'))
    .action(async (opts) => {
      const date = opts.date || yesterday();
      const standup = await apiGet(`/api/standups/${date}`);

      if (!standup || !standup.content) {
        console.log(t('no_standup_for', { date }));
        return;
      }

      console.log(chalk.bold(t('standup_for', { date: standup.date })));
      console.log(standup.content);
    });
}
