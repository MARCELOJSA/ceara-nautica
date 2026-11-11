/**
 * AGENT 03 — Rodada final: regressão de UX-18, UX-20, UX-21, UX-22, UX-23,
 * UX-24, UX-25 e UX-26 e revisão geral (teclado, SEO, links).
 *
 *   QA_BASE_URL=http://localhost:4190 npx playwright test -c e2e/qa/playwright.qa.config.ts final
 *
 * O fluxo "motor-revisao" grava um lead REAL ("QA-TEST") e confere o
 * requestType no banco de dev via `docker exec` (pulado se o Docker não
 * estiver acessível). Apagar os leads QA-TEST depois.
 */
import { execFileSync } from 'node:child_process';
import { expect, test, type Page } from '@playwright/test';
import { QA_MARK, STATIC_ROUTES, presetConsent } from './qa-helpers';

interface ApiProduct {
  slug: string;
  name: string;
  category: string;
}

const NOT_BOATS = new Set(['motores-de-popa', 'estofamentos']);
const submitQuote = (page: Page) =>
  page.locator('form[aria-label="Formulário de orçamento"] button[type="submit"]');

/** Consulta o banco de dev (container ceara-nautica-db). Retorna null sem Docker. */
function dbQuery(sql: string): string | null {
  try {
    return execFileSync(
      'docker',
      [
        'exec',
        'ceara-nautica-db',
        'sh',
        '-c',
        `psql -U "$POSTGRES_USER" -d cearanautica -t -A -c "${sql.replace(/"/g, '\\"')}"`,
      ],
      { encoding: 'utf8', timeout: 20_000 },
    ).trim();
  } catch {
    return null;
  }
}

/** Nome-base da foto (sem tamanho -640/-1280 nem extensão). */
const photoKey = (src: string) =>
  (src.split('?')[0] ?? '')
    .replace(/^https?:\/\/[^/]+/, '')
    .replace(/-(640|1280|1920)\.webp$/, '.webp');

test.beforeEach(async ({ page }) => presetConsent(page));

// ---------------------------------------------------------------- UX-22 / UX-24
test.describe('motor com defeito (UX-22) e campos por tipo (UX-24)', () => {
  test('links "Problema no motor? Descreva aqui" em /servicos e no produto motores', async ({
    page,
  }) => {
    await page.goto('/servicos', { waitUntil: 'networkidle' });
    const links = page.getByRole('link', { name: /problema no motor\? descreva aqui/i });
    expect(await links.count()).toBeGreaterThan(0);
    for (const href of await links.evaluateAll((as) => as.map((a) => a.getAttribute('href'))))
      expect(href).toBe('/orcamento?servico=motor-revisao');
    await page.goto('/produtos/motores-de-popa', { waitUntil: 'networkidle' });
    const productLink = page.getByTestId('motor-issue-link');
    await expect(productLink).toBeVisible();
    await productLink.click();
    await expect(page).toHaveURL(/\/orcamento\?servico=motor-revisao$/);
    await expect(page.getByLabel(/tipo de solicitação/i)).toHaveValue('motor-revisao');
  });

  test('motor-revisao ponta a ponta: pré-preenchido, campos de produto ocultos, envio real e tipo gravado', async ({
    page,
  }) => {
    const name = `${QA_MARK} final motor-revisao ${Date.now()}`;
    await page.goto('/servicos', { waitUntil: 'networkidle' });
    await page
      .getByRole('link', { name: /problema no motor\? descreva aqui/i })
      .first()
      .click();
    await expect(page).toHaveURL(/servico=motor-revisao/);
    await expect(page.getByLabel(/tipo de solicitação/i)).toHaveValue('motor-revisao');
    await expect(page.getByTestId('product-fields')).toBeHidden();
    const msg = page.getByLabel(/conte o que você precisa/i);
    await expect(msg).toHaveValue(/modelo\/potência do motor/i);
    await expect(page.getByText(/marca, modelo e potência do motor/i)).toBeVisible();
    await page.getByLabel(/^nome/i).fill(name);
    await page.getByLabel(/telefone/i).fill('(92) 9 8888-7777');
    await msg.fill(
      'Modelo/potência do motor e o que está acontecendo: teste automático do QA. Pode apagar.',
    );
    await page.getByRole('checkbox', { name: /autorizo/i }).check();
    const [req, res] = await Promise.all([
      page.waitForRequest((r) => r.url().includes('/api/quotes') && r.method() === 'POST'),
      page.waitForResponse(
        (r) => r.url().includes('/api/quotes') && r.request().method() === 'POST',
      ),
      submitQuote(page).click(),
    ]);
    const sent = req.postDataJSON() as Record<string, unknown>;
    expect(sent.requestType).toBe('motor-revisao');
    expect(sent.productSlug).toBeUndefined();
    expect([201, 429]).toContain(res.status());
    test.skip(res.status() === 429, 'rate limit da API (5/min) atingido por outros testes');
    await expect(page.getByRole('heading', { name: /orçamento enviado/i })).toBeVisible();
    await expect(page.getByTestId('success-phone')).toContainText('(92) 98888-7777');
    const stored = dbQuery(
      `select request_type || '|' || coalesce(category,'') || '|' || coalesce(product_slug,'') from quote_requests where name = '${name}'`,
    );
    test.skip(stored === null, 'Docker indisponível para conferir o banco');
    expect(stored).toBe('motor-revisao|motores-de-popa|');
  });

  test('cada tipo de serviço esconde Categoria/Modelo; tipos de compra mostram', async ({
    page,
  }) => {
    await page.goto('/orcamento', { waitUntil: 'networkidle' });
    const type = page.getByLabel(/tipo de solicitação/i);
    const fields = page.getByTestId('product-fields');
    await expect(fields).toBeVisible();
    for (const t of ['reparo', 'manutencao', 'motor-revisao', 'estofamento']) {
      await type.selectOption(t);
      await expect(fields, t).toBeHidden();
    }
    for (const t of ['nova-embarcacao', 'motor', 'outro', '']) {
      await type.selectOption(t);
      await expect(fields, t || '(vazio)').toBeVisible();
    }
  });

  test('tipo de serviço escolhido depois de um modelo não envia o modelo oculto', async ({
    page,
  }) => {
    await page.route('**/api/quotes', (r) =>
      r.fulfill({ status: 201, contentType: 'application/json', body: '{"ok":true,"id":"q1"}' }),
    );
    await page.goto('/orcamento', { waitUntil: 'networkidle' });
    await page.getByLabel(/^categoria/i).selectOption('lanchas');
    await page.getByLabel(/modelo de referência/i).selectOption('lancha-aluminio-7m');
    await page.getByLabel(/tipo de solicitação/i).selectOption('reparo');
    await page.getByLabel(/^nome/i).fill(`${QA_MARK} oculto`);
    await page.getByLabel(/telefone/i).fill('(92) 98888-7777');
    await page.getByLabel(/conte o que você precisa/i).fill('Teste do QA, pode apagar.');
    await page.getByRole('checkbox', { name: /autorizo/i }).check();
    const [req] = await Promise.all([
      page.waitForRequest((r) => r.url().includes('/api/quotes') && r.method() === 'POST'),
      submitQuote(page).click(),
    ]);
    const sent = req.postDataJSON() as Record<string, unknown>;
    expect(sent.requestType).toBe('reparo');
    expect(sent.productSlug).toBeUndefined();
  });

  test('categoria Estofamentos sugere o tipo sem esconder os campos sob o dedo', async ({
    page,
  }) => {
    await page.goto('/orcamento', { waitUntil: 'networkidle' });
    await page.getByLabel(/^categoria/i).selectOption('estofamentos');
    await expect(page.getByLabel(/tipo de solicitação/i)).toHaveValue('estofamento');
    await expect(page.getByTestId('product-fields')).toBeVisible();
  });

  test('UX-25: telefone com letras mostra "Use apenas números"', async ({ page }) => {
    await page.goto('/contato', { waitUntil: 'networkidle' });
    await page.getByLabel(/telefone/i).fill('92 9abc-8888');
    await page.getByRole('button', { name: /enviar mensagem/i }).click();
    await expect(page.getByText(/use apenas números/i)).toBeVisible();
  });
});

// ---------------------------------------------------------------- UX-18 / UX-23 / UX-26 / UX-12
test.describe('Home, cards, Sobre e fichas', () => {
  test('UX-18: nenhuma foto de destaque repete uma capa de categoria na Home', async ({ page }) => {
    for (const w of [1280, 390]) {
      await page.setViewportSize({ width: w, height: 900 });
      await page.goto('/', { waitUntil: 'networkidle' });
      const featured = page.locator('section[aria-labelledby="destaques-title"] article img');
      const covers = page.locator('section[aria-labelledby="categorias-title"] img');
      await featured.first().scrollIntoViewIfNeeded();
      const f = (await featured.evaluateAll((i) => i.map((x) => x.getAttribute('src') ?? ''))).map(
        photoKey,
      );
      const c = (await covers.evaluateAll((i) => i.map((x) => x.getAttribute('src') ?? ''))).map(
        photoKey,
      );
      expect(f.length, `${w}`).toBeGreaterThan(0);
      expect(c.length, `${w}`).toBe(6);
      expect(
        f.filter((x) => c.includes(x)),
        `${w}`,
      ).toEqual([]);
      expect(new Set(f).size, `${w} destaques repetidos`).toBe(f.length);
      const slugs = await page
        .locator('section[aria-labelledby="destaques-title"] article a')
        .evaluateAll((as) => as.map((a) => a.getAttribute('href')));
      expect(slugs).not.toContain('/produtos/lancha-aluminio-7m');
    }
  });

  test('UX-23: todo card de embarcação tem "Indicado para" sem termos repetidos', async ({
    page,
  }) => {
    const products = (await (await page.request.get('/api/products')).json()) as ApiProduct[];
    const boats = new Set(products.filter((p) => !NOT_BOATS.has(p.category)).map((p) => p.slug));
    const problems: string[] = [];
    for (const path of ['/produtos', '/', '/produtos/canoa-aluminio-7m']) {
      await page.goto(path, { waitUntil: 'networkidle' });
      const cards = await page.locator('article').evaluateAll((arts) =>
        arts.map((a) => ({
          slug:
            a.querySelector('a[href^="/produtos/"]')?.getAttribute('href')?.split('/').pop() ?? '',
          uses: a.querySelector('[data-testid="card-uses"]')?.textContent ?? null,
        })),
      );
      for (const c of cards) {
        if (!boats.has(c.slug)) continue;
        if (!c.uses || !/^Indicado para:/.test(c.uses.trim())) {
          problems.push(`${path} ${c.slug}: sem "Indicado para"`);
          continue;
        }
        const terms = c.uses
          .replace(/^\s*Indicado para:\s*/, '')
          .split('·')
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean);
        if (!terms.length) problems.push(`${path} ${c.slug}: lista vazia`);
        if (new Set(terms).size !== terms.length)
          problems.push(`${path} ${c.slug}: repetido ${c.uses}`);
      }
    }
    expect(problems, problems.join('\n')).toEqual([]);
    // os 9 cards de embarcação aparecem no catálogo
    await page.goto('/produtos', { waitUntil: 'networkidle' });
    await expect(page.getByTestId('card-uses')).toHaveCount(boats.size);
  });

  test('UX-26: /sobre tem "Categorias em destaque" (links do catálogo) e "Ver no Instagram"', async ({
    page,
  }) => {
    await page.goto('/sobre', { waitUntil: 'networkidle' });
    await expect(page.getByText(/categorias em destaque/i).first()).toBeVisible();
    const cats = await page
      .locator('main a[href^="/produtos?categoria="]')
      .evaluateAll((as) => as.map((a) => a.getAttribute('href')));
    expect(cats.length).toBeGreaterThan(0);
    const ig = page.getByRole('link', { name: /ver no instagram/i }).first();
    await expect(ig).toBeVisible();
    await expect(ig).toHaveAttribute('href', /instagram\.com\/cearanautica/);
    await expect(ig).toHaveAttribute('rel', /noopener/);
    await expect(ig).toHaveAttribute('target', '_blank');
  });

  test('UX-12: as duas canoas têm a mesma ficha (rótulos na mesma ordem)', async ({ page }) => {
    const labels: string[][] = [];
    for (const slug of ['canoa-aluminio-6m', 'canoa-aluminio-7m']) {
      await page.goto(`/produtos/${slug}`, { waitUntil: 'networkidle' });
      labels.push(await page.locator('dl').first().locator('dt').allInnerTexts());
    }
    expect(labels[0]).toEqual(labels[1]);
    expect(labels[0]).toEqual(
      expect.arrayContaining(['Comprimento', 'Material do casco', 'Capota', 'Motorização']),
    );
  });

  test('UX-20: introdução do catálogo no celular é curta e termina em frase completa', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto('/produtos', { waitUntil: 'networkidle' });
    const intro = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      const p = h1?.parentElement?.querySelectorAll('p') ?? [];
      return Array.from(p)
        .filter((x) => x.getBoundingClientRect().height > 0)
        .map((x) => (x as HTMLElement).innerText.trim())
        .filter((t) => t.length > 30);
    });
    expect(intro.length).toBeGreaterThan(0);
    for (const t of intro) {
      expect(t, t).toMatch(/[.!?…]$/);
      expect(t.length, t).toBeLessThan(220);
    }
  });
});

// ---------------------------------------------------------------- Revisão geral
test.describe('revisão geral', () => {
  test('formulário de orçamento completo só com teclado (Tab, digitação, Espaço, Enter)', async ({
    page,
  }) => {
    await page.route('**/api/quotes', (r) =>
      r.fulfill({ status: 201, contentType: 'application/json', body: '{"ok":true,"id":"q1"}' }),
    );
    await page.goto('/orcamento', { waitUntil: 'networkidle' });
    await page.getByLabel(/^nome/i).focus();
    await page.keyboard.type(`${QA_MARK} teclado`);
    await page.keyboard.press('Tab');
    await expect(page.getByLabel(/telefone/i)).toBeFocused();
    await page.keyboard.type('92988887777');
    // avança até a mensagem e o consentimento só com Tab
    for (let i = 0; i < 15; i++) {
      await page.keyboard.press('Tab');
      if (
        await page
          .getByLabel(/conte o que você precisa/i)
          .evaluate((e) => e === document.activeElement)
      )
        break;
    }
    await expect(page.getByLabel(/conte o que você precisa/i)).toBeFocused();
    await page.keyboard.type('Pedido feito só com o teclado pelo QA.');
    const consent = page.getByRole('checkbox', { name: /autorizo/i });
    for (let i = 0; i < 5 && !(await consent.evaluate((e) => e === document.activeElement)); i++)
      await page.keyboard.press('Tab');
    await expect(consent).toBeFocused();
    await page.keyboard.press('Space');
    await expect(consent).toBeChecked();
    const focusRing = await consent.evaluate((el) => {
      const cs = getComputedStyle(el);
      return (cs.outlineStyle !== 'none' && cs.outlineWidth !== '0px') || cs.boxShadow !== 'none';
    });
    expect(focusRing).toBe(true);
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { name: /orçamento enviado/i })).toBeVisible();
  });

  test('sitemap: todas as URLs abrem com título próprio e canonical igual à URL', async ({
    page,
  }) => {
    const sm = await page.request.get('/sitemap.xml');
    test.skip(!(sm.headers()['content-type'] ?? '').includes('xml'), 'sitemap só existe no build');
    const locs = Array.from((await sm.text()).matchAll(/<loc>([^<]+)<\/loc>/g)).map((m) => m[1]!);
    const products = (await (await page.request.get('/api/products')).json()) as ApiProduct[];
    expect(locs.length).toBe(STATIC_ROUTES.length + 6 + products.length);
    const titles = new Map<string, string>();
    const problems: string[] = [];
    for (const loc of locs) {
      const u = new URL(loc);
      const path = u.pathname + u.search;
      await page.goto(path, { waitUntil: 'networkidle' });
      if (await page.getByText('Erro 404').count()) problems.push(`${path}: 404`);
      const title = await page.title();
      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      if (!canonical?.endsWith(path)) problems.push(`${path}: canonical ${canonical}`);
      const prev = titles.get(title);
      if (prev) problems.push(`${path}: título igual a ${prev}`);
      titles.set(title, path);
      const desc = await page.locator('meta[name="description"]').getAttribute('content');
      if (!desc || desc.length < 50) problems.push(`${path}: description curta`);
    }
    expect(problems, problems.join('\n')).toEqual([]);
  });

  test('[QA-13] description ≤ 160 e título ≤ 70 caracteres (não cortam no Google)', async ({
    page,
  }) => {
    const sm = await page.request.get('/sitemap.xml');
    test.skip(!(sm.headers()['content-type'] ?? '').includes('xml'), 'sitemap só existe no build');
    const locs = Array.from((await sm.text()).matchAll(/<loc>([^<]+)<\/loc>/g)).map((m) => m[1]!);
    const long: string[] = [];
    for (const loc of locs) {
      const u = new URL(loc);
      await page.goto(u.pathname + u.search, { waitUntil: 'networkidle' });
      const title = await page.title();
      const desc = (await page.locator('meta[name="description"]').getAttribute('content')) ?? '';
      if (desc.length > 160) long.push(`${u.pathname}${u.search}: description ${desc.length}`);
      if (title.length > 70)
        long.push(`${u.pathname}${u.search}: título ${title.length} "${title}"`);
    }
    expect(long, long.join('\n')).toEqual([]);
  });

  test('[QA-11] campos de formulário mostram o contorno de foco (focus-visible) ao navegar por Tab', async ({
    page,
  }) => {
    const missing: string[] = [];
    for (const path of ['/contato', '/orcamento', '/produtos']) {
      await page.goto(path, { waitUntil: 'networkidle' });
      const fields = page.locator('main .field-input:visible');
      const n = await fields.count();
      expect(n, path).toBeGreaterThan(0);
      for (let i = 0; i < n; i++) {
        const f = fields.nth(i);
        await f.focus();
        const ok = await f.evaluate((el) => {
          const cs = getComputedStyle(el);
          return (
            el.matches(':focus-visible') &&
            cs.outlineStyle !== 'none' &&
            parseFloat(cs.outlineWidth) >= 2
          );
        });
        if (!ok) missing.push(`${path}: ${await f.getAttribute('name')}`);
      }
    }
    expect(missing, missing.join('\n')).toEqual([]);
  });

  test('[QA-12] elemento focado não fica totalmente escondido sob o cabeçalho fixo nem sob a barra inferior', async ({
    browser,
  }) => {
    const hidden: string[] = [];
    const check = async (page: Page, label: string) => {
      const r = await page.evaluate(() => {
        const e = document.activeElement as HTMLElement | null;
        if (
          !e ||
          e === document.body ||
          e.closest('header, [data-testid="mobile-contact-bar"], .sr-only-focusable')
        )
          return null;
        const b = e.getBoundingClientRect();
        const hdr = document.querySelector('header.sticky')?.getBoundingClientRect();
        const bar = document.querySelector('[data-testid="mobile-contact-bar"]');
        const br =
          bar && getComputedStyle(bar).display !== 'none' ? bar.getBoundingClientRect() : null;
        const top = Math.max(b.top, hdr ? hdr.bottom : 0);
        const bottom = Math.min(b.bottom, br ? br.top : window.innerHeight);
        return {
          d: `${e.tagName} "${(e.textContent ?? '').trim().slice(0, 30)}"`,
          vis: bottom - top,
        };
      });
      if (r && r.vis <= 0) hidden.push(`${label}: ${r.d}`);
    };
    // desktop: voltando com Shift+Tab a partir do rodapé
    const d = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const dp = await d.newPage();
    await presetConsent(dp);
    await dp.emulateMedia({ reducedMotion: 'reduce' });
    await dp.goto('/servicos', { waitUntil: 'networkidle' });
    await dp.locator('footer a').first().focus();
    for (let i = 0; i < 25; i++) {
      await dp.keyboard.press('Shift+Tab');
      await check(dp, '1280 /servicos Shift+Tab');
    }
    await d.close();
    // celular: avançando com Tab (a barra inferior fixa cobre a parte de baixo)
    const m = await browser.newContext({ viewport: { width: 360, height: 740 }, hasTouch: true });
    const mp = await m.newPage();
    await presetConsent(mp);
    await mp.emulateMedia({ reducedMotion: 'reduce' });
    await mp.goto('/', { waitUntil: 'networkidle' });
    for (let i = 0; i < 40; i++) {
      await mp.keyboard.press('Tab');
      await check(mp, '360 / Tab');
    }
    await m.close();
    expect(hidden, hidden.join('\n')).toEqual([]);
  });

  test('links externos abrem em nova aba com rel seguro', async ({ page }) => {
    const bad: string[] = [];
    for (const path of [...STATIC_ROUTES, '/produtos/motores-de-popa']) {
      await page.goto(path, { waitUntil: 'networkidle' });
      const found = await page
        .locator('a[href^="http"]')
        .evaluateAll((as) =>
          as
            .filter(
              (a) =>
                !/noopener/.test(a.getAttribute('rel') ?? '') ||
                a.getAttribute('target') !== '_blank',
            )
            .map((a) => a.getAttribute('href')),
        );
      for (const f of found) bad.push(`${path}: ${f}`);
    }
    expect(bad).toEqual([]);
  });
});
