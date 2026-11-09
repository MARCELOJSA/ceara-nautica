import { DEMO_PRODUCTS } from '@cn/shared';
import { expect, presetConsent, test } from './fixtures';

const ROUTES: { path: string; h1: RegExp }[] = [
  { path: '/', h1: /seu próximo destino começa aqui/i },
  { path: '/produtos', h1: /embarcações e produtos/i },
  { path: '/produtos?categoria=lanchas', h1: /lanchas/i },
  { path: `/produtos/${DEMO_PRODUCTS[0]!.slug}`, h1: new RegExp(DEMO_PRODUCTS[0]!.name.slice(0, 12), 'i') },
  { path: '/sobre', h1: /náutica & estaleiro em manaus/i },
  { path: '/servicos', h1: /do estaleiro ao rio/i },
  { path: '/contato', h1: /fale com a ceará náutica/i },
  { path: '/orcamento', h1: /solicite seu orçamento/i },
  { path: '/politica-de-privacidade', h1: /política de privacidade/i },
  { path: '/rota-que-nao-existe', h1: /essa rota não está no mapa/i },
];

for (const r of ROUTES) {
  test(`rota ${r.path} carrega sem erros de console`, async ({ page, consoleErrors }) => {
    await presetConsent(page);
    await page.goto(r.path);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(r.h1);
    await expect(page).toHaveTitle(/Ceará Náutica/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /^https?:\/\//);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.{40,}/);

    // percorre a página para disparar lazy loading e animações
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 500) {
        window.scrollTo(0, y);
        await new Promise((res) => setTimeout(res, 40));
      }
    });
    await page.waitForLoadState('networkidle');

    // nenhuma imagem quebrada (SmartImage troca por placeholder; aqui não deve haver nenhum)
    await expect(page.getByText('Imagem em breve')).toHaveCount(0);
    const broken = await page.$$eval('img', (imgs) =>
      imgs.filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.currentSrc || i.src),
    );
    expect(broken).toEqual([]);

    // sem rolagem horizontal
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);

    expect(consoleErrors).toEqual([]);
  });
}

test('nenhum link interno quebrado', async ({ page, consoleErrors }) => {
  test.setTimeout(120_000);
  await presetConsent(page);
  const seen = new Set<string>();
  const queue = ['/', '/produtos', '/servicos', '/sobre', '/contato', '/orcamento', '/politica-de-privacidade'];
  const visited = new Set<string>();

  while (queue.length) {
    const path = queue.shift()!;
    if (visited.has(path)) continue;
    visited.add(path);
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 }), `link quebrado: ${path}`).not.toHaveText(
      /essa rota não está no mapa/i,
    );
    const hrefs = await page.$$eval('a[href^="/"]', (as) => as.map((a) => a.getAttribute('href')!));
    for (const href of hrefs) {
      const clean = href.split('#')[0]!;
      if (!clean || seen.has(clean)) continue;
      seen.add(clean);
      // arquivos estáticos (ex.: imagens) — verifica por HTTP
      if (/\.[a-z0-9]+$/i.test(clean.split('?')[0]!)) {
        const res = await page.request.get(clean);
        expect(res.status(), clean).toBe(200);
        continue;
      }
      queue.push(clean);
    }
  }
  expect(visited.size).toBeGreaterThan(15);
  expect(consoleErrors).toEqual([]);
});

test('arquivos de SEO publicados', async ({ request }) => {
  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.status()).toBe(200);
  const xml = await sitemap.text();
  for (const p of DEMO_PRODUCTS) expect(xml).toContain(`/produtos/${p.slug}`);
  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toContain('Sitemap:');
  expect((await request.get('/favicon.svg')).status()).toBe(200);
});
