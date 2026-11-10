/**
 * AGENT 03 — responsividade: 360 / 768 / 1280 / 1920 sem rolagem horizontal.
 */
import { expect, test } from '@playwright/test';
import { STATIC_ROUTES, presetConsent, productSlugs, scrollThrough } from './qa-helpers';

const WIDTHS = [360, 768, 1280, 1920];

for (const width of WIDTHS) {
  test(`sem rolagem horizontal em ${width}px (todas as rotas + 1 produto + 404)`, async ({
    page,
    request,
  }) => {
    test.setTimeout(180_000);
    const [firstSlug] = await productSlugs(request);
    await page.setViewportSize({ width, height: width < 768 ? 780 : 900 });
    await presetConsent(page);
    const offenders: string[] = [];
    for (const path of [...STATIC_ROUTES, `/produtos/${firstSlug}`, '/nao-existe']) {
      await page.goto(path, { waitUntil: 'networkidle' });
      await scrollThrough(page);
      const m = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        const sw = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
        // elementos que ultrapassam a viewport (ajuda o dev a achar o culpado)
        const wide = Array.from(document.querySelectorAll<HTMLElement>('body *'))
          .filter((el) => {
            const r = el.getBoundingClientRect();
            return (
              r.width > 0 &&
              (r.right > vw + 1 || r.left < -1) &&
              getComputedStyle(el).position !== 'fixed'
            );
          })
          .filter((el) => !el.closest('[aria-hidden="true"]'))
          .slice(0, 3)
          .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 40)}`);
        return { vw, sw, wide };
      });
      if (m.sw > m.vw + 1)
        offenders.push(`${path}: scrollWidth ${m.sw} > ${m.vw} [${m.wide.join(', ')}]`);
    }
    expect(offenders, offenders.join('\n')).toEqual([]);
  });
}

test('360px: banner de cookies não cobre o formulário inteiro e botões cabem na tela', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/orcamento', { waitUntil: 'networkidle' });
  const banner = page.locator('section', {
    has: page.getByRole('heading', { name: /privacidade e cookies/i }),
  });
  await expect(banner).toBeVisible();
  const box = await banner.boundingBox();
  expect(box!.height).toBeLessThan(740 * 0.75);
  for (const name of [/^recusar$/i, /aceitar todos/i, /^preferências$/i]) {
    const b = await page.getByRole('button', { name }).boundingBox();
    expect(b!.x).toBeGreaterThanOrEqual(0);
    expect(b!.x + b!.width).toBeLessThanOrEqual(360);
    expect(b!.height).toBeGreaterThanOrEqual(44);
  }
});
