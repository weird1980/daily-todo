import clipboard from 'clipboardy';
import chalk from 'chalk';
import { apiPost } from '../client.js';
import { t } from '../i18n.js';

/**
 * Registers the "update" command.
 * Usage: todo update [-d date]
 * Generates a Slack daily update and copies it to clipboard.
 * @param {import('commander').Command} program
 */
export function registerUpdate(program) {
  program
    .command('update')
    .description(t('update_description'))
    .option('-d, --date <date>', t('add_date'), new Date().toISOString().slice(0, 10))
    .action(async (opts) => {
      const result = await apiPost('/api/updates/generate', { date: opts.date });

      console.log(chalk.bold(t('update_for', { date: result.date })));
      console.log(result.content);
      console.log();

      await clipboard.write(result.content);
      console.log(chalk.green(t('copied_clipboard')));
    });
}
