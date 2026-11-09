import { loadConfig } from './config.js';
import { createApp, createLogger } from './app.js';
import { createPrisma } from './lib/prisma.js';

const config = loadConfig();
const logger = createLogger(config.logLevel);
const prisma = createPrisma(config.databaseUrl);
const app = createApp({ config, prisma, logger });

const server = app.listen(config.port, () => {
  logger.info(
    { port: config.port, env: config.nodeEnv, origins: config.webOrigins },
    `API Ceará Náutica em http://localhost:${config.port}/api`,
  );
});

let shuttingDown = false;
async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, 'encerrando API');
  server.close();
  await prisma.$disconnect().catch(() => {});
  process.exit(0);
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
