import { startKeepAlive } from '@rafaelhdsv/keep-alive';
import { logger } from './utils/logger.js';
import { app } from './app.js';
import { seedAdmin } from './scripts/seedAdmin.js';

if (process.argv.includes('--seed')) {
  await seedAdmin();
}

app.listen(3000, () => {
  logger.info('Servidor rodando! Acesse http://localhost:3000');
  startKeepAlive();
});
