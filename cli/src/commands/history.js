import chalk from 'chalk';
import { apiGet } from '../client.js';
import { t } from '../i18n.js';

const BAR_MAX_WIDTH = 30;

/**
 * Registers the "history" command.
 * Usage: todo history [--days N]
 * @param {import('commander').Command} program
 */
export function registerHistory(program) {
  program
    .command('history')
    .description(t('history_description'))
    .option('--days <n>', t('history_days'), '7')
    .action(async (opts) => {
      const days = parseInt(opts.days, 10);
      const rows = [];

      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);
        const tasks = await apiGet(`/api/tasks?date=${dateStr}`);
        const done = tasks.filter((task) => task.status === 'done').length;
        const total = tasks.length;
        rows.push({ date: dateStr, done, total });
      }

      const maxDone = Math.max(...rows.map((row) => row.done), 1);

      console.log(chalk.bold(`\n${t('history_title')}\n`));

      for (const row of rows) {
        const barLen = Math.round((row.done / maxDone) * BAR_MAX_WIDTH);
        const bar = chalk.green('█'.repeat(barLen)) + chalk.dim('░'.repeat(BAR_MAX_WIDTH - barLen));
        console.log(`  ${row.date}  ${bar}  ${row.done}/${row.total}`);
      }

      console.log();
    });
}
