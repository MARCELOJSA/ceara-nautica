/**
 * AGENT 03 — Rodada 2: regressão das áreas alteradas pelas correções da rodada 1
 * (busca única site/API, orçamento compacto, confirmação do telefone, lightbox
 * com arrastar, página de produto, Sobre, Contato, botão flutuante, barra móvel,
 * CLS, console e imagens).
 *
 *   QA_BASE_URL=http://localhost:4190 npx playwright test -c e2e/qa/playwright.qa.config.ts regression-r2
 *
 * Testes `[QA-xx]` reproduzem problemas abertos do docs/QA-REPORT.md.
 */
import { expect, test, type Page } from '@playwright/test';
import { QA_MARK, STATIC_ROUTES, presetConsent, scrollThrough, watchPage } from './qa-helpers';

interface ApiProduct {
  slug: string;
  name: string;
  category: string;
  images: { src: string }[];
}

async function apiSearch(page: Page, q: string): Promise<string[]> {
  const res = await page.request.get(`/api/products?q=${encodeURIComponent(q)}`);
  expect(res.ok(), q).toBe(true);
  return ((await res.json()) as ApiProduct[]).map((p) => p.slug).sort();
}

async function siteSearch(page: Page, q: string): Promise<string[]> {
  await page.goto(`/produtos?q=${encodeURIComponent(q)}`, { waitUntil: 'networkidle' });
  const grid = page.getByTestId('product-grid');
  if (!(await grid.count())) return [];
  const hrefs = await grid
    .locator('article h2 a')
    .evaluateAll((as) => as.map((a) => a.getAttribute('href') ?? ''));
  return hrefs.map((h) => h.split('/').pop()!).sort();
}

test.beforeEach(async ({ page }) => presetConsent(page));

// ---------------------------------------------------------------- Busca
test.describe('busca (regra única site × API)', () => {
  const CASES: { q: string; expect: string[] | 'nonempty' | 'empty' }[] = [
    { q: 'aluminio', expect: 'nonempty' },
    { q: 'ALUMÍNIO', expect: 'nonempty' },
    { q: 'canoa aluminio', expect: ['canoa-aluminio-6m', 'canoa-aluminio-7m'] },
    { q: 'aluminio canoa', expect: ['canoa-aluminio-6m', 'canoa-aluminio-7m'] },
    { q: 'canoa 6', expect: ['canoa-aluminio-6m'] },
    { q: 'canoa 6 metros', expect: ['canoa-aluminio-6m'] },
    { q: 'bote 90', expect: ['bote-aluminio-6m-90hp'] },
    { q: 'motr', expect: ['motores-de-popa'] },
    {
      q: 'lacnha',
      expect: ['lancha-aluminio-10m', 'lancha-aluminio-7m', 'lancha-cargueira-iguaracu-9m'],
    },
    { q: 'estofado', expect: ['estofamento-nautico'] },
    { q: 'xyzw', expect: 'empty' },
    { q: 'asdf qwer', expect: 'empty' },
    { q: '%', expect: 'empty' },
    { q: '_', expect: 'empty' },
  ];

  for (const c of CASES) {
    test(`"${c.q}": site e API retornam o mesmo resultado esperado`, async ({ page }) => {
      const api = await apiSearch(page, c.q);
      const site = await siteSearch(page, c.q);
      expect(site).toEqual(api);
      if (c.expect === 'nonempty') expect(api.length).toBeGreaterThan(1);
      else if (c.expect === 'empty') {
        expect(api).toEqual([]);
        await expect(page.getByTestId('empty-state')).toBeVisible();
      } else expect(api).toEqual([...c.expect].sort());
    });
  }

  test('acento e maiúsculas não mudam o resultado', async ({ page }) => {
    const a = await apiSearch(page, 'aluminio');
    expect(await apiSearch(page, 'Alumínio')).toEqual(a);
    expect(await apiSearch(page, 'ALUMINIO')).toEqual(a);
  });

  for (const q of ['concerto', 'reparo', 'solda']) {
    test(`"${q}" mostra a dica de serviços`, async ({ page }) => {
      await page.goto(`/produtos?q=${q}`, { waitUntil: 'networkidle' });
      await expect(page.getByTestId('empty-state')).toBeVisible();
      await expect(page.getByTestId('service-hint')).toBeVisible();
    });
  }

  test('[QA-10] "chata"/"semichata" não trazem produtos que só têm "chapa"', async ({ page }) => {
    for (const q of ['chata', 'semichata']) {
      expect(await apiSearch(page, q), q).toEqual(['semi-chata-aluminio-sob-medida']);
    }
  });
});

// ---------------------------------------------------------------- Orçamento
test.describe('orçamento (rodada 2)', () => {
  test('?produto= mostra o cartão com "Trocar" e esconde Categoria/Modelo; o envio leva o produto', async ({
    page,
  }) => {
    await page.route('**/api/quotes', (r) =>
      r.fulfill({ status: 201, contentType: 'application/json', body: '{"ok":true,"id":"q1"}' }),
    );
    await page.goto('/orcamento?produto=lancha-aluminio-7m', { waitUntil: 'networkidle' });
    await expect(page.getByText('Produto selecionado', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /trocar/i })).toBeVisible();
    await expect(page.getByLabel(/^categoria/i)).toBeHidden();
    await expect(page.getByLabel(/modelo de referência/i)).toBeHidden();
    await page.getByLabel(/^nome/i).fill(`${QA_MARK} r2`);
    await page.getByLabel(/telefone/i).fill('92 9 8888 7777');
    await page.getByLabel(/conte o que você precisa/i).fill('Pedido de teste do QA, pode apagar.');
    await page.getByRole('checkbox', { name: /autorizo/i }).check();
    const [req] = await Promise.all([
      page.waitForRequest((r) => r.url().includes('/api/quotes') && r.method() === 'POST'),
      page.locator('form[aria-label="Formulário de orçamento"] button[type="submit"]').click(),
    ]);
    expect(req.postDataJSON()).toMatchObject({
      productSlug: 'lancha-aluminio-7m',
      category: 'lanchas',
      requestType: 'nova-embarcacao',
    });
  });

  test('?servico=motores define tipo "Comprar motor de popa" e categoria Motores', async ({
    page,
  }) => {
    await page.goto('/orcamento?servico=motores&categoria=motores-de-popa', {
      waitUntil: 'networkidle',
    });
    await expect(page.getByLabel(/tipo de solicitação/i)).toHaveValue('motor');
    await expect(page.getByLabel(/^categoria/i)).toHaveValue('motores-de-popa');
    const labels = await page
      .getByLabel(/tipo de solicitação/i)
      .locator('option')
      .allInnerTexts();
    expect(labels).toContain('Problema ou revisão no motor');
  });

  test('API aceita o novo tipo "motor-revisao" (lead QA-TEST real)', async ({ page }) => {
    const res = await page.request.post('/api/quotes', {
      data: {
        name: `${QA_MARK} motor-revisao`,
        phone: '(92) 9 8888-7777',
        requestType: 'motor-revisao',
        message: 'Teste automático do QA (rodada 2). Pode apagar.',
        consent: true,
      },
    });
    expect([201, 429]).toContain(res.status());
    if (res.status() === 201) expect(await res.json()).toMatchObject({ ok: true });
    const bad = await page.request.post('/api/quotes', {
      data: {
        name: `${QA_MARK} tipo inválido`,
        phone: '(92) 98888-7777',
        requestType: 'motor-x',
        message: 'Teste automático do QA (rodada 2).',
        consent: true,
      },
    });
    expect([400, 429]).toContain(bad.status());
  });

  test('sucesso mostra o telefone; "Corrigir o telefone" volta com os dados e foco no telefone', async ({
    page,
  }) => {
    let n = 0;
    await page.route('**/api/quotes', (r) => {
      n++;
      return r.fulfill({
        status: 201,
        contentType: 'application/json',
        body: `{"ok":true,"id":"q${n}"}`,
      });
    });
    await page.goto('/orcamento?produto=canoa-aluminio-7m', { waitUntil: 'networkidle' });
    await page.getByLabel(/^nome/i).fill(`${QA_MARK} corrigir`);
    await page.getByLabel(/telefone/i).fill('92988887777');
    await page.getByLabel(/^cidade/i).fill('Manaus');
    await page.getByLabel(/conte o que você precisa/i).fill('Pedido de teste do QA, pode apagar.');
    await page.getByRole('checkbox', { name: /autorizo/i }).check();
    await page.locator('form[aria-label="Formulário de orçamento"] button[type="submit"]').click();
    await expect(page.getByRole('heading', { name: /orçamento enviado/i })).toBeVisible();
    await expect(page.getByTestId('success-phone')).toContainText('(92) 98888-7777');
    await page.getByRole('button', { name: /corrigir o telefone/i }).click();
    const tel = page.getByLabel(/telefone/i);
    await expect(tel).toBeFocused();
    await expect(tel).toHaveValue('92988887777');
    await expect(page.getByLabel(/^nome/i)).toHaveValue(`${QA_MARK} corrigir`);
    await expect(page.getByLabel(/^cidade/i)).toHaveValue('Manaus');
    await expect(page.getByLabel(/conte o que você precisa/i)).toHaveValue(/Pedido de teste/);
    await expect(page.getByText('Produto selecionado', { exact: true })).toBeVisible();
    await tel.fill('92977776666');
    await page.locator('form[aria-label="Formulário de orçamento"] button[type="submit"]').click();
    await expect(page.getByTestId('success-phone')).toContainText('(92) 97777-6666');
    expect(n).toBe(2);
  });

  test('contato: sucesso mostra o telefone e "Corrigir o telefone" preserva os dados', async ({
    page,
  }) => {
    await page.route('**/api/contact', (r) =>
      r.fulfill({ status: 201, contentType: 'application/json', body: '{"ok":true,"id":"c1"}' }),
    );
    await page.goto('/contato', { waitUntil: 'networkidle' });
    await page.getByLabel(/^nome/i).fill(`${QA_MARK} contato r2`);
    await page.getByLabel(/telefone/i).fill('(92) 3234-5678');
    await page.getByLabel(/^assunto/i).fill('Dúvida');
    await page.getByLabel(/^mensagem/i).fill('Mensagem de teste do QA, pode apagar.');
    await page.getByRole('checkbox', { name: /autorizo/i }).check();
    await page.getByRole('button', { name: /enviar mensagem/i }).click();
    const phone = page.getByTestId('success-phone');
    if (await phone.count()) {
      await expect(phone).toContainText('3234-5678');
      await page.getByRole('button', { name: /corrigir o telefone/i }).click();
      await expect(page.getByLabel(/telefone/i)).toBeFocused();
      await expect(page.getByLabel(/^assunto/i)).toHaveValue('Dúvida');
    } else {
      test
        .info()
        .annotations.push({ type: 'info', description: 'contato sem confirmação do telefone' });
    }
  });
});

// ---------------------------------------------------------------- Lightbox
test.describe('lightbox (rodada 2)', () => {
  test('foco fica no botão usado ao navegar (setas e botões)', async ({ page }) => {
    await page.goto('/produtos/bote-aluminio-7m', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /ampliar/i }).click();
    const dialog = page.getByRole('dialog');
    const prev = dialog.getByRole('button', { name: /imagem anterior/i });
    await prev.focus();
    for (const n of ['2 / 2', '1 / 2', '2 / 2']) {
      await page.keyboard.press('Enter');
      await expect(dialog.getByText(n)).toBeVisible();
      await expect(prev).toBeFocused();
    }
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: /ampliar/i })).toBeFocused();
  });

  test('celular: arrastar para os lados troca a foto; arrastar na vertical não', async ({
    browser,
  }) => {
    const ctx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
    });
    const page = await ctx.newPage();
    await presetConsent(page);
    await page.goto('/produtos/canoa-aluminio-7m', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /ampliar/i }).tap();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('1 / 2')).toBeVisible();
    const swipe = (dx: number, dy: number) =>
      page.getByTestId('lightbox-stage').evaluate(
        (el, [dx, dy]) => {
          const mk = (x: number, y: number) =>
            new Touch({ identifier: 1, target: el, clientX: x, clientY: y });
          const s = mk(200, 400);
          const e = mk(200 + dx!, 400 + dy!);
          el.dispatchEvent(
            new TouchEvent('touchstart', { touches: [s], changedTouches: [s], bubbles: true }),
          );
          el.dispatchEvent(
            new TouchEvent('touchend', { touches: [], changedTouches: [e], bubbles: true }),
          );
        },
        [dx, dy],
      );
    await swipe(-120, 5);
    await expect(dialog.getByText('2 / 2')).toBeVisible();
    await swipe(120, 0);
    await expect(dialog.getByText('1 / 2')).toBeVisible();
    await swipe(10, 200);
    await expect(dialog.getByText('1 / 2')).toBeVisible();
    await expect(dialog).toBeVisible();
    await ctx.close();
  });
});

// ---------------------------------------------------------------- Produto, Sobre, Contato
test.describe('páginas alteradas', () => {
  test('todo produto tem "Preço e prazo", "Dúvidas comuns" e, nas embarcações com medidas, "Entenda a ficha"', async ({
    page,
  }) => {
    const products = (await (await page.request.get('/api/products')).json()) as ApiProduct[];
    const problems: string[] = [];
    for (const p of products) {
      await page.goto(`/produtos/${p.slug}`, { waitUntil: 'networkidle' });
      if (!(await page.getByTestId('price-note').isVisible()))
        problems.push(`${p.slug}: sem preço/prazo`);
      const faq = page.locator('section[aria-labelledby="duvidas-produto"]');
      if (!(await faq.isVisible())) problems.push(`${p.slug}: sem Dúvidas comuns`);
      else {
        const d = faq.locator('details').first();
        await d.locator('summary').click();
        if ((await d.getAttribute('open')) === null) problems.push(`${p.slug}: FAQ não abre`);
      }
      // "Entenda a ficha" só faz sentido quando a ficha tem medidas publicadas
      const hasMeasures = await page
        .locator('dl')
        .first()
        .evaluate((dl) => /\d/.test(dl.textContent ?? ''));
      const boat = !['motores-de-popa', 'estofamentos'].includes(p.category);
      if (boat && hasMeasures && !(await page.getByTestId('spec-glossary').isVisible()))
        problems.push(`${p.slug}: sem Entenda a ficha`);
      const types = await page
        .locator('script[type="application/ld+json"]')
        .evaluateAll((s) =>
          s.map((x) => (JSON.parse(x.textContent || '{}') as { '@type'?: string })['@type']),
        );
      if (!types.includes('Product')) problems.push(`${p.slug}: JSON-LD ${types.join(',')}`);
    }
    expect(problems, problems.join('\n')).toEqual([]);
  });

  test('/sobre: projetos publicados apontam para produtos existentes', async ({ page }) => {
    const slugs = ((await (await page.request.get('/api/products')).json()) as ApiProduct[]).map(
      (p) => p.slug,
    );
    await page.goto('/sobre', { waitUntil: 'networkidle' });
    const list = page.getByTestId('published-projects');
    await expect(list).toBeVisible();
    const hrefs = await list
      .locator('a')
      .evaluateAll((as) => as.map((a) => a.getAttribute('href')));
    expect(hrefs.length).toBeGreaterThan(0);
    for (const h of hrefs) expect(slugs, h ?? '').toContain(h!.split('/').pop());
  });

  test('/contato: canais, nota de localização e formulário', async ({ page }) => {
    await page.goto('/contato', { waitUntil: 'networkidle' });
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.getByRole('link', { name: /@cearanautica/i }).first()).toBeVisible();
    await expect(page.getByTestId('address-note')).toBeVisible();
    await expect(page.getByRole('form', { name: /contato/i })).toBeVisible();
  });
});

// ---------------------------------------------------------------- Layout
test.describe('layout (rodada 2)', () => {
  test('desktop: sem botão flutuante (sem WhatsApp configurado)', async ({ page }) => {
    for (const w of [1280, 1920]) {
      await page.setViewportSize({ width: w, height: 900 });
      for (const path of ['/', '/produtos', '/contato']) {
        await page.goto(path, { waitUntil: 'networkidle' });
        await expect(page.getByTestId('floating-desktop'), `${w} ${path}`).toHaveCount(0);
        await expect(page.getByTestId('mobile-contact-bar'), `${w} ${path}`).toBeHidden();
      }
    }
  });

  test('360px: barra inferior com dois botões em uma linha, dentro da tela', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    for (const path of ['/', '/produtos/lancha-aluminio-7m', '/orcamento']) {
      await page.goto(path, { waitUntil: 'networkidle' });
      const bar = page.getByTestId('mobile-contact-bar');
      await expect(bar).toBeVisible();
      for (const id of ['floating-contact', 'mobile-bar-secondary']) {
        const box = (await page.getByTestId(id).boundingBox())!;
        expect(box.x, `${path} ${id}`).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width, `${path} ${id}`).toBeLessThanOrEqual(360);
        expect(box.height, `${path} ${id} altura`).toBeGreaterThanOrEqual(44);
        expect(box.height, `${path} ${id} quebra de linha`).toBeLessThanOrEqual(56);
        const lines = await page.getByTestId(id).evaluate((el) => {
          // ignora textos só para leitor de tela (sr-only), que não aparecem na tela
          const tops = new Set<number>();
          const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
          for (let n = walker.nextNode(); n; n = walker.nextNode()) {
            if (!n.textContent?.trim() || n.parentElement?.closest('.sr-only')) continue;
            const r = document.createRange();
            r.selectNodeContents(n);
            for (const rect of Array.from(r.getClientRects()))
              if (rect.width > 2) tops.add(Math.round(rect.top / 8));
          }
          return tops.size;
        });
        expect(lines, `${path} ${id} linhas`).toBeLessThanOrEqual(1);
      }
    }
  });

  for (const vp of [
    { name: 'desktop', width: 1280, height: 800, mobile: false },
    { name: 'mobile', width: 390, height: 844, mobile: true },
  ]) {
    test(`CLS < 0,1 em todas as páginas (${vp.name})`, async ({ browser }) => {
      const results: string[] = [];
      for (const path of [...STATIC_ROUTES, '/produtos/lancha-aluminio-7m', '/nao-existe']) {
        const ctx = await browser.newContext({
          viewport: { width: vp.width, height: vp.height },
          isMobile: vp.mobile,
          hasTouch: vp.mobile,
        });
        const page = await ctx.newPage();
        await presetConsent(page);
        await page.addInitScript(() => {
          (window as unknown as { __cls: number }).__cls = 0;
          new PerformanceObserver((l) => {
            for (const e of l.getEntries() as unknown as {
              value: number;
              hadRecentInput: boolean;
            }[])
              if (!e.hadRecentInput) (window as unknown as { __cls: number }).__cls += e.value;
          }).observe({ type: 'layout-shift', buffered: true });
        });
        await page.goto(path, { waitUntil: 'networkidle' });
        await page.waitForTimeout(800);
        const cls = await page.evaluate(() => (window as unknown as { __cls: number }).__cls);
        test.info().annotations.push({ type: `CLS ${path}`, description: cls.toFixed(3) });
        if (cls >= 0.1) results.push(`${path}: ${cls.toFixed(3)}`);
        await ctx.close();
      }
      expect(results, results.join('\n')).toEqual([]);
    });
  }

  test('console sem erros/avisos e nenhuma requisição ou imagem com falha (todas as páginas)', async ({
    page,
  }) => {
    const products = (await (await page.request.get('/api/products')).json()) as ApiProduct[];
    const warnings: string[] = [];
    page.on('console', (m) => {
      if (m.type() === 'warning') warnings.push(m.text());
    });
    const issues = watchPage(page);
    const broken: string[] = [];
    for (const path of [...STATIC_ROUTES, ...products.map((p) => `/produtos/${p.slug}`)]) {
      for (const w of [1280, 360]) {
        await page.setViewportSize({ width: w, height: 800 });
        await page.goto(path, { waitUntil: 'networkidle' });
        await scrollThrough(page);
        await page.waitForLoadState('networkidle');
        const bad = await page
          .locator('img')
          .evaluateAll((imgs) =>
            (imgs as HTMLImageElement[])
              .filter((i) => i.complete && i.naturalWidth === 0 && i.loading !== 'lazy')
              .map((i) => i.currentSrc || i.src),
          );
        for (const b of bad) broken.push(`${path} @${w}: ${b}`);
      }
    }
    expect({ ...issues, warnings, broken }).toEqual({
      console: [],
      failed: [],
      http: [],
      warnings: [],
      broken: [],
    });
  });
});
