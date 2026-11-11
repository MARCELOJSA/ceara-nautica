/**
 * Restaura um backup (.dump, formato custom) no banco da DATABASE_URL (ou --url).
 *
 *   npm run -w apps/api db:restore -- backups/cearanautica-2026-11-10_1430.dump
 *   npm run -w apps/api db:restore -- <arquivo> --url "postgresql://..." --yes
 *
 * Apaga e recria os objetos do banco de destino (pg_restore --clean --if-exists, aplicado pelo
 * psql), sem dono nem permissões da origem, numa única transação. Destino remoto exige --yes.
 * Usa pg_restore da imagem Docker postgres:17-alpine (variável PG_TOOLS_IMAGE para trocar).
 */
import 'dotenv/config';
import { spawn } from 'node:child_process';
import { closeSync, createReadStream, existsSync, openSync, readSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  CONTAINER_URL_ENV,
  containerDatabaseUrl,
  DEFAULT_PG_TOOLS_IMAGE,
  isCustomDumpHeader,
  isLocalDatabaseUrl,
  maskDatabaseUrl,
  parseCliArgs,
  pgRestoreDockerArgs,
  remoteRestoreRefusal,
  resolveDatabaseUrl,
} from './db-tools.js';

/** Caminho relativo vale a partir de onde o npm foi chamado (INIT_CWD) ou de apps/api. */
function resolveBackupFile(arg: string): string {
  const candidates = [process.env.INIT_CWD, process.cwd()]
    .filter((d): d is string => Boolean(d))
    .map((d) => resolve(d, arg));
  const found = candidates.find((p) => existsSync(p) && statSync(p).isFile());
  if (!found) throw new Error(`Arquivo de backup não encontrado: ${arg}`);
  return found;
}

function readHeader(file: string): Buffer {
  const fd = openSync(file, 'r');
  try {
    const buf = Buffer.alloc(5);
    readSync(fd, buf, 0, 5, 0);
    return buf;
  } finally {
    closeSync(fd);
  }
}

async function main() {
  const args = parseCliArgs(process.argv.slice(2));
  if (args.positional.length !== 1) {
    throw new Error('Uso: npm run -w apps/api db:restore -- <arquivo.dump> [--url URL] [--yes]');
  }
  const url = resolveDatabaseUrl(args, process.env);
  const masked = maskDatabaseUrl(url);
  const file = resolveBackupFile(args.positional[0]!);
  if (!isCustomDumpHeader(readHeader(file))) {
    throw new Error(`${file} não é um backup no formato custom do pg_dump (gerado por db:backup).`);
  }

  if (!isLocalDatabaseUrl(url) && !args.yes) {
    console.error(remoteRestoreRefusal(masked));
    process.exitCode = 2;
    return;
  }

  const image = process.env.PG_TOOLS_IMAGE?.trim() || DEFAULT_PG_TOOLS_IMAGE;
  console.log(`Restaurando ${file}`);
  console.log(`→ ${masked} (pg_restore via Docker, ${image})`);

  const child = spawn('docker', pgRestoreDockerArgs(image), {
    env: { ...process.env, [CONTAINER_URL_ENV]: containerDatabaseUrl(url) },
    stdio: ['pipe', 'inherit', 'inherit'],
  });
  // Se o pg_restore sair antes de ler tudo, o erro de pipe é irrelevante: vale o código de saída.
  child.stdin.on('error', () => undefined);
  createReadStream(file).pipe(child.stdin);

  const code = await new Promise<number>((res, rej) => {
    child.on('error', (err) =>
      rej(new Error(`Não foi possível executar o Docker (${err.message}). O Docker está rodando?`)),
    );
    child.on('close', (c) => res(c ?? 1));
  });
  if (code !== 0) {
    throw new Error(
      `pg_restore terminou com código ${code}. A restauração roda numa transação: ` +
        'o banco de destino não foi alterado.',
    );
  }
  console.log('Restauração concluída.');
}

main().catch((err: unknown) => {
  console.error(`Erro: ${err instanceof Error ? err.message : String(err)}`);
  process.exitCode = 1;
});
