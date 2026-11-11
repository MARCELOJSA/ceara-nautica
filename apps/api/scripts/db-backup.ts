/**
 * Backup do banco da DATABASE_URL (ou --url) em apps/api/backups/<banco>-<AAAA-MM-DD_HHMM>.dump.
 *
 *   npm run -w apps/api db:backup
 *   npm run -w apps/api db:backup -- --url "postgresql://..."
 *
 * Usa pg_dump da imagem Docker postgres:17-alpine (variável PG_TOOLS_IMAGE para trocar).
 * Requer Docker em execução. A senha nunca é impressa.
 */
import 'dotenv/config';
import { spawn } from 'node:child_process';
import { createWriteStream, existsSync, mkdirSync, rmSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  backupFileName,
  CONTAINER_URL_ENV,
  containerDatabaseUrl,
  databaseNameFromUrl,
  DEFAULT_PG_TOOLS_IMAGE,
  maskDatabaseUrl,
  parseCliArgs,
  pgDumpDockerArgs,
  resolveDatabaseUrl,
} from './db-tools.js';

const apiRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BACKUP_DIR = join(apiRoot, 'backups');

function uniquePath(dir: string, name: string): string {
  let candidate = join(dir, name);
  for (let i = 1; existsSync(candidate); i++) {
    candidate = join(dir, name.replace(/\.dump$/, `-${i}.dump`));
  }
  return candidate;
}

async function main() {
  const args = parseCliArgs(process.argv.slice(2));
  if (args.positional.length) throw new Error(`Argumento inesperado: ${args.positional[0]}`);
  const url = resolveDatabaseUrl(args, process.env);
  const image = process.env.PG_TOOLS_IMAGE?.trim() || DEFAULT_PG_TOOLS_IMAGE;

  mkdirSync(BACKUP_DIR, { recursive: true });
  const file = uniquePath(BACKUP_DIR, backupFileName(databaseNameFromUrl(url)));

  console.log(`Backup de ${maskDatabaseUrl(url)}`);
  console.log(`pg_dump via Docker (${image}) → ${file}`);

  const out = createWriteStream(file, { flags: 'wx' });
  const child = spawn('docker', pgDumpDockerArgs(image), {
    env: { ...process.env, [CONTAINER_URL_ENV]: containerDatabaseUrl(url) },
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  child.stdout.pipe(out);

  const code = await new Promise<number>((res, rej) => {
    child.on('error', (err) =>
      rej(new Error(`Não foi possível executar o Docker (${err.message}). O Docker está rodando?`)),
    );
    child.on('close', (c) => res(c ?? 1));
  });
  await new Promise<void>((res) => (out.writableFinished ? res() : out.on('finish', res)));

  if (code !== 0) {
    rmSync(file, { force: true });
    throw new Error(`pg_dump terminou com código ${code}; nenhum arquivo foi mantido.`);
  }
  const size = statSync(file).size;
  if (size === 0) {
    rmSync(file, { force: true });
    throw new Error('pg_dump não gerou dados; nenhum arquivo foi mantido.');
  }
  console.log(`Backup concluído: ${file} (${(size / 1024).toFixed(1)} KB)`);
}

main().catch((err: unknown) => {
  console.error(`Erro: ${err instanceof Error ? err.message : String(err)}`);
  process.exitCode = 1;
});
