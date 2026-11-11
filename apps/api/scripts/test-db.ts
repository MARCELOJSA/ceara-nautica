/**
 * Utilitários do banco de TESTE (PostgreSQL do Docker, banco separado).
 * - resolveTestDatabaseUrl(): TEST_DATABASE_URL ou DATABASE_URL com o nome do banco trocado
 *   por "<nome>_test".
 * - prepareTestDatabase(): cria o banco se não existir, aplica as migrations
 *   (prisma migrate deploy) e roda o seed do catálogo.
 */
import 'dotenv/config';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';
import { seed } from '../prisma/seed.js';

const apiRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export function resolveTestDatabaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  const explicit = env.TEST_DATABASE_URL?.trim();
  let url: URL;
  if (explicit) {
    url = new URL(explicit);
  } else {
    if (!env.DATABASE_URL) throw new Error('Defina TEST_DATABASE_URL ou DATABASE_URL.');
    url = new URL(env.DATABASE_URL);
    url.pathname = `/${url.pathname.replace(/^\//, '') || 'cearanautica'}_test`;
  }
  const dbName = url.pathname.replace(/^\//, '');
  if (!/test/i.test(dbName)) {
    throw new Error(
      `Por segurança, o banco de testes precisa conter "test" no nome (recebido: ${dbName}).`,
    );
  }
  return url.toString();
}

function quoteIdent(name: string): string {
  if (!/^[A-Za-z0-9_]+$/.test(name)) throw new Error(`Nome de banco inválido: ${name}`);
  return `"${name}"`;
}

async function ensureDatabase(testUrl: string) {
  const target = new URL(testUrl);
  const dbName = target.pathname.replace(/^\//, '');
  const admin = new URL(testUrl);
  admin.pathname = '/postgres';
  const prisma = new PrismaClient({ datasources: { db: { url: admin.toString() } } });
  try {
    const rows = await prisma.$queryRaw<{ exists: boolean }[]>`
      SELECT EXISTS (SELECT 1 FROM pg_database WHERE datname = ${dbName}) AS "exists"`;
    if (!rows[0]?.exists) {
      // CREATE DATABASE não aceita parâmetros; o nome é validado por quoteIdent.
      await prisma.$executeRawUnsafe(`CREATE DATABASE ${quoteIdent(dbName)}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

function migrateDeploy(testUrl: string) {
  const require = createRequire(import.meta.url);
  const prismaCli = require.resolve('prisma/build/index.js');
  execFileSync(process.execPath, [prismaCli, 'migrate', 'deploy'], {
    cwd: apiRoot,
    env: { ...process.env, DATABASE_URL: testUrl },
    stdio: 'pipe',
  });
}

export async function prepareTestDatabase(): Promise<string> {
  const testUrl = resolveTestDatabaseUrl();
  await ensureDatabase(testUrl);
  migrateDeploy(testUrl);
  const prisma = new PrismaClient({ datasources: { db: { url: testUrl } } });
  try {
    await seed(prisma);
  } finally {
    await prisma.$disconnect();
  }
  return testUrl;
}

const isDirectRun =
  process.argv[1] && /test-db\.(ts|js)$|prepare-test-db\.(ts|js)$/.test(process.argv[1]);
if (isDirectRun) {
  prepareTestDatabase()
    .then((url) => console.log(`Banco de testes pronto: ${new URL(url).pathname.slice(1)}`))
    .catch((err) => {
      console.error(err);
      process.exitCode = 1;
    });
}
