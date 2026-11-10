import { test as base, expect, type Page } from '@playwright/test';
import { DEMO_PRODUCTS } from '@cn/shared';

/** Simula a API (contrato da Skill, seção 4) com o catálogo compartilhado. */
export async function mockApi(page: Page) {
  await page.route('**/api/**', async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const path = url.pathname.replace(/^\/api/, '');
    const json = (body: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

    if (req.method() === 'POST' && (path === '/contact' || path === '/quotes')) {
      return json({ ok: true, id: 'e2e-id' }, 201);
    }
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

type Fixtures = { consoleErrors: string[] };

export const test = base.extend<Fixtures>({
  consoleErrors: async ({ page }, use) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
    await mockApi(page);
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
