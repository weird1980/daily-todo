#!/usr/bin/env node

import { Command } from 'commander';
import { checkServer } from '../src/client.js';
import { t } from '../src/i18n.js';
import { registerAdd } from '../src/commands/add.js';
import { registerList } from '../src/commands/list.js';
import { registerDone } from '../src/commands/done.js';
import { registerProgress } from '../src/commands/progress.js';
import { registerCancel } from '../src/commands/cancel.js';
import { registerMove } from '../src/commands/move.js';
import { registerCategories } from '../src/commands/categories.js';
import { registerUpdate } from '../src/commands/update.js';
import { registerStandup } from '../src/commands/standup.js';
import { registerHistory } from '../src/commands/history.js';

const program = new Command();

program
  .name('todo')
  .description(t('cli_description'))
  .version('1.0.0');

registerAdd(program);
registerList(program);
registerDone(program);
registerProgress(program);
registerCancel(program);
registerMove(program);
registerCategories(program);
registerUpdate(program);
registerStandup(program);
registerHistory(program);

async function main() {
  const isServerUp = await checkServer();

  if (!isServerUp) {
    console.error(t('server_unavailable'));
    process.exit(1);
  }

  await program.parseAsync(process.argv);
}

main().catch((err) => {
  console.error(`${t('error_prefix')}: ${err.message}`);
  process.exit(1);
});
