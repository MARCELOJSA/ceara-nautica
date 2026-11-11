/**
 * AGENT 03 — Security QA: rate limit (A04/A07), erros sem stack trace (A05/A09),
 * configuração de produção (A05) e exposição de dados (A02).
 * Nenhum teste aqui grava leads (só corpos inválidos ou honeypot).
 */
import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { loadConfig } from '../../src/config.js';
import type { PrismaClient } from '@prisma/client';
import { createApp } from '../../src/app.js';
import { makeApp, PROD_ENV, testConfig } from '../helpers.js';

const limited = (env: Record<string, string> = {}) =>
  makeApp({
    RATE_LIMIT_DISABLED: 'false',
    RATE_LIMIT_MAX: '5',
    RATE_LIMIT_WINDOW_MS: '60000',
    ...env,
  });

describe('rate limit dos POST (5/min por IP)', () => {
  it('6ª requisição → 429 JSON com headers RateLimit (draft-7)', async () => {
    const app = limited();
    const statuses: number[] = [];
    for (let i = 0; i < 6; i++) {
      const r = await request(app).post('/api/contact').send({});
      statuses.push(r.status);
      if (i === 5) {
        expect(r.body).toEqual({
          error: 'Muitas requisições. Aguarde um instante e tente novamente.',
        });
        expect(r.headers['ratelimit-policy'] ?? r.headers.ratelimit).toBeDefined();
        expect(r.headers['retry-after']).toBeDefined();
      }
    }
    expect(statuses).toEqual([400, 400, 400, 400, 400, 429]);
  });

  it('contact e quotes compartilham o mesmo contador por IP', async () => {
    const app = limited();
    for (let i = 0; i < 5; i++)
      await request(app)
        .post(i % 2 ? '/api/contact' : '/api/quotes')
        .send({});
    expect((await request(app).post('/api/quotes').send({})).status).toBe(429);
  });

  it('JSON malformado e corpo gigante também contam no limite', async () => {
    const app = limited();
    for (let i = 0; i < 5; i++) {
      await request(app).post('/api/contact').set('Content-Type', 'application/json').send('{bad');
    }
    const r = await request(app)
      .post('/api/contact')
      .send({ message: 'x'.repeat(30_000) });
    expect(r.status).toBe(429);
  });

  it('variações de caminho (maiúsculas, barra final) não contornam o limite', async () => {
    const app = limited();
    const paths = [
      '/api/contact',
      '/API/CONTACT',
      '/api/contact/',
      '/api/Contact',
      '/api/contact',
      '/Api/Contact/',
    ];
    const statuses: number[] = [];
    for (const p of paths) statuses.push((await request(app).post(p).send({})).status);
    expect(statuses.filter((s) => s === 429)).toHaveLength(1);
    expect(statuses[5]).toBe(429);
  });

  it('caminhos alternativos que contornam o limiter não chegam ao handler de lead', async () => {
    const app = limited();
    for (const p of ['/api//contact', '/api/./contact', '/api/contact%2F', '/api/%63ontact']) {
      const r = await request(app).post(p).send({});
      // Se cair no handler, a resposta seria 400 com details de validação.
      if (r.status === 400) expect(r.body.details).toBeUndefined();
    }
  });

  it('X-Forwarded-For falso NÃO contorna o limite com TRUST_PROXY=0 (padrão)', async () => {
    const app = limited({ TRUST_PROXY: '0' });
    const statuses: number[] = [];
    for (let i = 0; i < 6; i++) {
      statuses.push(
        (await request(app).post('/api/contact').set('X-Forwarded-For', `10.0.0.${i}`).send({}))
          .status,
      );
    }
    expect(statuses[5]).toBe(429);
  });

  it('[SEC-05 corrigido] TRUST_PROXY=true é recusado (permitiria forjar X-Forwarded-For)', () => {
    expect(() => limited({ TRUST_PROXY: 'true' })).toThrow(/TRUST_PROXY=true/);
    expect(() => limited({ TRUST_PROXY: ' TRUE ' })).toThrow(/TRUST_PROXY=true/);
  });

  it('com TRUST_PROXY=1 o IP usado é o último hop: prefixar XFF não contorna', async () => {
    const app = limited({ TRUST_PROXY: '1' });
    const statuses: number[] = [];
    for (let i = 0; i < 6; i++) {
      // supertest conecta de 127.0.0.1 → o "cliente" é o último IP da lista
      statuses.push(
        (
          await request(app)
            .post('/api/contact')
            .set('X-Forwarded-For', `198.51.100.${i}, 192.0.2.1`)
            .send({})
        ).status,
      );
    }
    expect(statuses[5]).toBe(429);
  });

  it('[SEC-06] GETs não têm rate limit na API (scraping/DoS fica a cargo do proxy/CDN)', async () => {
    const app = limited();
    const statuses: number[] = [];
    for (let i = 0; i < 20; i++) statuses.push((await request(app).get('/api/health')).status);
    expect(statuses.every((s) => s === 200)).toBe(true);
  });
});

describe('erros sem stack trace / sem enumeração', () => {
  const prod = makeApp(PROD_ENV);

  it.each([
    ['GET', '/api/nao-existe'],
    ['GET', '/'],
    ['GET', '/.env'],
    ['GET', '/api/../.env'],
    ['GET', '/api/products/%E0%A4%A'], // URI malformada
    ['POST', '/api/health'],
  ])('%s %s → 4xx JSON genérico, sem stack/caminho', async (method, path) => {
    const res =
      method === 'GET' ? await request(prod).get(path) : await request(prod).post(path).send({});
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.text).not.toMatch(/at .*\.(ts|js):\d+|node_modules|C:\\|\/home\//);
    expect(res.text).not.toMatch(/DATABASE_URL|cearanautica_dev/);
  });

  it('erro 500 em produção é genérico', async () => {
    // Prisma falso que falha com detalhes internos na mensagem: nada disso pode vazar.
    const failing = new Proxy({} as PrismaClient, {
      get: () =>
        new Proxy(
          {},
          {
            get: () => async () => {
              throw new Error(
                'prisma.product.findMany() src/routes/catalog.ts 22021 cearanautica_dev',
              );
            },
          },
        ),
    });
    const app = createApp({
      config: testConfig(PROD_ENV),
      prisma: failing,
    });
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Erro interno do servidor.' });
    expect(res.text).not.toMatch(/prisma|catalog\.ts|22021|cearanautica_dev/i);
  });

  it('health não expõe versão, host nem string de conexão', async () => {
    const res = await request(prod).get('/api/health');
    expect(Object.keys(res.body).sort()).toEqual(['db', 'status']);
    expect(res.headers['cache-control']).toBe('no-store');
  });
});

describe('configuração de produção', () => {
  const base = {
    DATABASE_URL: 'postgresql://u:p@localhost:5433/x',
    NODE_ENV: 'production',
  } as NodeJS.ProcessEnv;

  it('recusa subir em produção sem IP_HASH_SALT ou com o valor de exemplo', () => {
    expect(() => loadConfig({ ...base })).toThrow(/IP_HASH_SALT/);
    expect(() => loadConfig({ ...base, IP_HASH_SALT: 'troque-este-valor' })).toThrow(
      /IP_HASH_SALT/,
    );
  });

  const ok = { ...base, IP_HASH_SALT: 'x'.repeat(32), WEB_ORIGIN: 'https://www.exemplo.com.br' };

  it('[SEC-07 corrigido] produção recusa salt curto', () => {
    expect(() => loadConfig({ ...ok, IP_HASH_SALT: 'a' })).toThrow(/IP_HASH_SALT/);
    expect(() => loadConfig({ ...ok, IP_HASH_SALT: 'x'.repeat(15) })).toThrow(/IP_HASH_SALT/);
  });

  it('[SEC-07 corrigido] produção recusa RATE_LIMIT_DISABLED=true', () => {
    expect(() => loadConfig({ ...ok, RATE_LIMIT_DISABLED: 'true' })).toThrow(/RATE_LIMIT_DISABLED/);
  });

  it('[SEC-07 corrigido] produção exige WEB_ORIGIN explícito (sem cair no padrão localhost)', () => {
    expect(() => loadConfig({ ...ok, WEB_ORIGIN: '' })).toThrow(/WEB_ORIGIN/);
    expect(() => loadConfig({ ...ok, WEB_ORIGIN: undefined })).toThrow(/WEB_ORIGIN/);
  });

  it('produção com configuração completa sobe normalmente', () => {
    const cfg = loadConfig(ok);
    expect(cfg.webOrigins).toEqual(['https://www.exemplo.com.br']);
    expect(cfg.rateLimit.disabled).toBe(false);
  });
});
