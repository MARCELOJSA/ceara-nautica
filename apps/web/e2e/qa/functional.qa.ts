/**
 * AGENT 03 — QA técnico funcional (Rodada 1).
 * Rotas, catálogo (filtro/busca/URL/histórico), detalhe de produto (galeria,
 * lightbox, relacionados, CTA), serviços (FAQ, CTAs), orçamento com parâmetros,
 * fallback da API, SEO técnico e acessibilidade básica.
 *
 * Roda contra o site JÁ EM EXECUÇÃO e a API real:
 *   QA_BASE_URL=http://localhost:4175 npx playwright test -c e2e/qa/playwright.qa.config.ts functional
 *
 * Testes marcados com `[QA-xx]` reproduzem um problema do docs/QA-REPORT.md
 * e falham enquanto ele estiver aberto.
 */
import { expect, test, type Page } from '@playwright/test';
import { STATIC_ROUTES, presetConsent, watchPage } from './qa-helpers';

interface ApiProduct {
  slug: string;
  name: string;
  category: string;
  images: { src: string; alt: string }[];
}
interface ApiCategory {
  slug: string;
  name: string;
  productCount: number;
}

async function apiProducts(page: Page): Promise<ApiProduct[]> {
  const res = await page.request.get('/api/products');
  expect(res.ok()).toBe(true);
  return (await res.json()) as ApiProduct[];
}

async function seoSnapshot(page: Page) {
  return page.evaluate(() => {
    const ld = Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map(
      (s) => {
        try {
          return { ok: true, data: JSON.parse(s.textContent || '') as Record<string, unknown> };
        } catch {
          return { ok: false, data: {} };
        }
      },
    );
    return {
      title: document.title,
      descriptions: Array.from(document.querySelectorAll('meta[name="description"]')).map(
        (m) => m.getAttribute('content') ?? '',
      ),
      canonicals: Array.from(document.querySelectorAll('link[rel="canonical"]')).map(
        (l) => l.getAttribute('href') ?? '',
      ),
      robots: document.querySelector('meta[name="robots"]')?.getAttribute('content') ?? null,
      h1: Array.from(document.querySelectorAll('h1')).map((h) => h.textContent?.trim() ?? ''),
      levels: Array.from(document.querySelectorAll('main h1, main h2, main h3, main h4')).map((h) =>
        Number(h.tagName[1]),
      ),
      ld,
    };
  });
}

test.beforeEach(async ({ page }) => presetConsent(page));

// ---------------------------------------------------------------- Rotas e SEO
test.describe('rotas e SEO técnico', () => {
  test('páginas estáticas: título/description únicos, canonical, 1 h1, JSON-LD válido, sem erros', async ({
    page,
    baseURL,
  }) => {
    const titles = new Map<string, string>();
    const descs = new Map<string, string>();
    const problems: string[] = [];
    for (const path of STATIC_ROUTES) {
      const issues = watchPage(page);
      await page.goto(path, { waitUntil: 'networkidle' });
      const s = await seoSnapshot(page);
      if (s.descriptions.length !== 1)
        problems.push(`${path}: ${s.descriptions.length} descriptions`);
      if (s.canonicals.length !== 1) problems.push(`${path}: ${s.canonicals.length} canonicals`);
      if (s.h1.length !== 1) problems.push(`${path}: ${s.h1.length} h1`);
      if (s.ld.some((l) => !l.ok)) problems.push(`${path}: JSON-LD inválido`);
      for (let i = 1; i < s.levels.length; i++) {
        if (s.levels[i]! - s.levels[i - 1]! > 1)
          problems.push(`${path}: salto de heading h${s.levels[i - 1]}→h${s.levels[i]}`);
      }
      const prevT = titles.get(s.title);
      if (prevT) problems.push(`${path}: título repetido de ${prevT}`);
      titles.set(s.title, path);
      const d = s.descriptions[0] ?? '';
      const prevD = descs.get(d);
      if (prevD) problems.push(`${path}: description repetida de ${prevD}`);
      descs.set(d, path);
      if (issues.console.length || issues.failed.length || issues.http.length)
        problems.push(`${path}: ${JSON.stringify(issues)}`);
      page.removeAllListeners('console');
      page.removeAllListeners('pageerror');
      page.removeAllListeners('requestfailed');
      page.removeAllListeners('response');
      expect(s.canonicals[0]?.endsWith(path === '/' ? '/' : path), `${path} canonical`).toBe(true);
    }
    expect(problems, problems.join('\n')).toEqual([]);
    expect(baseURL).toBeTruthy();
  });

  test('todos os produtos da API abrem, com SEO, galeria, CTA e relacionados coerentes', async ({
    page,
  }) => {
    const products = await apiProducts(page);
    const available = new Set<string>();
    const problems: string[] = [];
    for (const p of products) {
      const issues = watchPage(page);
      await page.goto(`/produtos/${p.slug}`, { waitUntil: 'networkidle' });
      await expect(page.locator('h1')).toHaveText(p.name);
      const s = await seoSnapshot(page);
      if (!s.title.includes(p.name)) problems.push(`${p.slug}: título sem nome`);
      if (!s.canonicals[0]?.endsWith(`/produtos/${p.slug}`)) problems.push(`${p.slug}: canonical`);
      const types = s.ld.map((l) => l.data['@type']);
      if (!types.includes('Product') || !types.includes('BreadcrumbList'))
        problems.push(`${p.slug}: JSON-LD ${types.join(',')}`);
      const hrefs = await page.locator(`a[href="/orcamento?produto=${p.slug}"]`).count();
      if (hrefs < 1) problems.push(`${p.slug}: CTA sem ?produto=`);
      // galeria: miniaturas = imagens que existem
      for (const img of p.images) {
        const r = await page.request.get(img.src);
        // o servidor de SPA devolve index.html (200) para arquivo ausente
        if (r.ok() && (r.headers()['content-type'] ?? '').startsWith('image/'))
          available.add(img.src);
      }
      const existing = p.images.filter((i) => available.has(i.src)).length;
      const thumbs = await page.getByRole('list', { name: 'Miniaturas' }).locator('li').count();
      if (existing > 1 && thumbs !== existing)
        problems.push(`${p.slug}: ${thumbs} miniaturas para ${existing} fotos`);
      // relacionados: mesma categoria e sem o próprio produto
      const related = page.locator('section[aria-labelledby="relacionados-title"] article a');
      const relHrefs = await related.evaluateAll((as) => as.map((a) => a.getAttribute('href')));
      for (const h of relHrefs) {
        const slug = h?.split('/').pop();
        const rp = products.find((x) => x.slug === slug);
        if (!rp || rp.category !== p.category || rp.slug === p.slug)
          problems.push(`${p.slug}: relacionado incoerente ${h}`);
      }
      const sameCat = products.filter((x) => x.category === p.category && x.slug !== p.slug);
      if (relHrefs.length !== Math.min(4, sameCat.length))
        problems.push(
          `${p.slug}: ${relHrefs.length} relacionados, esperado ${Math.min(4, sameCat.length)}`,
        );
      if (issues.console.length || issues.failed.length || issues.http.length)
        problems.push(`${p.slug}: ${JSON.stringify(issues)}`);
      page.removeAllListeners('console');
      page.removeAllListeners('pageerror');
      page.removeAllListeners('requestfailed');
      page.removeAllListeners('response');
    }
    expect(problems, problems.join('\n')).toEqual([]);
  });

  test('404 e produto inexistente: noindex, h1 de erro, links de saída', async ({ page }) => {
    for (const path of ['/nao-existe', '/produtos/nao-existe', '/produtos/LANCHA']) {
      await page.goto(path, { waitUntil: 'networkidle' });
      await expect(page.getByText('Erro 404')).toBeVisible();
      const s = await seoSnapshot(page);
      expect(s.robots, path).toContain('noindex');
      await expect(page.getByRole('link', { name: 'Página inicial', exact: true })).toBeVisible();
    }
  });

  test('sitemap.xml e robots.txt do build (somente quando servido pelo vite preview)', async ({
    page,
  }) => {
    const robots = await page.request.get('/robots.txt');
    expect(robots.ok()).toBe(true);
    const sm = await page.request.get('/sitemap.xml');
    const isXml = (sm.headers()['content-type'] ?? '').includes('xml');
    test.skip(!isXml, 'sitemap.xml só existe no build (dist)');
    expect(await robots.text()).toMatch(/Sitemap:/);
    const xml = await sm.text();
    const locs = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g)).map((m) => m[1]!);
    const products = await apiProducts(page);
    for (const p of products)
      expect(
        locs.some((l) => l.endsWith(`/produtos/${p.slug}`)),
        p.slug,
      ).toBe(true);
    const sitemapProducts = locs.filter((l) => /\/produtos\/[^?]+$/.test(l));
    expect(sitemapProducts.length).toBe(products.length);
  });
});

// ---------------------------------------------------------------- Catálogo
test.describe('catálogo /produtos', () => {
  test('filtro por categoria: contagem igual à API, URL sincronizada e chip ativo', async ({
    page,
  }) => {
    const cats = (await (await page.request.get('/api/categories')).json()) as ApiCategory[];
    const total = (await apiProducts(page)).length;
    await page.goto('/produtos', { waitUntil: 'networkidle' });
    await expect(page.getByTestId('product-grid').locator('> li')).toHaveCount(total);
    await expect(page.getByText(`${total} resultados`)).toBeVisible();
    for (const c of cats) {
      await page
        .getByRole('group', { name: /filtrar/i })
        .getByRole('button', { name: c.name, exact: true })
        .click();
      await expect(page).toHaveURL(new RegExp(`categoria=${c.slug}`));
      await expect(page.getByRole('button', { name: c.name, exact: true })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      const n = c.productCount;
      if (n > 0) await expect(page.getByTestId('product-grid').locator('> li')).toHaveCount(n);
      else await expect(page.getByTestId('empty-state')).toBeVisible();
      await expect(page.locator('h1')).toHaveText(c.name);
    }
    await page.getByRole('button', { name: 'Todas', exact: true }).click();
    await expect(page).toHaveURL(/\/produtos$/);
  });

  test('busca: debounce para ?q=, sem acento, combinação com categoria e limpar filtros', async ({
    page,
  }) => {
    await page.goto('/produtos', { waitUntil: 'networkidle' });
    const search = page.getByRole('searchbox', { name: /buscar/i });
    await search.fill('aluminio 7');
    await expect(page).toHaveURL(/q=aluminio/);
    const names = await page.getByTestId('product-grid').locator('h2').allInnerTexts();
    expect(names.length).toBeGreaterThan(0);
    for (const n of names) expect(n.toLowerCase()).toMatch(/7\s?m/);
    await page.getByRole('button', { name: 'Canoas', exact: true }).click();
    await expect(page).toHaveURL(/categoria=canoas/);
    await expect(page).toHaveURL(/q=aluminio/);
    await expect(page.getByTestId('product-grid').locator('> li')).toHaveCount(1);
    await search.fill('xyz inexistente');
    await expect(page.getByTestId('empty-state')).toBeVisible();
    await page.getByRole('button', { name: /limpar filtros/i }).click();
    await expect(page).toHaveURL(/\/produtos$/);
    await expect(search).toHaveValue('');
    await expect(page.getByRole('button', { name: 'Todas', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  test('busca de serviço sugere a página de serviços', async ({ page }) => {
    await page.goto('/produtos?q=reparo', { waitUntil: 'networkidle' });
    await expect(page.getByTestId('service-hint')).toBeVisible();
  });

  test('URL ?categoria=&q= abre o estado certo e voltar/avançar restauram filtro e busca', async ({
    page,
  }) => {
    await page.goto('/produtos?categoria=botes&q=6', { waitUntil: 'networkidle' });
    await expect(page.getByRole('searchbox')).toHaveValue('6');
    await expect(page.getByRole('button', { name: 'Botes', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.getByTestId('product-grid').locator('> li')).toHaveCount(2);
    await page.getByRole('button', { name: 'Lanchas', exact: true }).click();
    await expect(page).toHaveURL(/categoria=lanchas/);
    await page.goBack();
    await expect(page).toHaveURL(/categoria=botes/);
    await expect(page.getByRole('button', { name: 'Botes', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.getByRole('searchbox')).toHaveValue('6');
    await page.goForward();
    await expect(page.getByRole('button', { name: 'Lanchas', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  test('categoria inválida na URL mostra todos os produtos sem erro', async ({ page }) => {
    const total = (await apiProducts(page)).length;
    await page.goto('/produtos?categoria=nao-existe', { waitUntil: 'networkidle' });
    await expect(page.getByTestId('product-grid').locator('> li')).toHaveCount(total);
  });

  test('fallback: com a API fora, catálogo e detalhe usam o catálogo local', async ({ page }) => {
    await page.route('**/api/**', (r) => r.abort('connectionrefused'));
    await page.goto('/produtos');
    await expect(page.getByTestId('product-grid').locator('> li')).toHaveCount(11);
    await page.goto('/produtos/canoa-aluminio-7m');
    await expect(page.locator('h1')).toHaveText(/canoa/i);
    await expect(page.locator('section[aria-labelledby="relacionados-title"]')).toBeVisible();
  });

  test('fallback: API respondendo 500 também usa o catálogo local', async ({ page }) => {
    await page.route('**/api/products**', (r) =>
      r.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"x"}' }),
    );
    await page.goto('/');
    await page.goto('/produtos');
    await expect(page.getByTestId('product-grid').locator('> li')).toHaveCount(11);
  });
});

// ---------------------------------------------------------------- Produto
test.describe('detalhe do produto: galeria e lightbox', () => {
  const SLUG = 'canoa-aluminio-7m'; // 2 fotos existentes

  test('miniatura troca a foto, lightbox abre, setas/Esc funcionam e o foco volta', async ({
    page,
  }) => {
    await page.goto(`/produtos/${SLUG}`, { waitUntil: 'networkidle' });
    const thumbs = page.getByRole('list', { name: 'Miniaturas' }).getByRole('button');
    await expect(thumbs).toHaveCount(2);
    await thumbs.nth(1).click();
    await expect(thumbs.nth(1)).toHaveAttribute('aria-current', 'true');
    const opener = page.getByRole('button', { name: /ampliar/i });
    await opener.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('2 / 2')).toBeVisible();
    await page.keyboard.press('ArrowRight');
    await expect(dialog.getByText('1 / 2')).toBeVisible();
    await page.keyboard.press('ArrowLeft');
    await expect(dialog.getByText('2 / 2')).toBeVisible();
    // foco preso
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      expect(await dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true);
    }
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
    expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden');
  });

  test('[QA-01 corrigido] Enter repetido no botão "Próxima imagem" navega e não fecha o lightbox', async ({
    page,
  }) => {
    await page.goto(`/produtos/${SLUG}`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /ampliar/i }).click();
    const dialog = page.getByRole('dialog');
    const next = dialog.getByRole('button', { name: /próxima imagem/i });
    await next.focus();
    await page.keyboard.press('Enter');
    await expect(dialog.getByText('2 / 2')).toBeVisible();
    // o foco deve continuar no botão usado
    await expect(next).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('1 / 2')).toBeVisible();
  });

  test('clique no fundo fecha o lightbox', async ({ page }) => {
    await page.goto(`/produtos/${SLUG}`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /ampliar/i }).click();
    await page.mouse.click(5, 300);
    await expect(page.getByRole('dialog')).toBeHidden();
  });

  test('relacionado navega para outro produto, volta ao topo e reinicia a galeria', async ({
    page,
  }) => {
    await page.goto('/produtos/bote-aluminio-7m', { waitUntil: 'networkidle' });
    await page.getByRole('list', { name: 'Miniaturas' }).getByRole('button').nth(1).click();
    const rel = page.locator(
      'section[aria-labelledby="relacionados-title"] a[href="/produtos/bote-aluminio-6m"]',
    );
    await rel.scrollIntoViewIfNeeded();
    const href = await rel.getAttribute('href');
    await rel.click();
    await expect(page).toHaveURL(new RegExp(`${href}$`));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(50);
    await expect(
      page.getByRole('list', { name: 'Miniaturas' }).getByRole('button').first(),
    ).toHaveAttribute('aria-current', 'true');
  });
});

// ---------------------------------------------------------------- Serviços
test.describe('serviços', () => {
  test('FAQ abre e fecha por clique e teclado', async ({ page }) => {
    await page.goto('/servicos', { waitUntil: 'networkidle' });
    const details = page.locator('details');
    const n = await details.count();
    expect(n).toBeGreaterThan(3);
    const first = details.first();
    await first.locator('summary').click();
    await expect(first).toHaveAttribute('open', '');
    await first.locator('summary').click();
    await expect(first).not.toHaveAttribute('open', '');
    await first.locator('summary').focus();
    await page.keyboard.press('Enter');
    await expect(first).toHaveAttribute('open', '');
    await page.keyboard.press('Space');
    await expect(first).not.toHaveAttribute('open', '');
  });

  test('cada CTA de serviço leva ao orçamento com tipo e mensagem pré-preenchidos', async ({
    page,
  }) => {
    const expected: Record<string, { type: string; category?: string }> = {
      fabricacao: { type: 'nova-embarcacao' },
      reparos: { type: 'reparo' },
      manutencao: { type: 'manutencao' },
      motores: { type: 'motor', category: 'motores-de-popa' },
      estofamento: { type: 'estofamento', category: 'estofamentos' },
    };
    for (const [slug, exp] of Object.entries(expected)) {
      await page.goto('/servicos', { waitUntil: 'networkidle' });
      await page.locator(`section#${slug} a.btn-primary`).click();
      await expect(page).toHaveURL(new RegExp(`servico=${slug}`));
      await expect(page.getByLabel(/tipo de solicitação/i)).toHaveValue(exp.type);
      if (exp.category) await expect(page.getByLabel(/^categoria/i)).toHaveValue(exp.category);
      await expect(page.getByLabel(/conte o que você precisa/i)).toHaveValue(
        /Tenho interesse no serviço/,
      );
    }
  });
});

// ---------------------------------------------------------------- Orçamento (pré-preenchimento)
test.describe('orçamento com parâmetros de URL', () => {
  test('?produto= mostra o produto, categoria e tipo; remover limpa o modelo', async ({ page }) => {
    await page.goto('/orcamento?produto=bote-aluminio-6m', { waitUntil: 'networkidle' });
    await expect(page.getByText('Produto selecionado', { exact: true })).toBeVisible();
    await expect(page.getByLabel(/modelo de referência/i)).toHaveValue('bote-aluminio-6m');
    await expect(page.getByLabel(/^categoria/i)).toHaveValue('botes');
    await expect(page.getByLabel(/tipo de solicitação/i)).toHaveValue('nova-embarcacao');
    await page.getByRole('button', { name: /remover produto selecionado/i }).click();
    await expect(page.getByText('Produto selecionado', { exact: true })).toBeHidden();
    await expect(page.getByLabel(/modelo de referência/i)).toHaveValue('');
  });

  test('?categoria= filtra os modelos; produto inválido é ignorado', async ({ page }) => {
    await page.goto('/orcamento?categoria=canoas&produto=nao-existe', { waitUntil: 'networkidle' });
    await expect(page.getByLabel(/^categoria/i)).toHaveValue('canoas');
    await expect(page.getByText('Produto selecionado', { exact: true })).toBeHidden();
    const opts = await page
      .getByLabel(/modelo de referência/i)
      .locator('option')
      .allInnerTexts();
    expect(opts.slice(1).every((o) => /canoa/i.test(o))).toBe(true);
    expect(opts.length).toBe(3);
  });

  test('?produto= de motor define tipo "motor"', async ({ page }) => {
    await page.goto('/orcamento?produto=motores-de-popa', { waitUntil: 'networkidle' });
    await expect(page.getByLabel(/tipo de solicitação/i)).toHaveValue('motor');
  });

  test('[QA-02 corrigido] trocar a categoria atualiza o tipo sugerido (sem produto)', async ({
    page,
  }) => {
    await page.goto('/orcamento', { waitUntil: 'networkidle' });
    const cat = page.getByLabel(/^categoria/i);
    const type = page.getByLabel(/tipo de solicitação/i);
    await cat.selectOption('lanchas');
    await expect(type).toHaveValue('nova-embarcacao');
    await cat.selectOption('motores-de-popa');
    await expect(type).toHaveValue('motor');
    await cat.selectOption('estofamentos');
    await expect(type).toHaveValue('estofamento');
    // escolha manual do tipo não é sobrescrita ("outro" não é serviço, então a
    // Categoria continua visível; tipos de serviço a escondem — UX-24)
    await type.selectOption('outro');
    await cat.selectOption('lanchas');
    await expect(type).toHaveValue('outro');
  });

  test('[QA-02 corrigido] com ?produto=: "Trocar" mostra Categoria e o tipo acompanha', async ({
    page,
  }) => {
    await page.goto('/orcamento?produto=bote-aluminio-6m', { waitUntil: 'networkidle' });
    const cat = page.getByLabel(/^categoria/i);
    await expect(cat).toBeHidden();
    await page.getByRole('button', { name: /trocar/i }).click();
    await expect(cat).toBeVisible();
    await cat.selectOption('motores-de-popa');
    await expect(page.getByLabel(/modelo de referência/i)).toHaveValue('');
    await expect(page.getByLabel(/tipo de solicitação/i)).toHaveValue('motor');
  });
});

// ---------------------------------------------------------------- Integração front × API
test.describe('integração front × API', () => {
  test('categorias da API batem com os chips e com a soma dos produtos', async ({ page }) => {
    const cats = (await (await page.request.get('/api/categories')).json()) as ApiCategory[];
    const products = await apiProducts(page);
    for (const c of cats)
      expect(c.productCount, c.slug).toBe(products.filter((p) => p.category === c.slug).length);
    await page.goto('/produtos', { waitUntil: 'networkidle' });
    const chips = await page
      .getByRole('group', { name: /filtrar/i })
      .getByRole('button')
      .allInnerTexts();
    expect(chips.slice(1).map((c) => c.toLowerCase())).toEqual(
      cats.map((c) => c.name.toLowerCase()),
    );
  });

  test('[QA-05 corrigido] busca da API ignora acentos e maiúsculas como a busca do site', async ({
    page,
  }) => {
    const withAccent = (await (
      await page.request.get('/api/products?q=alumínio')
    ).json()) as unknown[];
    const without = (await (
      await page.request.get('/api/products?q=aluminio')
    ).json()) as unknown[];
    expect(withAccent.length).toBeGreaterThan(0);
    expect(without.length).toBe(withAccent.length);
  });

  test('[QA-08 corrigido] toda imagem declarada pela API existe no site', async ({ page }) => {
    const missing: string[] = [];
    for (const p of await apiProducts(page)) {
      for (const img of p.images) {
        const r = await page.request.get(img.src);
        if (!r.ok() || !(r.headers()['content-type'] ?? '').startsWith('image/'))
          missing.push(`${p.slug}: ${img.src}`);
      }
    }
    expect(missing, missing.join('\n')).toEqual([]);
  });

  test('erros da API: JSON com { error }, sem stack trace', async ({ page }) => {
    for (const [path, status] of [
      ['/api/products/nao-existe', 404],
      ['/api/products?category=xx', 400],
      ['/api/products?featured=talvez', 400],
      ['/api/rota-inexistente', 404],
    ] as const) {
      const r = await page.request.get(path);
      expect(r.status(), path).toBe(status);
      const body = (await r.json()) as { error?: string };
      expect(typeof body.error, path).toBe('string');
      expect(JSON.stringify(body), path).not.toMatch(/at \w+ \(|node_modules|prisma/i);
    }
  });
});
