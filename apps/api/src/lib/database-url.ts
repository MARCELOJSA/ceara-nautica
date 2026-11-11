/**
 * Funções puras sobre a DATABASE_URL (PostgreSQL), usadas pela configuração da API
 * (SSL obrigatório em produção) e pelos scripts de backup/restauração.
 * Nenhuma função aqui devolve ou registra a senha da URL.
 */

/** Hosts que sempre apontam para a própria máquina (ou para o host, a partir de um container). */
const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1', 'host.docker.internal']);

/** Hosts que um container Docker não alcança e que devem virar host.docker.internal. */
const LOOPBACK_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1']);

export class DatabaseUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseUrlError';
  }
}

/** Remove os colchetes de IPv6 ("[::1]" → "::1") e normaliza para minúsculas. */
function normalizeHostname(hostname: string): string {
  return hostname.replace(/^\[|\]$/g, '').toLowerCase();
}

/**
 * Faz o parse de uma URL postgresql:// ou postgres://. Em caso de erro, a mensagem
 * não repete a URL (que pode conter a senha).
 */
export function parseDatabaseUrl(raw: string, label = 'DATABASE_URL'): URL {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new DatabaseUrlError(
      `${label} inválida: não é uma URL no formato postgresql://USUARIO:SENHA@HOST:PORTA/BANCO ` +
        '(caracteres especiais na senha precisam de percent-encoding).',
    );
  }
  if (url.protocol !== 'postgresql:' && url.protocol !== 'postgres:') {
    throw new DatabaseUrlError(
      `${label} inválida: o esquema precisa ser postgresql:// (recebido: ${url.protocol}//).`,
    );
  }
  if (!url.hostname) {
    throw new DatabaseUrlError(`${label} inválida: host ausente.`);
  }
  return url;
}

/**
 * Host local: localhost, 127.0.0.0/8, ::1, host.docker.internal ou nome de serviço
 * do Docker Compose sem ponto (ex.: "db"). Qualquer outro host é tratado como remoto.
 */
export function isLocalDatabaseHost(hostname: string): boolean {
  const h = normalizeHostname(hostname);
  if (!h) return false;
  if (LOCAL_HOSTNAMES.has(h)) return true;
  if (/^127(\.\d{1,3}){3}$/.test(h)) return true;
  // Nome de serviço em rede Docker (sem ponto, sem ":" de IPv6).
  return /^[a-z0-9][a-z0-9_-]*$/.test(h);
}

/** sslmode da URL (minúsculo) ou undefined. */
export function getSslMode(url: URL): string | undefined {
  const v = url.searchParams.get('sslmode');
  return v ? v.trim().toLowerCase() : undefined;
}

/**
 * Em produção, conexão com banco remoto exige `sslmode=require`.
 *
 * `verify-ca`/`verify-full` são recusados de propósito: o engine do Prisma 6 não os reconhece e
 * cai silenciosamente para `prefer`, que aceita conexão SEM TLS. Para validar o certificado com
 * o Prisma, use `sslmode=require&sslaccept=strict`.
 */
export function assertProductionDatabaseUrl(raw: string): void {
  const url = parseDatabaseUrl(raw);
  if (isLocalDatabaseHost(url.hostname)) return;
  const mode = getSslMode(url);
  if (mode === 'require') return;
  if (mode === 'verify-ca' || mode === 'verify-full') {
    throw new DatabaseUrlError(
      `DATABASE_URL de produção precisa de sslmode=require: o Prisma não suporta sslmode=${mode} ` +
        'e o trata como "prefer" (aceita conexão sem TLS). Para validar o certificado, use ' +
        'sslmode=require&sslaccept=strict.',
    );
  }
  throw new DatabaseUrlError(
    'DATABASE_URL de produção precisa de sslmode=require (banco remoto sem SSL obrigatório' +
      (mode ? `; recebido sslmode=${mode}` : '') +
      ').',
  );
}

/** URL com a senha trocada por "***", para logs. Nunca lança. */
export function maskDatabaseUrl(raw: string): string {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return '<URL inválida>';
  }
  if (url.password) url.password = '***';
  return url.toString();
}

/** Nome do banco (path da URL, sem a barra inicial). */
export function databaseNameOf(url: URL): string {
  return decodeURIComponent(url.pathname.replace(/^\//, ''));
}

/**
 * Para um container Docker alcançar o Postgres publicado no host: troca localhost/127.0.0.1/::1
 * por host.docker.internal (mantém a porta). Outros hosts ficam iguais.
 */
export function toDockerReachableUrl(raw: string): string {
  const url = parseDatabaseUrl(raw);
  if (LOOPBACK_HOSTNAMES.has(normalizeHostname(url.hostname))) {
    url.hostname = 'host.docker.internal';
  }
  return url.toString();
}

/**
 * Parâmetros de query entendidos pelo libpq (pg_dump/pg_restore). Os que só o Prisma entende
 * (schema, connection_limit, pool_timeout, sslaccept, pgbouncer...) fazem o libpq falhar com
 * "invalid URI query parameter" e são removidos.
 */
const LIBPQ_QUERY_PARAMS = new Set([
  'application_name',
  'channel_binding',
  'connect_timeout',
  'gssencmode',
  'keepalives',
  'keepalives_count',
  'keepalives_idle',
  'keepalives_interval',
  'options',
  'require_auth',
  'sslcert',
  'sslcompression',
  'sslcrl',
  'sslkey',
  'sslmode',
  'sslnegotiation',
  'sslrootcert',
  'target_session_attrs',
]);

/** URL só com parâmetros que o libpq aceita. */
export function toLibpqUrl(raw: string): string {
  const url = parseDatabaseUrl(raw);
  for (const key of [...url.searchParams.keys()]) {
    if (!LIBPQ_QUERY_PARAMS.has(key)) url.searchParams.delete(key);
  }
  return url.toString();
}
