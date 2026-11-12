import type { APIRequestContext, Page } from '@playwright/test';

export const STATIC_ROUTES = [
  '/',
  '/produtos',
  '/sobre',
  '/servicos',
  '/contato',
  '/orcamento',
  '/politica-de-privacidade',
];

export const QA_MARK = 'QA-TEST';

/** Slugs reais vindos da API (não do catálogo local). */
export async function productSlugs(request: APIRequestContext): Promise<string[]> {
  // Em produção a API fica em outra origem (QA_API_URL); localmente, /api via proxy.
  const api = process.env.QA_API_URL?.replace(/\/$/, '') ?? '/api';
  const res = await request.get(`${api}/products`);
  if (!res.ok()) throw new Error(`GET ${api}/products → ${res.status()}`);
  const list = (await res.json()) as { slug: string }[];
  return list.map((p) => p.slug);
}

/** Grava a escolha de cookies (recusa) para o banner não cobrir a página. */
export async function presetConsent(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'cn_consent_v1',
      JSON.stringify({
        analytics: false,
        marketing: false,
        decidedAt: '2026-01-01T00:00:00.000Z',
        version: 1,
      }),
    );
  });
}

export type PageIssues = { console: string[]; failed: string[]; http: string[] };

/** Coleta erros de console, exceções, requisições que falharam e respostas HTTP >= 400. */
export function watchPage(page: Page): PageIssues {
  const issues: PageIssues = { console: [], failed: [], http: [] };
  page.on('console', (m) => {
    if (m.type() === 'error') issues.console.push(m.text());
  });
  page.on('pageerror', (e) => issues.console.push(`pageerror: ${e.message}`));
  page.on('requestfailed', (r) => {
    const f = r.failure()?.errorText ?? '';
    // navegação interrompida pelo próprio teste não é erro do site
    if (!/ERR_ABORTED|NS_BINDING_ABORTED/.test(f))
      issues.failed.push(`${r.method()} ${r.url()} ${f}`);
  });
  page.on('response', (r) => {
    if (r.status() >= 400) issues.http.push(`${r.status()} ${r.request().method()} ${r.url()}`);
  });
  return issues;
}

/** Rola até o fim para disparar imagens lazy e animações de entrada. */
export async function scrollThrough(page: Page) {
  await page.evaluate(async () => {
    const step = Math.max(200, Math.floor(window.innerHeight * 0.8));
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
  });
}
