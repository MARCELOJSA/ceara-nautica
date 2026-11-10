/**
 * AGENT 03 — XSS (refletido via URL e "armazenado" via dados de produto/JSON-LD)
 * e consentimento de cookies (nenhum terceiro antes do aceite).
 */
import { expect, test, type Page } from '@playwright/test';
import { STATIC_ROUTES, presetConsent, productSlugs } from './qa-helpers';

const PAYLOAD = `"'><img src=x onerror="window.__xss=1"><script>window.__xss=2</script><svg onload=window.__xss=3>`;

async function armXssTrap(page: Page) {
  const dialogs: string[] = [];
  page.on('dialog', async (d) => {
    dialogs.push(d.message());
    await d.dismiss();
  });
  return {
    dialogs,
    async fired() {
      return page.evaluate(() => (window as unknown as { __xss?: number }).__xss ?? null);
    },
  };
}

test.describe('XSS refletido (parâmetros de URL)', () => {
  const enc = encodeURIComponent(PAYLOAD);
  const urls = [
    `/produtos?q=${enc}`,
    `/produtos?categoria=${enc}`,
    `/orcamento?produto=${enc}`,
    `/orcamento?categoria=${enc}`,
    `/contato?assunto=${enc}`,
    `/produtos/${enc}`,
    `/${enc}`,
    `/?utm_source=${enc}&utm_campaign=${enc}`,
    `/produtos#${enc}`,
  ];
  for (const url of urls) {
    test(`não executa script: ${url.slice(0, 40)}…`, async ({ page }) => {
      await presetConsent(page);
      const trap = await armXssTrap(page);
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.waitForTimeout(300);
      expect(await trap.fired()).toBeNull();
      expect(trap.dialogs).toEqual([]);
      // nenhum <img onerror>/<svg onload> injetado no DOM
      expect(
        await page.locator('img[onerror], svg[onload], script:not([type]):not([src])').count(),
      ).toBe(0);
    });
  }

  test('javascript: em ?produto= não vira href', async ({ page }) => {
    await presetConsent(page);
    await page.goto('/orcamento?produto=javascript:alert(1)', { waitUntil: 'networkidle' });
    expect(await page.locator('a[href^="javascript:"]').count()).toBe(0);
  });
});

test.describe('XSS via dados de produto vindos da API/banco (JSON-LD, meta, DOM)', () => {
  test('produto com <script> no nome/descrição/specs não executa e não quebra o JSON-LD', async ({
    page,
    request,
  }) => {
    const [slug] = await productSlugs(request);
    const real = await (await request.get(`/api/products/${slug}`)).json();
    const evil = {
      ...real,
      name: `QA </script><script>window.__xss=10</script> ${PAYLOAD}`,
      shortDescription: `</script><img src=x onerror=window.__xss=11> ${PAYLOAD}`,
      description: `${PAYLOAD}\n<iframe src="javascript:window.__xss=12"></iframe>`,
      features: [PAYLOAD],
      specs: [{ label: PAYLOAD, value: '</script><script>window.__xss=13</script>' }],
      images: real.images.map((i: { src: string }) => ({ ...i, alt: PAYLOAD })),
      source: `<a href="javascript:window.__xss=14">x</a>`,
      availability: PAYLOAD,
    };
    await page.route(`**/api/products/${slug}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(evil) }),
    );
    await presetConsent(page);
    const trap = await armXssTrap(page);
    await page.goto(`/produtos/${slug}`, { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { level: 1 })).toContainText('QA');
    await page.waitForTimeout(500);
    expect(await trap.fired()).toBeNull();
    expect(trap.dialogs).toEqual([]);
    expect(await page.locator('iframe, img[onerror], a[href^="javascript:"]').count()).toBe(0);

    // JSON-LD continua JSON válido, com "<" escapado e o nome preservado como texto
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(blocks.length).toBeGreaterThan(0);
    for (const b of blocks) {
      expect(b).not.toMatch(/<\/script/i);
      expect(() => JSON.parse(b)).not.toThrow();
    }
    const productLd = blocks.map((b) => JSON.parse(b)).find((j) => j['@type'] === 'Product');
    expect(productLd.name).toBe(evil.name);
    // <title>/<meta> recebem o texto, não marcação
    // (ignora o preâmbulo do React Refresh que o Vite injeta só em dev)
    const inline = await page.$$eval(
      'head script:not([type="application/ld+json"]):not([src])',
      (s) => s.map((x) => x.textContent ?? '').filter((t) => !t.includes('/@react-refresh')),
    );
    expect(inline).toEqual([]);
  });
});

test.describe('consentimento de cookies (LGPD)', () => {
  test('antes do aceite: nenhuma requisição a terceiros e nenhum cookie', async ({
    page,
    context,
  }) => {
    test.setTimeout(120_000);
    const thirdParty: string[] = [];
    page.on('request', (r) => {
      const u = new URL(r.url());
      if (!['localhost', '127.0.0.1'].includes(u.hostname) && u.protocol.startsWith('http'))
        thirdParty.push(r.url());
    });
    for (const path of STATIC_ROUTES) {
      await page.goto(path, { waitUntil: 'networkidle' });
    }
    await expect(page.getByRole('heading', { name: /privacidade e cookies/i })).toBeVisible();
    expect(thirdParty).toEqual([]);
    expect(await context.cookies()).toEqual([]);
    const ls = await page.evaluate(() => Object.keys(window.localStorage));
    expect(ls).not.toContain('cn_consent_v1');
    const scripts = await page.$$eval('script[src]', (s) =>
      s.map((x) => (x as HTMLScriptElement).src),
    );
    expect(scripts.filter((s) => /googletagmanager|facebook|fbevents|gtag/.test(s))).toEqual([]);
    // Consent Mode v2: padrão "denied"
    const defaults = await page.evaluate(() =>
      ((window as unknown as { dataLayer?: unknown[] }).dataLayer ?? [])
        .map((e) => Array.from(e as ArrayLike<unknown>))
        .find((a) => a[0] === 'consent' && a[1] === 'default'),
    );
    expect(defaults?.[2]).toMatchObject({ analytics_storage: 'denied', ad_storage: 'denied' });
  });

  test('recusar: continua sem terceiros e a escolha persiste', async ({ page }) => {
    const thirdParty: string[] = [];
    page.on('request', (r) => {
      if (!/^https?:\/\/(localhost|127\.0\.0\.1)/.test(r.url()) && r.url().startsWith('http'))
        thirdParty.push(r.url());
    });
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /^recusar$/i }).click();
    await page.goto('/produtos', { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: /privacidade e cookies/i })).toBeHidden();
    const saved = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('cn_consent_v1') ?? 'null'),
    );
    expect(saved).toMatchObject({ analytics: false, marketing: false, version: 1 });
    expect(thirdParty).toEqual([]);
  });

  test('aceitar todos: só carrega terceiros se houver IDs configurados (hoje: nenhum)', async ({
    page,
  }) => {
    const thirdParty: string[] = [];
    page.on('request', (r) => {
      if (!/^https?:\/\/(localhost|127\.0\.0\.1)/.test(r.url()) && r.url().startsWith('http'))
        thirdParty.push(r.url());
    });
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /aceitar todos/i }).click();
    await page.goto('/sobre', { waitUntil: 'networkidle' });
    const hosts = [...new Set(thirdParty.map((u) => new URL(u).hostname))];
    test
      .info()
      .annotations.push({
        type: 'terceiros após aceite',
        description: hosts.join(', ') || 'nenhum',
      });
    // Sem VITE_GTM_ID / VITE_GA4_ID / VITE_META_PIXEL_ID nada externo deve carregar
    expect(hosts.every((h) => /googletagmanager|google-analytics|facebook|fbcdn/.test(h))).toBe(
      true,
    );
  });

  test('preferências podem ser reabertas pela política de privacidade (revogação)', async ({
    page,
  }) => {
    await presetConsent(page);
    await page.goto('/politica-de-privacidade', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /abrir preferências de cookies/i }).click();
    await expect(page.getByRole('heading', { name: /privacidade e cookies/i })).toBeVisible();
    await expect(page.locator('input[name="analytics"]')).not.toBeChecked();
  });
});
