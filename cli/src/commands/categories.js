import chalk from 'chalk';
import { apiGet, apiPost } from '../client.js';
import { t } from '../i18n.js';

/**
 * Registers the "categories" command and its subcommands.
 * Usage: todo categories (list) and todo categories add <name> <color>
 * @param {import('commander').Command} program
 */
export function registerCategories(program) {
  const cmd = program
    .command('categories')
    .description(t('categories_description'));

  cmd
    .command('list', { isDefault: true })
    .description(t('categories_list'))
    .action(async () => {
      const categories = await apiGet('/api/categories');

      if (!categories || categories.length === 0) {
        console.log(t('no_categories'));
        return;
      }

      for (const cat of categories) {
        console.log(`  ${chalk.hex(cat.color)('●')} ${cat.name} ${chalk.dim(cat.color)}`);
      }
    });

  cmd
    .command('add <name> <color>')
    .description(t('categories_add'))
    .action(async (name, color) => {
      const cat = await apiPost('/api/categories', { name, color });
      console.log(`${t('category_created')}: ${chalk.hex(cat.color)('●')} ${cat.name}`);
    });
}
