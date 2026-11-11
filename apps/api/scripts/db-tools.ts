/**
 * Partes puras (testáveis) dos scripts db:backup e db:restore.
 *
 * pg_dump/pg_restore rodam numa imagem Docker oficial para não exigir PostgreSQL instalado
 * no Windows. A imagem é a 17: o pg_dump lê servidores da mesma versão ou mais antigos
 * (16 no Docker local, 16/17 no Neon). O arquivo gerado (formato custom, -Fc) só é lido por
 * pg_restore >= 17, por isso a restauração usa a mesma imagem.
 */
import {
  databaseNameOf,
  isLocalDatabaseHost,
  maskDatabaseUrl,
  parseDatabaseUrl,
  toDockerReachableUrl,
  toLibpqUrl,
} from '../src/lib/database-url.js';

export { maskDatabaseUrl };

export const DEFAULT_PG_TOOLS_IMAGE = 'postgres:17-alpine';

/** Nome da variável de ambiente que leva a URL ao container (fora da linha de comando). */
export const CONTAINER_URL_ENV = 'CN_PG_URL';

export type CliArgs = { url?: string; yes: boolean; positional: string[] };

/** Aceita `--url URL`, `--url=URL`, `--yes`/`-y` e argumentos posicionais. */
export function parseCliArgs(argv: readonly string[]): CliArgs {
  const out: CliArgs = { yes: false, positional: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === '--yes' || a === '-y') out.yes = true;
    else if (a === '--url') {
      const v = argv[++i];
      if (!v || v.startsWith('--')) throw new Error('--url precisa de um valor.');
      out.url = v;
    } else if (a.startsWith('--url=')) out.url = a.slice('--url='.length);
    else if (a.startsWith('-')) throw new Error(`Opção desconhecida: ${a}`);
    else out.positional.push(a);
  }
  return out;
}

/** `--url` tem prioridade; senão DATABASE_URL. */
export function resolveDatabaseUrl(args: CliArgs, env: NodeJS.ProcessEnv): string {
  const raw = args.url?.trim() || env.DATABASE_URL?.trim();
  if (!raw) throw new Error('Informe a URL do banco em DATABASE_URL (apps/api/.env) ou com --url.');
  parseDatabaseUrl(raw, args.url ? '--url' : 'DATABASE_URL');
  return raw;
}

/** O destino/origem da URL é local (localhost, 127.x, ::1, host.docker.internal, serviço Docker)? */
export function isLocalDatabaseUrl(raw: string): boolean {
  return isLocalDatabaseHost(parseDatabaseUrl(raw).hostname);
}

const pad = (n: number) => String(n).padStart(2, '0');

/** `<banco>-<AAAA-MM-DD_HHMM>.dump` (hora local). Caracteres fora de [A-Za-z0-9_-] viram "_". */
export function backupFileName(dbName: string, date: Date = new Date()): string {
  const safe = dbName.replace(/[^A-Za-z0-9_-]/g, '_') || 'banco';
  const stamp =
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_` +
    `${pad(date.getHours())}${pad(date.getMinutes())}`;
  return `${safe}-${stamp}.dump`;
}

export function databaseNameFromUrl(raw: string): string {
  return databaseNameOf(parseDatabaseUrl(raw));
}

/** URL que o container usa: host trocado para host.docker.internal e só parâmetros do libpq. */
export function containerDatabaseUrl(raw: string): string {
  return toLibpqUrl(toDockerReachableUrl(raw));
}

/**
 * Argumentos do `docker run`. A URL vai pela variável CN_PG_URL (repassada do ambiente do
 * processo com `-e NOME`, sem valor), para a senha não aparecer na linha de comando.
 * O arquivo trafega por stdin/stdout, sem montar volumes (evita problemas com caminhos do Windows).
 */
function dockerRunArgs(image: string, command: string, interactive: boolean): string[] {
  return [
    'run',
    '--rm',
    ...(interactive ? ['-i'] : []),
    // No Docker Desktop host.docker.internal já existe; no Linux este mapeamento o cria.
    '--add-host=host.docker.internal:host-gateway',
    '-e',
    CONTAINER_URL_ENV,
    '--entrypoint',
    'sh',
    image,
    '-c',
    command,
  ];
}

/** pg_dump em formato custom, escrevendo em stdout. */
export function pgDumpDockerArgs(image = DEFAULT_PG_TOOLS_IMAGE): string[] {
  return dockerRunArgs(
    image,
    `exec pg_dump --format=custom --no-owner --no-privileges --dbname="$${CONTAINER_URL_ENV}"`,
    false,
  );
}

/**
 * Restauração lendo o arquivo de stdin, em duas etapas dentro do container:
 * 1. pg_restore converte o backup inteiro em SQL (apagando os objetos existentes com
 *    --clean --if-exists, sem dono nem permissões da origem). Se o arquivo estiver corrompido,
 *    falha aqui, antes de qualquer conexão com o banco de destino.
 * 2. psql aplica o SQL numa única transação, parando no primeiro erro (ROLLBACK: o destino fica
 *    como estava).
 *
 * Por que não `pg_restore --dbname --single-transaction` direto: o pg_dump 17 grava
 * `SET transaction_timeout = 0`, parâmetro que não existe no PostgreSQL 16 (Docker local), e o
 * erro abortaria a transação. Essa linha é removida; nos servidores 17 ela é só um SET padrão.
 */
export function pgRestoreDockerArgs(image = DEFAULT_PG_TOOLS_IMAGE): string[] {
  return dockerRunArgs(
    image,
    [
      'set -e;',
      'pg_restore --clean --if-exists --no-owner --no-privileges --file=/tmp/restore.sql;',
      "sed -i '/^SET transaction_timeout = /d' /tmp/restore.sql;",
      'exec psql --no-psqlrc --quiet --set=ON_ERROR_STOP=1 --single-transaction --output=/dev/null',
      `--dbname="$${CONTAINER_URL_ENV}"`,
      "--command='SET client_min_messages = warning' --file=/tmp/restore.sql",
    ].join(' '),
    true,
  );
}

/** Arquivos no formato custom do pg_dump começam com "PGDMP". */
export function isCustomDumpHeader(head: Uint8Array): boolean {
  return Buffer.from(head.subarray(0, 5)).toString('latin1') === 'PGDMP';
}

/** Mensagem de recusa do restore em banco remoto sem --yes. */
export function remoteRestoreRefusal(maskedUrl: string): string {
  return [
    `Restauração ABORTADA: o destino não é local (${maskedUrl}).`,
    'O restore apaga e recria as tabelas do banco de destino (--clean); os dados atuais dele,',
    'inclusive leads recebidos depois do backup, serão perdidos.',
    'Confira a URL e repita com --yes para confirmar. Nada foi alterado.',
  ].join('\n');
}
