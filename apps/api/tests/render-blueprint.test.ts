/**
 * Blueprint do Render (render.yaml na raiz): serviços, segredos fora do arquivo, coerência
 * entre as URLs e cabeçalhos de segurança/cache do site (SEC-04).
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { loadConfig } from '../src/config.js';
import { makeApp } from './helpers.js';

type EnvVar = { key: string; value?: string | number; sync?: boolean; generateValue?: boolean };
type Header = { path: string; name: string; value: string };
type Route = { type: string; source: string; destination: string };
type Service = {
  type: string;
  name: string;
  runtime: string;
  plan?: string;
  region?: string;
  buildCommand: string;
  startCommand?: string;
  preDeployCommand?: string;
  healthCheckPath?: string;
  staticPublishPath?: string;
  envVars: EnvVar[];
  headers?: Header[];
  routes?: Route[];
};

const repoRoot = fileURLToPath(new URL('../../../', import.meta.url));
const blueprint = parse(readFileSync(`${repoRoot}render.yaml`, 'utf8')) as { services: Service[] };

const API = 'ceara-nautica-api';
const SITE = 'ceara-nautica-site';
const service = (name: string): Service => {
  const s = blueprint.services.find((x) => x.name === name);
  if (!s) throw new Error(`serviço ${name} ausente no render.yaml`);
  return s;
};
const api = service(API);
const site = service(SITE);

const envOf = (s: Service, key: string): EnvVar | undefined => s.envVars.find((e) => e.key === key);
const valueOf = (s: Service, key: string): string => {
  const v = envOf(s, key)?.value;
  if (v === undefined) throw new Error(`${s.name}: ${key} sem valor`);
  return String(v);
};

const headersAt = (path: string, name: string): string[] =>
  (site.headers ?? [])
    .filter((h) => h.path === path && h.name.toLowerCase() === name.toLowerCase())
    .map((h) => h.value);

/** CSP → mapa diretiva → fontes. */
function parseCsp(csp: string): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const part of csp.split(';')) {
    const [name, ...sources] = part.trim().split(/\s+/);
    if (name) map.set(name.toLowerCase(), sources);
  }
  return map;
}

describe('render.yaml — serviços', () => {
  it('tem exatamente a API (node) e o site (static), ambos type web', () => {
    expect(blueprint.services.map((s) => s.name).sort()).toEqual([API, SITE]);
    expect(api).toMatchObject({ type: 'web', runtime: 'node' });
    expect(site).toMatchObject({ type: 'web', runtime: 'static' });
  });

  it('API: plano free na região virginia, com health check', () => {
    expect(api.plan).toBe('free');
    expect(api.region).toBe('virginia');
    expect(api.healthCheckPath).toBe('/api/health');
  });

  it('API: build instala devDependencies e migrações rodam antes de subir (free não tem preDeploy)', () => {
    expect(api.buildCommand).toMatch(/npm ci --include=dev/);
    expect(api.buildCommand).toMatch(/npm run -w apps\/api build/);
    expect(api.preDeployCommand).toBeUndefined();
    const start = api.startCommand ?? '';
    const migrate = start.indexOf('db:deploy');
    const run = start.indexOf('node apps/api/dist/server.js');
    expect(migrate).toBeGreaterThanOrEqual(0);
    expect(run).toBeGreaterThan(migrate);
    expect(start).toMatch(/&& exec node /); // node recebe o SIGTERM diretamente
  });

  it('site: build do monorepo, publica apps/web/dist e reescreve rotas da SPA', () => {
    expect(site.buildCommand).toMatch(/npm ci --include=dev/);
    expect(site.buildCommand).toMatch(/npm run -w apps\/web build/);
    expect(site.staticPublishPath).toBe('apps/web/dist');
    expect(site.routes).toContainEqual({
      type: 'rewrite',
      source: '/*',
      destination: '/index.html',
    });
  });

  it('Node 22 nos dois serviços', () => {
    for (const s of [api, site]) expect(valueOf(s, 'NODE_VERSION')).toMatch(/^22\.\d+\.\d+$/);
  });
});

describe('render.yaml — variáveis e segredos', () => {
  it('segredos não ficam no arquivo', () => {
    expect(envOf(api, 'DATABASE_URL')).toEqual({ key: 'DATABASE_URL', sync: false });
    expect(envOf(api, 'LEAD_WEBHOOK_URL')).toEqual({ key: 'LEAD_WEBHOOK_URL', sync: false });
    expect(envOf(api, 'IP_HASH_SALT')).toEqual({ key: 'IP_HASH_SALT', generateValue: true });
    const raw = readFileSync(`${repoRoot}render.yaml`, 'utf8');
    expect(raw).not.toMatch(/postgres(ql)?:\/\/[^\s"']+@/);
    for (const s of [api, site]) {
      for (const e of s.envVars) {
        if (/(SECRET|PASSWORD|TOKEN|SALT|_KEY|_URL)$/.test(e.key) && !/^VITE_/.test(e.key)) {
          expect(e.value, `${s.name}: ${e.key}`).toBeUndefined();
        }
      }
    }
  });

  it('a API sobe em produção com as variáveis do Blueprint (+ segredos do painel)', () => {
    const env: NodeJS.ProcessEnv = {};
    for (const e of api.envVars) if (e.value !== undefined) env[e.key] = String(e.value);
    env.DATABASE_URL =
      'postgresql://u:p@ep-x.us-east-1.aws.neon.tech/neondb?sslmode=require&sslaccept=strict';
    env.IP_HASH_SALT = 'B0jrphAPOY7pg92AN0c9MN4yecczLMdwnx4OkA1KFUk='; // formato do generateValue
    const config = loadConfig(env);
    expect(config.isProduction).toBe(true);
    expect(config.rateLimit).toEqual({ windowMs: 60_000, max: 5, disabled: false });
    expect(config.trustProxy).toBe(3);
  });

  it('URLs coerentes: WEB_ORIGIN = origem do site; VITE_API_URL = URL pública da API + /api', () => {
    const siteUrl = valueOf(site, 'VITE_SITE_URL');
    const apiUrl = valueOf(site, 'VITE_API_URL');
    expect(siteUrl).toBe(`https://${SITE}.onrender.com`);
    expect(apiUrl).toBe(`https://${API}.onrender.com/api`);
    const origins = valueOf(api, 'WEB_ORIGIN').split(',');
    expect(origins).toContain(new URL(siteUrl).origin);
    for (const o of origins) expect(o).toMatch(/^https:\/\/[^/]+$/);
  });
});

describe('render.yaml — cabeçalhos do site (SEC-04)', () => {
  const single = (name: string) => {
    const values = headersAt('/*', name);
    expect(values, name).toHaveLength(1);
    return values[0]!;
  };

  it('CSP restritiva: sem unsafe-inline/eval em script-src; connect-src com a origem da API', () => {
    const csp = parseCsp(single('Content-Security-Policy'));
    expect(csp.get('default-src')).toEqual(["'self'"]);
    const scriptSrc = csp.get('script-src') ?? csp.get('default-src')!;
    expect(scriptSrc).not.toContain("'unsafe-inline'");
    expect(scriptSrc).not.toContain("'unsafe-eval'");
    expect([...csp.values()].flat()).not.toContain("'unsafe-eval'");
    expect(csp.get('style-src')).not.toContain("'unsafe-inline'");
    expect(csp.get('frame-ancestors')).toEqual(["'none'"]);
    expect(csp.get('object-src')).toEqual(["'none'"]);
    expect(csp.get('base-uri')).toEqual(["'self'"]);
    expect(csp.get('connect-src')).toContain(new URL(valueOf(site, 'VITE_API_URL')).origin);
  });

  it('HSTS, nosniff, X-Frame-Options, Referrer-Policy e Permissions-Policy', () => {
    const hsts = single('Strict-Transport-Security');
    expect(Number(/max-age=(\d+)/.exec(hsts)?.[1])).toBeGreaterThanOrEqual(31_536_000);
    expect(single('X-Content-Type-Options')).toBe('nosniff');
    expect(single('X-Frame-Options')).toBe('DENY');
    expect(single('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    expect(single('Permissions-Policy')).toMatch(/camera=\(\).*microphone=\(\).*geolocation=\(\)/);
  });

  it('cache: /assets/* imutável por 1 ano; HTML sem cache; nenhum Cache-Control em /*', () => {
    expect(headersAt('/assets/*', 'Cache-Control')).toEqual([
      'public, max-age=31536000, immutable',
    ]);
    expect(headersAt('/', 'Cache-Control')).toEqual(['no-cache']);
    expect(headersAt('/index.html', 'Cache-Control')).toEqual(['no-cache']);
    // Uma regra em /* também casaria com /assets/* e somaria dois Cache-Control.
    expect(headersAt('/*', 'Cache-Control')).toEqual([]);
  });

  it('toda rota do React Router tem regra no-cache (o HTML delas é o index.html)', () => {
    const appTsx = readFileSync(`${repoRoot}apps/web/src/App.tsx`, 'utf8');
    const paths = [...appTsx.matchAll(/<Route\s+path="([^"]+)"/g)]
      .map((m) => m[1]!)
      .filter((p) => p !== '*');
    expect(paths.length).toBeGreaterThan(0);
    for (const p of paths) {
      const renderPath = `/${p.replace(/\/:[^/]+.*$/, '/*')}`;
      expect(headersAt(renderPath, 'Cache-Control'), renderPath).toEqual(['no-cache']);
    }
  });
});

describe('TRUST_PROXY do Blueprint com a cadeia de proxies do Render', () => {
  // X-Forwarded-For medido no Render: "<forjado…>, <cliente>, <borda Cloudflare>, <10.x Render>";
  // o socket é o proxy interno do Render (aqui, o 127.0.0.1 do supertest).
  const renderXff = (spoofed: string, client: string) =>
    `${spoofed}, ${client}, 172.71.10.20, 10.214.3.7`;

  it('o rate limit usa o IP real do visitante: forjar X-Forwarded-For não contorna', async () => {
    const app = makeApp({
      NODE_ENV: 'production',
      IP_HASH_SALT: 'salt-forte-de-teste-0123456789',
      RATE_LIMIT_DISABLED: 'false',
      RATE_LIMIT_MAX: '5',
      TRUST_PROXY: valueOf(api, 'TRUST_PROXY'),
    });
    const post = (xff: string) =>
      request(app).post('/api/contact').set('X-Forwarded-For', xff).send({});

    const statuses: number[] = [];
    for (let i = 0; i < 6; i++)
      statuses.push((await post(renderXff(`198.51.100.${i}`, '203.0.113.9'))).status);
    expect(statuses.slice(0, 5).every((s) => s === 400)).toBe(true);
    expect(statuses[5]).toBe(429);

    // Outro visitante atrás da MESMA borda Cloudflare não é bloqueado (limite por cliente).
    expect((await post(renderXff('198.51.100.99', '203.0.113.50'))).status).toBe(400);
  });
});
