import { test as base, expect, type Page } from '@playwright/test';
import { DEMO_PRODUCTS } from '@cn/shared';

export interface MockApiOptions {
  /**
   * Atraso da resposta dos POST (simula a API do Render acordando). Chamar
   * `mockApi` de novo num teste sobrepõe o mock automático (a rota mais nova vale).
   */
  postDelayMs?: number;
}

/** Simula a API (contrato da Skill, seção 4) com o catálogo compartilhado. */
export async function mockApi(page: Page, { postDelayMs = 0 }: MockApiOptions = {}) {
  await page.route('**/api/**', async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const path = url.pathname.replace(/^\/api/, '');
    const json = (body: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

    if (req.method() === 'POST' && (path === '/contact' || path === '/quotes')) {
      if (postDelayMs) await new Promise((r) => setTimeout(r, postDelayMs));
      return json({ ok: true, id: 'e2e-id' }, 201);
    }
    // despertador da API (wakeApi): GET /api/health
    if (path === '/health') return json({ status: 'ok', db: 'ok' });
    if (path === '/products') {
      const category = url.searchParams.get('category');
      const featured = url.searchParams.get('featured');
      return json(
        DEMO_PRODUCTS.filter(
          (p) =>
            (!category || p.category === category) &&
            (featured === null || String(p.featured) === featured),
        ),
      );
    }
    const related = path.match(/^\/products\/([^/]+)\/related$/);
    if (related) {
      const p = DEMO_PRODUCTS.find((x) => x.slug === related[1]);
      return json(
        p
          ? DEMO_PRODUCTS.filter((x) => x.category === p.category && x.slug !== p.slug).slice(0, 4)
          : [],
      );
    }
    const one = path.match(/^\/products\/([^/]+)$/);
    if (one) {
      const p = DEMO_PRODUCTS.find((x) => x.slug === one[1]);
      return p ? json(p) : json({ error: 'Produto não encontrado' }, 404);
    }
    return json({ error: 'Não encontrado' }, 404);
  });
}

type Fixtures = { consoleErrors: string[]; apiMock: void };

export const test = base.extend<Fixtures>({
  /**
   * Automático: TODO teste desta suíte usa a API simulada. Sem isto, testes que não
   * pediam `consoleErrors` batiam na API real pelo proxy do preview e o resultado
   * dependia do que estivesse rodando na máquina (API fora, lenta ou com outros dados).
   */
  apiMock: [
    async ({ page }, use) => {
      await mockApi(page);
      await use();
    },
    { auto: true },
  ],
  consoleErrors: async ({ page }, use) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
    await use(errors);
  },
});

/** Grava a escolha de cookies para o banner não cobrir a página. */
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

export { expect };
