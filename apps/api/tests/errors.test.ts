import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';
import { hashIp, isHoneypotFilled, truncateUserAgent } from '../src/lib/leads.js';
import { PROD_ENV, testConfig } from './helpers.js';
import type { PrismaClient } from '@prisma/client';

/** Prisma falso que sempre falha, para exercitar o handler de erro 500. */
const brokenPrisma = new Proxy(
  {},
  {
    get: () =>
      new Proxy(() => {}, {
        get: () => () => Promise.reject(new Error('detalhe interno secreto')),
        apply: () => Promise.reject(new Error('detalhe interno secreto')),
      }),
  },
) as unknown as PrismaClient;

describe('handler de erros', () => {
  it('em produção não vaza mensagem nem stack', async () => {
    const config = testConfig(PROD_ENV);
    const app = createApp({ config, prisma: brokenPrisma });
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Erro interno do servidor.' });
    expect(res.text).not.toContain('secreto');
    expect(res.text).not.toMatch(/at .*\.ts/);
  });

  it('health informa db=error quando o banco falha', async () => {
    const app = createApp({ config: testConfig(), prisma: brokenPrisma });
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', db: 'error' });
  });
});

describe('config', () => {
  it('exige IP_HASH_SALT forte em produção', () => {
    expect(() =>
      loadConfig({ NODE_ENV: 'production', DATABASE_URL: 'postgresql://x', IP_HASH_SALT: '' }),
    ).toThrow(/IP_HASH_SALT/);
  });

  it('usa origens padrão de dev quando WEB_ORIGIN está vazio', () => {
    const c = loadConfig({ DATABASE_URL: 'postgresql://x' });
    expect(c.webOrigins).toEqual(['http://localhost:5173', 'http://localhost:4173']);
    expect(c.port).toBe(3333);
    expect(c.trustProxy).toBe(false);
    expect(c.leadWebhook.url).toBeUndefined();
  });

  it('interpreta TRUST_PROXY', () => {
    expect(loadConfig({ DATABASE_URL: 'x', TRUST_PROXY: '1' }).trustProxy).toBe(1);
    expect(() => loadConfig({ DATABASE_URL: 'x', TRUST_PROXY: 'true' })).toThrow(
      /TRUST_PROXY=true/,
    );
    expect(loadConfig({ DATABASE_URL: 'x', TRUST_PROXY: 'loopback' }).trustProxy).toBe('loopback');
  });
});

describe('utilitários de lead', () => {
  it('hashIp é determinístico e não contém o IP', () => {
    const h = hashIp('203.0.113.10', 's');
    expect(h).toMatch(/^[a-f0-9]{64}$/);
    expect(h).toBe(hashIp('203.0.113.10', 's'));
    expect(h).not.toBe(hashIp('203.0.113.10', 'outro-salt'));
    expect(hashIp(undefined, 's')).toBeNull();
  });

  it('truncateUserAgent', () => {
    expect(truncateUserAgent('a'.repeat(500))).toHaveLength(300);
    expect(truncateUserAgent(undefined)).toBeNull();
  });

  it('isHoneypotFilled', () => {
    expect(isHoneypotFilled({ website: '' })).toBe(false);
    expect(isHoneypotFilled({ website: '   ' })).toBe(true);
    expect(isHoneypotFilled({})).toBe(false);
    expect(isHoneypotFilled({ website: 'x' })).toBe(true);
    expect(isHoneypotFilled({ website: 1 })).toBe(true);
    expect(isHoneypotFilled(null)).toBe(false);
  });
});
