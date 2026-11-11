import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config.js';
import {
  assertProductionDatabaseUrl,
  isLocalDatabaseHost,
  maskDatabaseUrl,
  toDockerReachableUrl,
  toLibpqUrl,
} from '../src/lib/database-url.js';
import {
  backupFileName,
  containerDatabaseUrl,
  databaseNameFromUrl,
  isCustomDumpHeader,
  isLocalDatabaseUrl,
  parseCliArgs,
  pgDumpDockerArgs,
  pgRestoreDockerArgs,
  remoteRestoreRefusal,
  resolveDatabaseUrl,
} from '../scripts/db-tools.js';

const NEON =
  'postgresql://usuario:s3nh4-secreta@ep-cool-name-123456.sa-east-1.aws.neon.tech/neondb' +
  '?sslmode=require&connect_timeout=15';
const REMOTE_NO_SSL = 'postgresql://usuario:s3nh4-secreta@db.exemplo.com.br:5432/app';

const prodEnv = (DATABASE_URL: string) =>
  ({
    NODE_ENV: 'production',
    DATABASE_URL,
    IP_HASH_SALT: 'x'.repeat(32),
    WEB_ORIGIN: 'https://www.exemplo.com.br',
  }) as NodeJS.ProcessEnv;

describe('SSL obrigatório na DATABASE_URL de produção', () => {
  it('Neon com sslmode=require sobe', () => {
    expect(loadConfig(prodEnv(NEON)).databaseUrl).toBe(NEON);
  });

  it('banco remoto sem sslmode é recusado com mensagem clara (sem vazar a senha)', () => {
    expect(() => loadConfig(prodEnv(REMOTE_NO_SSL))).toThrow(
      /DATABASE_URL de produção precisa de sslmode=require/,
    );
    try {
      loadConfig(prodEnv(REMOTE_NO_SSL));
    } catch (err) {
      expect(String(err)).not.toContain('s3nh4-secreta');
    }
  });

  it('remoto com sslmode fraco (disable/prefer/allow) é recusado', () => {
    for (const mode of ['disable', 'prefer', 'allow']) {
      expect(() => loadConfig(prodEnv(`${REMOTE_NO_SSL}?sslmode=${mode}`))).toThrow(
        new RegExp(`sslmode=require.*sslmode=${mode}`),
      );
    }
  });

  it('verify-ca/verify-full são recusados: o Prisma os trata como "prefer" (sem TLS garantido)', () => {
    for (const mode of ['verify-ca', 'verify-full']) {
      expect(() => loadConfig(prodEnv(`${REMOTE_NO_SSL}?sslmode=${mode}`))).toThrow(
        /sslmode=require.*sslaccept=strict/,
      );
    }
    expect(() =>
      assertProductionDatabaseUrl(`${REMOTE_NO_SSL}?sslmode=require&sslaccept=strict`),
    ).not.toThrow();
  });

  it('banco local (localhost, 127.0.0.1, ::1, host.docker.internal, serviço "db") sem sslmode sobe', () => {
    for (const host of [
      'localhost:5433',
      '127.0.0.1:5433',
      '[::1]:5433',
      'host.docker.internal',
      'db',
    ]) {
      expect(() => loadConfig(prodEnv(`postgresql://u:p@${host}/x`))).not.toThrow();
    }
  });

  it('URL inválida → erro de configuração claro', () => {
    expect(() => loadConfig(prodEnv('isto não é uma url'))).toThrow(
      /Configuração inválida: DATABASE_URL inválida/,
    );
    expect(() => loadConfig(prodEnv('mysql://u:p@db.exemplo.com/x'))).toThrow(
      /Configuração inválida: DATABASE_URL inválida: o esquema precisa ser postgresql/,
    );
  });

  it('fora de produção a regra não se aplica', () => {
    expect(() =>
      loadConfig({ NODE_ENV: 'development', DATABASE_URL: REMOTE_NO_SSL } as NodeJS.ProcessEnv),
    ).not.toThrow();
  });
});

describe('funções puras de URL', () => {
  it('isLocalDatabaseHost', () => {
    for (const h of [
      'localhost',
      'LOCALHOST',
      '127.0.0.1',
      '127.1.2.3',
      '[::1]',
      '::1',
      'db',
      'postgres_1',
    ]) {
      expect(isLocalDatabaseHost(h), h).toBe(true);
    }
    for (const h of ['ep-x.sa-east-1.aws.neon.tech', 'db.exemplo.com', '10.0.0.5', 'fe80::1', '']) {
      expect(isLocalDatabaseHost(h), h).toBe(false);
    }
  });

  it('maskDatabaseUrl esconde a senha e nunca lança', () => {
    const masked = maskDatabaseUrl(NEON);
    expect(masked).not.toContain('s3nh4-secreta');
    expect(masked).toContain('usuario:***@ep-cool-name-123456');
    expect(masked).toContain('sslmode=require');
    expect(maskDatabaseUrl('postgresql://u@localhost/x')).toBe('postgresql://u@localhost/x');
    expect(maskDatabaseUrl('lixo s3nh4')).toBe('<URL inválida>');
  });

  it('toDockerReachableUrl troca só hosts de loopback, mantendo porta e parâmetros', () => {
    expect(toDockerReachableUrl('postgresql://u:p@localhost:5433/db_test')).toBe(
      'postgresql://u:p@host.docker.internal:5433/db_test',
    );
    expect(toDockerReachableUrl('postgresql://u:p@127.0.0.1:5433/x?sslmode=disable')).toBe(
      'postgresql://u:p@host.docker.internal:5433/x?sslmode=disable',
    );
    expect(toDockerReachableUrl('postgresql://u:p@[::1]:5433/x')).toBe(
      'postgresql://u:p@host.docker.internal:5433/x',
    );
    expect(toDockerReachableUrl(NEON)).toBe(NEON);
  });

  it('toLibpqUrl remove parâmetros que só o Prisma entende', () => {
    expect(
      toLibpqUrl(
        'postgresql://u:p@h.com/x?schema=public&sslmode=require&connection_limit=5&sslaccept=strict&connect_timeout=15',
      ),
    ).toBe('postgresql://u:p@h.com/x?sslmode=require&connect_timeout=15');
  });
});

describe('ferramentas de backup/restauração', () => {
  it('backupFileName: <banco>-<AAAA-MM-DD_HHMM>.dump em hora local', () => {
    expect(backupFileName('cearanautica', new Date(2026, 10, 9, 7, 5))).toBe(
      'cearanautica-2026-11-09_0705.dump',
    );
    expect(backupFileName('a/b c', new Date(2026, 0, 1, 23, 59))).toBe(
      'a_b_c-2026-01-01_2359.dump',
    );
    expect(backupFileName('', new Date(2026, 0, 1, 0, 0))).toBe('banco-2026-01-01_0000.dump');
  });

  it('databaseNameFromUrl e isLocalDatabaseUrl', () => {
    expect(databaseNameFromUrl(NEON)).toBe('neondb');
    expect(isLocalDatabaseUrl('postgresql://u:p@localhost:5433/x')).toBe(true);
    expect(isLocalDatabaseUrl(NEON)).toBe(false);
  });

  it('parseCliArgs', () => {
    expect(parseCliArgs(['b.dump', '--url', 'postgresql://x', '--yes'])).toEqual({
      positional: ['b.dump'],
      url: 'postgresql://x',
      yes: true,
    });
    expect(parseCliArgs(['--url=postgresql://y', '-y'])).toEqual({
      positional: [],
      url: 'postgresql://y',
      yes: true,
    });
    expect(parseCliArgs([])).toEqual({ positional: [], yes: false });
    expect(() => parseCliArgs(['--url'])).toThrow(/--url/);
    expect(() => parseCliArgs(['--force'])).toThrow(/Opção desconhecida/);
  });

  it('resolveDatabaseUrl: --url tem prioridade sobre DATABASE_URL; falta de ambos é erro', () => {
    const env = { DATABASE_URL: 'postgresql://u:p@localhost/a' } as NodeJS.ProcessEnv;
    expect(resolveDatabaseUrl({ yes: false, positional: [] }, env)).toBe(env.DATABASE_URL);
    expect(resolveDatabaseUrl({ yes: false, positional: [], url: NEON }, env)).toBe(NEON);
    expect(() => resolveDatabaseUrl({ yes: false, positional: [] }, {})).toThrow(/DATABASE_URL/);
    expect(() => resolveDatabaseUrl({ yes: false, positional: [], url: 'x y' }, env)).toThrow(
      /--url inválida/,
    );
  });

  it('containerDatabaseUrl combina troca de host e limpeza de parâmetros', () => {
    expect(containerDatabaseUrl('postgresql://u:p@localhost:5433/x?schema=public')).toBe(
      'postgresql://u:p@host.docker.internal:5433/x',
    );
  });

  it('comandos docker: imagem postgres:17-alpine e URL fora da linha de comando', () => {
    const dump = pgDumpDockerArgs();
    expect(dump).toContain('postgres:17-alpine');
    expect(dump.join(' ')).toContain('pg_dump --format=custom');
    expect(dump).not.toContain('-i');
    const restore = pgRestoreDockerArgs('postgres:17');
    expect(restore).toContain('postgres:17');
    expect(restore).toContain('-i');
    const restoreCmd = restore.join(' ');
    expect(restoreCmd).toContain('pg_restore --clean --if-exists --no-owner --no-privileges');
    expect(restoreCmd).toContain('set -e;');
    expect(restoreCmd).toContain("sed -i '/^SET transaction_timeout = /d' /tmp/restore.sql");
    expect(restoreCmd).toMatch(/psql .*ON_ERROR_STOP=1 --single-transaction/);
    for (const args of [dump, restore]) {
      expect(args.join(' ')).not.toMatch(/postgresql:\/\//);
    }
  });

  it('isCustomDumpHeader e mensagem de recusa', () => {
    expect(isCustomDumpHeader(Buffer.from('PGDMP\x01\x10'))).toBe(true);
    expect(isCustomDumpHeader(Buffer.from('-- SQL'))).toBe(false);
    const msg = remoteRestoreRefusal(maskDatabaseUrl(NEON));
    expect(msg).toMatch(/ABORTADA/);
    expect(msg).toMatch(/--yes/);
    expect(msg).not.toContain('s3nh4-secreta');
  });
});
