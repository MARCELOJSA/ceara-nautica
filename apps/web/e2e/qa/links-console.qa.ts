/**
 * AGENT 03 — links quebrados, imagens, erros de console e de rede com a API REAL.
 */
import { expect, test } from '@playwright/test';
import { STATIC_ROUTES, presetConsent, productSlugs, scrollThrough, watchPage } from './qa-helpers';

const NOT_FOUND_H1 = /essa rota não está no mapa/i;

test.describe('rotas, console e rede (API real)', () => {
  test('todas as rotas e todos os produtos da API carregam sem erro de console/rede', async ({
    page,
    request,
  }) => {
    test.setTimeout(240_000);
    const slugs = await productSlugs(request);
    expect(slugs.length).toBeGreaterThan(0);
    await presetConsent(page);
    const issues = watchPage(page);
    const report: string[] = [];
    for (const path of [...STATIC_ROUTES, ...slugs.map((s) => `/produtos/${s}`)]) {
      const before = { c: issues.console.length, f: issues.failed.length, h: issues.http.length };
      const res = await page.goto(path, { waitUntil: 'networkidle' });
      expect(res?.status(), path).toBe(200);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.getByRole('heading', { level: 1 })).not.toHaveText(NOT_FOUND_H1);
      // a página não pode cair no fallback local (sinal de API fora do ar / erro)
      await expect(page.getByText(/catálogo local|modo offline|API indisponível/i)).toHaveCount(0);
      await scrollThrough(page);
      await page.waitForLoadState('networkidle');
      const newIssues = [
        ...issues.console.slice(before.c),
        ...issues.failed.slice(before.f),
        ...issues.http.slice(before.h),
      ];
      if (newIssues.length) report.push(`${path}: ${newIssues.join(' | ')}`);
    }
    expect(report, report.join('\n')).toEqual([]);
  });

  test('links internos (crawl de todas as páginas) não levam ao 404', async ({ page, request }) => {
    test.setTimeout(300_000);
    await presetConsent(page);
    const slugs = await productSlugs(request);
    const toVisit = [...STATIC_ROUTES, ...slugs.map((s) => `/produtos/${s}`)];
    const found = new Map<string, string>(); // destino → página de origem
    const external = new Map<string, { rel: string | null; target: string | null; from: string }>();
    for (const path of toVisit) {
      await page.goto(path, { waitUntil: 'networkidle' });
      const links = await page.$$eval('a[href]', (as) =>
        as.map((a) => ({
          href: (a as HTMLAnchorElement).href,
          raw: a.getAttribute('href') ?? '',
          rel: a.getAttribute('rel'),
          target: a.getAttribute('target'),
        })),
      );
      const origin = new URL(page.url()).origin;
      for (const l of links) {
        if (l.raw.startsWith('#') || l.raw.startsWith('mailto:') || l.raw.startsWith('tel:'))
          continue;
        const u = new URL(l.href);
        if (u.origin === origin) {
          const key = `${u.pathname}${u.search}`;
          if (!found.has(key)) found.set(key, path);
        } else {
          external.set(l.href, { rel: l.rel, target: l.target, from: path });
        }
      }
    }
    const broken: string[] = [];
    for (const [target, from] of found) {
      if (target.startsWith('/api/')) continue;
      // arquivos estáticos (sitemap, imagens, pdf…) → checagem HTTP direta
      if (/\.[a-z0-9]{2,5}$/i.test(new URL(target, 'http://x').pathname)) {
        const r = await request.get(target);
        if (r.status() >= 400) broken.push(`${target} (de ${from}) → HTTP ${r.status()}`);
        continue;
      }
      await page.goto(target, { waitUntil: 'networkidle' });
      const h1 = (await page.getByRole('heading', { level: 1 }).first().textContent()) ?? '';
      if (NOT_FOUND_H1.test(h1)) broken.push(`${target} (de ${from}) → página 404`);
    }
    test
      .info()
      .annotations.push({ type: 'links-internos', description: `${found.size} destinos únicos` });
    test.info().annotations.push({
      type: 'links-externos',
      description: [...external.keys()].join(' , ') || 'nenhum',
    });
    expect(broken, broken.join('\n')).toEqual([]);

    // A01/A05 — links externos: https e, quando abrem nova aba, rel="noopener noreferrer"
    const unsafe = [...external.entries()].filter(
      ([href, l]) =>
        !href.startsWith('https://') ||
        (l.target === '_blank' &&
          !(/noopener/.test(l.rel ?? '') && /noreferrer/.test(l.rel ?? ''))),
    );
    expect(unsafe.map(([h, l]) => `${h} (de ${l.from}) rel=${l.rel}`)).toEqual([]);
  });

  test('todas as imagens renderizadas existem (HTTP 200, tipo imagem) e têm alt', async ({
    page,
    request,
  }) => {
    test.setTimeout(240_000);
    await presetConsent(page);
    const slugs = await productSlugs(request);
    const srcs = new Map<string, string>();
    const noAlt: string[] = [];
    for (const path of [...STATIC_ROUTES, ...slugs.map((s) => `/produtos/${s}`)]) {
      await page.goto(path, { waitUntil: 'networkidle' });
      await scrollThrough(page);
      const imgs = await page.$$eval('img', (els) =>
        els.map((i) => ({
          src: (i as HTMLImageElement).currentSrc || (i as HTMLImageElement).src,
          alt: i.getAttribute('alt'),
          srcset: i.getAttribute('srcset'),
        })),
      );
      for (const i of imgs) {
        if (i.alt === null) noAlt.push(`${path}: ${i.src}`);
        if (i.src && !i.src.startsWith('data:')) srcs.set(i.src, path);
        for (const part of (i.srcset ?? '').split(',')) {
          const u = part.trim().split(/\s+/)[0];
          if (u) srcs.set(new URL(u, page.url()).href, path);
        }
      }
    }
    const broken: string[] = [];
    for (const [src, from] of srcs) {
      const r = await request.get(src);
      const ct = r.headers()['content-type'] ?? '';
      if (r.status() !== 200 || !ct.startsWith('image/'))
        broken.push(`${src} (de ${from}) → ${r.status()} ${ct}`);
    }
    expect(noAlt, 'img sem atributo alt').toEqual([]);
    expect(broken, broken.join('\n')).toEqual([]);
  });

  test('rota inexistente mostra 404 com noindex, sem erro de console', async ({ page }) => {
    await presetConsent(page);
    const issues = watchPage(page);
    await page.goto('/rota-que-nao-existe', { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(NOT_FOUND_H1);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    expect(issues.console).toEqual([]);
  });

  test('produto inexistente → tela de não encontrado, sem vazar erro técnico', async ({ page }) => {
    await presetConsent(page);
    const issues = watchPage(page);
    await page.goto('/produtos/produto-que-nao-existe', { waitUntil: 'networkidle' });
    const body = await page.locator('main').innerText();
    expect(body).not.toMatch(/prisma|stack|TypeError|undefined|null/i);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    // único "erro" aceitável é o 404 da própria API
    const unexpected = issues.console.filter((c) => !/404/.test(c));
    expect(unexpected).toEqual([]);
  });
});
