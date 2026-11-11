/**
 * AGENT 03 — simulação de produção (Render): site e API em ORIGENS DIFERENTES,
 * CSP do render.yaml, CORS real e API "dormindo".
 *
 * Só roda com QA_API_URL (URL pública da API, a mesma do VITE_API_URL do build):
 *   QA_BASE_URL=http://localhost:4196 QA_API_URL=http://localhost:3398/api \
 *   QA_PROXY_CONTROL=http://127.0.0.1:3397 \
 *   npx playwright test -c e2e/qa/playwright.qa.config.ts production --workers=1
 *
 * - QA_PROXY_CONTROL (opcional): proxy local que segura as requisições como o Render
 *   faz enquanto a API acorda (GET /sleep?ms=, /stats, /reset). Sem ele, o teste de
 *   "API dormindo" é pulado.
 * - Grava leads REAIS com "QA-TEST" (apagar depois). O rate limit da API é 5 POST/min
 *   por IP: rode este arquivo sozinho (5 envios reais no total).
 */
import { execFileSync } from 'node:child_process';
import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { QA_MARK, STATIC_ROUTES, presetConsent } from './qa-helpers';

const API = process.env.QA_API_URL?.replace(/\/$/, '');
const CONTROL = process.env.QA_PROXY_CONTROL;
const apiOrigin = API ? new URL(API).origin : '';

test.describe.configure({ mode: 'serial' });
test.skip(!API, 'defina QA_API_URL (URL pública da API do build)');

function dbCount(table: string, name: string): number | null {
  try {
    const out = execFileSync(
      'docker',
      [
        'exec',
        'ceara-nautica-db',
        'sh',
        '-c',
        `psql -U "$POSTGRES_USER" -d cearanautica -t -A -c "select count(*) from ${table} where name = '${name}'"`,
      ],
      { encoding: 'utf8', timeout: 20_000 },
    );
    return Number(out.trim());
  } catch {
    return null;
  }
}

interface Watch {
  csp: string[];
  console: string[];
  sameOriginApi: string[];
  apiCalls: string[];
}

/** Escuta violações de CSP (evento + console) e de onde o site chama a API. */
async function watch(context: BrowserContext, page: Page): Promise<Watch> {
  const w: Watch = { csp: [], console: [], sameOriginApi: [], apiCalls: [] };
  await context.exposeBinding('__qaCsp', (_src, v: string) => {
    w.csp.push(v);
  });
  await context.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (e) => {
      (window as unknown as { __qaCsp: (v: string) => void }).__qaCsp(
        `${e.violatedDirective} ${e.blockedURI} @ ${location.pathname}`,
      );
    });
  });
  page.on('console', (m) => {
    const t = m.text();
    if (m.type() === 'error' || /content security policy|refused to/i.test(t))
      w.console.push(`${m.type()}: ${t.slice(0, 200)}`);
  });
  page.on('pageerror', (e) => w.console.push(`pageerror: ${e.message}`));
  page.on('request', (r) => {
    const u = new URL(r.url());
    if (u.origin === apiOrigin) w.apiCalls.push(`${r.method()} ${u.pathname}`);
    else if (u.pathname.startsWith('/api/')) w.sameOriginApi.push(`${r.method()} ${r.url()}`);
  });
  return w;
}

test('CSP: zero violações em todas as rotas, produtos e interações (inclui envio real)', async ({
  browser,
}) => {
  test.setTimeout(300_000);
  const products = (await (await fetch(`${API}/products`)).json()) as { slug: string }[];
  expect(products.length).toBe(11);

  // 1) primeira visita: banner de cookies (recusar), depois aceitar via preferências
  const fresh = await browser.newContext();
  const fp = await fresh.newPage();
  const wf = await watch(fresh, fp);
  await fp.goto('/', { waitUntil: 'networkidle' });
  await fp
    .getByTestId('cookie-banner')
    .getByRole('button', { name: /recusar/i })
    .click();
  await fp.goto('/politica-de-privacidade', { waitUntil: 'networkidle' });
  await fp.getByRole('button', { name: /abrir preferências de cookies/i }).click();
  await fp
    .getByTestId('cookie-banner')
    .getByRole('button', { name: /salvar|aceitar/i })
    .first()
    .click();
  await fresh.close();

  // 2) desktop: todas as rotas e produtos, lightbox, FAQ, formulários com erro e envio real
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await presetConsent(page);
  const w = await watch(ctx, page);
  for (const path of [...STATIC_ROUTES, '/nao-existe', '/produtos?q=canoa 6&categoria=canoas']) {
    await page.goto(path, { waitUntil: 'networkidle' });
  }
  for (const p of products) {
    await page.goto(`/produtos/${p.slug}`, { waitUntil: 'networkidle' });
    const ampliar = page.getByRole('button', { name: /ampliar/i });
    if (await ampliar.count()) {
      await ampliar.click();
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('Escape');
    }
    const faq = page.locator('details summary').first();
    if (await faq.count()) await faq.click();
  }
  await page.goto('/servicos', { waitUntil: 'networkidle' });
  await page.locator('details summary').first().click();

  // formulários com erro
  await page.goto('/contato', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /enviar mensagem/i }).click();
  await expect(page.getByText('Informe seu nome.')).toBeVisible();
  await page.goto('/orcamento', { waitUntil: 'networkidle' });
  await page.locator('form[aria-label="Formulário de orçamento"] button[type="submit"]').click();
  await expect(page.getByText('Informe seu nome.')).toBeVisible();

  // envio real (contato e orçamento) — CORS entre 4196 e a API
  const contactName = `${QA_MARK} prod CSP contato ${Date.now()}`;
  await page.goto('/contato', { waitUntil: 'networkidle' });
  await page.getByLabel(/^nome/i).fill(contactName);
  await page.getByLabel(/telefone/i).fill('(92) 98888-7777');
  await page.getByLabel(/^assunto/i).fill('Teste de produção');
  await page
    .getByLabel(/^mensagem/i)
    .fill('Mensagem automática do QA (simulação do Render). Pode apagar.');
  await page.getByRole('checkbox', { name: /autorizo/i }).check();
  const [cRes] = await Promise.all([
    page.waitForResponse((r) => r.url() === `${API}/contact` && r.request().method() === 'POST'),
    page.getByRole('button', { name: /enviar mensagem/i }).click(),
  ]);
  expect(cRes.status()).toBe(201);
  expect(cRes.headers()['access-control-allow-origin']).toBe(new URL(page.url()).origin);
  await expect(page.getByRole('heading', { name: /mensagem enviada/i })).toBeVisible();

  const quoteName = `${QA_MARK} prod CSP orçamento ${Date.now()}`;
  await page.goto('/orcamento?servico=motor-revisao', { waitUntil: 'networkidle' });
  await page.getByLabel(/^nome/i).fill(quoteName);
  await page.getByLabel(/telefone/i).fill('92 9 8888 7777');
  await page
    .getByLabel(/conte o que você precisa/i)
    .fill('Motor 40 hp falhando. Teste automático do QA, pode apagar.');
  await page.getByRole('checkbox', { name: /autorizo/i }).check();
  const [qRes] = await Promise.all([
    page.waitForResponse((r) => r.url() === `${API}/quotes` && r.request().method() === 'POST'),
    page.locator('form[aria-label="Formulário de orçamento"] button[type="submit"]').click(),
  ]);
  expect(qRes.status()).toBe(201);
  await expect(page.getByRole('heading', { name: /orçamento enviado/i })).toBeVisible();
  await ctx.close();

  // 3) celular: menu, barra inferior, lightbox por toque
  const m = await browser.newContext({
    viewport: { width: 360, height: 740 },
    hasTouch: true,
    isMobile: true,
  });
  const mp = await m.newPage();
  await presetConsent(mp);
  const wm = await watch(m, mp);
  await mp.goto('/', { waitUntil: 'networkidle' });
  await mp.getByRole('button', { name: /abrir menu/i }).click();
  await mp.keyboard.press('Escape');
  await mp.goto('/produtos/canoa-aluminio-7m', { waitUntil: 'networkidle' });
  await mp.getByRole('button', { name: /ampliar/i }).tap();
  await mp.keyboard.press('Escape');
  await m.close();

  const all = {
    csp: [...wf.csp, ...w.csp, ...wm.csp],
    console: [...wf.console, ...w.console, ...wm.console],
    sameOriginApi: [...wf.sameOriginApi, ...w.sameOriginApi, ...wm.sameOriginApi],
  };
  test.info().annotations.push({
    type: 'chamadas à API (origem da API)',
    description: [...new Set(w.apiCalls)].join(', '),
  });
  expect(all).toEqual({ csp: [], console: [], sameOriginApi: [] });
  expect(w.apiCalls.some((c) => c.startsWith('GET /api/products'))).toBe(true);
  expect(w.apiCalls).toContain('POST /api/contact');
  expect(w.apiCalls).toContain('POST /api/quotes');

  const c = dbCount('contact_messages', contactName);
  const q = dbCount('quote_requests', quoteName);
  test.skip(c === null || q === null, 'Docker indisponível para conferir o banco');
  expect({ c, q }).toEqual({ c: 1, q: 1 });
});

test('CORS: origem não autorizada é recusada pelo navegador e não grava', async ({
  browser,
  baseURL,
}) => {
  // mesma página servida por outra origem (127.0.0.1 ≠ localhost): não está em WEB_ORIGIN
  const other = baseURL!.replace('localhost', '127.0.0.1');
  test.skip(other === baseURL, 'baseURL precisa usar "localhost"');
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(`${other}/politica-de-privacidade`, { waitUntil: 'networkidle' });
  const name = `${QA_MARK} prod CORS negado ${Date.now()}`;
  const result = await page.evaluate(
    async ({ api, name }) => {
      try {
        const r = await fetch(`${api}/contact`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            phone: '(92) 98888-7777',
            subject: 'CORS',
            message: 'Não deveria ser gravado.',
            consent: true,
          }),
        });
        return `status ${r.status}`;
      } catch (e) {
        return `bloqueado: ${(e as Error).name}`;
      }
    },
    { api: API!, name },
  );
  expect(result).toMatch(/^bloqueado/);
  // preflight direto: sem Access-Control-Allow-Origin para a origem estranha
  const pre = await fetch(`${API}/contact`, {
    method: 'OPTIONS',
    headers: { Origin: 'https://evil.example', 'Access-Control-Request-Method': 'POST' },
  });
  expect(pre.headers.get('access-control-allow-origin')).toBeNull();
  const n = dbCount('contact_messages', name);
  if (n !== null) expect(n).toBe(0);
  await ctx.close();
});

test('API "dormindo": aviso "Conectando…", sucesso e um único POST/lead', async ({ page }) => {
  test.skip(!CONTROL, 'defina QA_PROXY_CONTROL (proxy que simula o sono da API)');
  test.setTimeout(180_000);
  await presetConsent(page);
  await fetch(`${CONTROL}/reset`);
  // a API "dorme": tudo que chegar nos próximos 25 s fica retido (como o Render ao acordar)
  await fetch(`${CONTROL}/sleep?ms=25000`);
  const started = Date.now();
  await page.goto('/orcamento?produto=lancha-aluminio-10m');
  // catálogo cai no fallback local depois de 8 s; o formulário aparece
  await expect(page.getByLabel(/^nome/i)).toBeVisible({ timeout: 20_000 });
  const name = `${QA_MARK} prod API dormindo ${Date.now()}`;
  await page.getByLabel(/^nome/i).fill(name);
  await page.getByLabel(/telefone/i).fill('(92) 98888-7777');
  await page
    .getByLabel(/conte o que você precisa/i)
    .fill('Teste da API dormindo (QA). Pode apagar.');
  await page.getByRole('checkbox', { name: /autorizo/i }).check();
  const submit = page.locator('form[aria-label="Formulário de orçamento"] button[type="submit"]');
  await submit.click();
  await expect(submit).toBeDisabled();
  await expect(page.getByTestId('submit-slow')).toContainText(/conectando ao servidor/i, {
    timeout: 10_000,
  });
  // cliques extras durante a espera não geram outro POST
  await submit.click({ force: true }).catch(() => {});
  await expect(page.getByRole('heading', { name: /orçamento enviado/i })).toBeVisible({
    timeout: 90_000,
  });
  const elapsed = Date.now() - started;
  const stats = (await (await fetch(`${CONTROL}/stats`)).json()) as {
    held: number;
    posts: { path: string; origin: string | null }[];
  };
  test.info().annotations.push({
    type: 'API dormindo',
    description: `sucesso após ${Math.round(elapsed / 1000)} s; requisições retidas: ${stats.held}`,
  });
  expect(stats.held).toBeGreaterThan(0);
  expect(stats.posts.filter((p) => p.path === '/api/quotes')).toHaveLength(1);
  const n = dbCount('quote_requests', name);
  if (n !== null) expect(n).toBe(1);
});
