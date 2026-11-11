import { loadConfig } from './config.js';
import { createApp, createLogger } from './app.js';
import { createPrisma } from './lib/prisma.js';
import { closeServer } from './lib/shutdown.js';

/** Tempo para requisições em andamento terminarem no SIGTERM (o Render espera 30 s). */
const SHUTDOWN_TIMEOUT_MS = 10_000;

const config = loadConfig();
const logger = createLogger(config.logLevel);
const prisma = createPrisma(config.databaseUrl);
const app = createApp({ config, prisma, logger });

// Sem host explícito o Node escuta em todas as interfaces (:: e 0.0.0.0), como o Render exige.
// A porta vem de PORT (o Render define PORT=10000).
const server = app.listen(config.port, () => {
  logger.info(
    { port: config.port, env: config.nodeEnv, origins: config.webOrigins },
    `API Ceará Náutica em http://localhost:${config.port}/api`,
  );
});

server.on('error', (err) => {
  logger.fatal({ err }, 'não foi possível iniciar o servidor HTTP');
  process.exit(1);
});

let shuttingDown = false;
async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, 'encerrando API');
  const result = await closeServer(server, SHUTDOWN_TIMEOUT_MS);
  if (result === 'timeout') logger.warn('requisições em andamento interrompidas no encerramento');
  await prisma.$disconnect().catch(() => {});
  logger.info('API encerrada');
  process.exit(0);
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
