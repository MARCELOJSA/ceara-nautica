import { DEMO_PRODUCTS } from '@cn/shared';
import { readFileSync } from 'node:fs';
import { expect, presetConsent, test } from './fixtures';

// fotos de produto realmente publicadas (gerado por scripts/process-images.mjs)
const PRODUCT_IMAGES = JSON.parse(
  readFileSync(new URL('../src/data/product-images.json', import.meta.url), 'utf8'),
) as string[];
const available = new Set<string>(PRODUCT_IMAGES);
const imagesOf = (slug: string) =>
  DEMO_PRODUCTS.find((p) => p.slug === slug)!.images.filter((i) => available.has(i.src));

test.describe('fluxos principais', () => {
  test('banner de cookies aparece na primeira visita e some após recusar', async ({
    page,
    consoleErrors,
  }) => {
    await page.goto('/');
    const banner = page.getByTestId('cookie-banner');
    await expect(banner).toBeVisible();
    await page.getByRole('button', { name: /^recusar$/i }).click();
    await expect(banner).toBeHidden();
    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(banner).toBeHidden();
    expect(consoleErrors).toEqual([]);
  });

  test('catálogo filtra por categoria e busca, sincronizando a URL', async ({
    page,
    consoleErrors,
  }) => {
    await presetConsent(page);
    await page.goto('/produtos');
    await page.getByRole('button', { name: 'Canoas', exact: true }).click();
    await expect(page).toHaveURL(/categoria=canoas/);
    const cards = page.getByTestId('product-grid').getByRole('heading', { level: 2 });
    await expect(cards).toHaveCount(DEMO_PRODUCTS.filter((p) => p.category === 'canoas').length);
    await expect(page.getByRole('navigation', { name: /trilha/i })).toContainText('Canoas');
    await page.getByRole('searchbox', { name: /buscar por nome/i }).fill('6 m');
    await expect(page).toHaveURL(/q=6\+m|q=6%20m/);
    await expect(cards).toHaveCount(1);
    await page.getByRole('searchbox', { name: /buscar por nome/i }).fill('zzz');
    await expect(page.getByTestId('empty-state')).toBeVisible();
    expect(consoleErrors).toEqual([]);
  });

  test('busca por serviço sem resultado sugere a página Serviços', async ({ page }) => {
    await presetConsent(page);
    await page.goto('/produtos?q=reparo');
    await expect(page.getByTestId('empty-state')).toBeVisible();
    await page
      .getByTestId('service-hint')
      .getByRole('link', { name: /veja nossos serviços/i })
      .click();
    await expect(page).toHaveURL(/\/servicos$/);
  });

  test('produto: galeria com lightbox acessível e CTA de orçamento pré-preenchido', async ({
    page,
    consoleErrors,
  }) => {
    await presetConsent(page);
    const product = DEMO_PRODUCTS.find((p) => imagesOf(p.slug).length > 1)!;
    const count = imagesOf(product.slug).length;
    await page.goto(`/produtos/${product.slug}`);
    await page.getByRole('button', { name: /ampliar/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await page.keyboard.press('ArrowRight');
    await expect(dialog.getByText(`2 / ${count}`)).toBeVisible();
    // QA-01: Enter em "Próxima imagem" troca a foto e o foco continua no botão
    const next = dialog.getByRole('button', { name: 'Próxima imagem' });
    await next.focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await expect(dialog).toBeVisible();
    await expect(next).toBeFocused();
    await expect(dialog.getByText(`${((1 + 2) % count) + 1} / ${count}`)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();

    await page
      .locator('main')
      .getByRole('link', { name: /solicitar orçamento/i })
      .first()
      .click();
    await expect(page).toHaveURL(new RegExp(`/orcamento\\?produto=${product.slug}`));
    await expect(page.getByText('Produto selecionado', { exact: true })).toBeVisible();
    await expect(page.getByLabel(/modelo de referência/i)).toHaveValue(product.slug);
    expect(consoleErrors).toEqual([]);
  });

  test('produto com uma foto só não mostra miniaturas nem imagem quebrada', async ({ page }) => {
    await presetConsent(page);
    await page.goto('/produtos/lancha-cargueira-iguaracu-9m');
    await expect(page.getByRole('list', { name: 'Miniaturas' })).toHaveCount(0);
    await expect(page.getByText('Imagem em breve')).toHaveCount(0);
  });

  test('motor de popa usa textos de motor, não de embarcação', async ({ page }) => {
    await presetConsent(page);
    await page.goto('/produtos/motores-de-popa');
    await expect(page.getByRole('heading', { name: /sobre os motores/i })).toBeVisible();
    await expect(page.getByText(/sobre este projeto/i)).toHaveCount(0);
    await page.goto('/produtos?categoria=motores-de-popa');
    await expect(page.getByRole('heading', { name: /procurando um motor de popa/i })).toBeVisible();
    await expect(page.getByRole('navigation', { name: /trilha/i })).toContainText(
      'Motores de popa',
    );
  });

  test('orçamento: envio com sucesso (POST /api/quotes) e aviso de retorno', async ({
    page,
    consoleErrors,
  }) => {
    await presetConsent(page);
    await page.goto('/orcamento?categoria=botes');
    await expect(page.getByLabel(/^categoria/i)).toHaveValue('botes');
    await expect(page.getByLabel(/tipo de solicitação/i)).toHaveValue('nova-embarcacao');
    await expect(page.getByTestId('response-note')).toContainText(
      'Retornamos pelo telefone informado (ligação ou WhatsApp)',
    );
    await page.getByLabel(/^nome/i).fill('Cliente Teste');
    await page.getByLabel(/telefone/i).fill('(92) 98888-7777');
    await page
      .getByLabel(/conte o que você precisa/i)
      .fill('Preciso de um bote para pesca esportiva.');
    await page.getByRole('checkbox', { name: /autorizo/i }).check();
    const [req] = await Promise.all([
      page.waitForRequest((r) => r.url().endsWith('/api/quotes') && r.method() === 'POST'),
      page
        .getByRole('button', { name: /solicitar orçamento/i })
        .last()
        .click(),
    ]);
    expect(req.postDataJSON()).toMatchObject({
      category: 'botes',
      requestType: 'nova-embarcacao',
      consent: true,
      name: 'Cliente Teste',
    });
    await expect(page.getByRole('heading', { name: /pedido de orçamento enviado/i })).toBeVisible();
    await expect(page.getByRole('status').getByText(/ligação ou WhatsApp/)).toBeVisible();
    expect(consoleErrors).toEqual([]);
  });

  test('orçamento por serviço pré-seleciona o tipo de solicitação', async ({ page }) => {
    await presetConsent(page);
    await page.goto('/orcamento?servico=manutencao');
    await expect(page.getByLabel(/tipo de solicitação/i)).toHaveValue('manutencao');
  });

  test('contato: validação no cliente bloqueia envio vazio', async ({ page, consoleErrors }) => {
    await presetConsent(page);
    await page.goto('/contato');
    let posted = false;
    page.on('request', (r) => {
      if (r.method() === 'POST') posted = true;
    });
    await page.getByRole('button', { name: /enviar mensagem/i }).click();
    await expect(page.getByText('Informe seu nome.')).toBeVisible();
    expect(posted).toBe(false);
    await expect(page.getByTestId('response-note')).toContainText('ligação ou WhatsApp');
    expect(consoleErrors).toEqual([]);
  });

  test('sem número de WhatsApp: nada promete chat; produto oferece Instagram', async ({ page }) => {
    await presetConsent(page);
    await page.goto('/');
    await expect(page.locator('a[href*="wa.me"]')).toHaveCount(0);
    await expect(page.getByTestId('floating-contact')).toHaveAttribute('href', '/orcamento');
    await expect(page.getByText(/fale com a equipe|falar com um vendedor/i)).toHaveCount(0);

    await page.goto(`/produtos/${DEMO_PRODUCTS[0]!.slug}`);
    const ig = page.locator('main').getByRole('link', { name: /perguntar no instagram/i });
    await expect(ig).toHaveAttribute('href', 'https://www.instagram.com/cearanautica/');
  });

  test('desktop: sem flutuante repetido; o cabeçalho fixo mantém o CTA de orçamento', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'apenas no projeto desktop');
    await presetConsent(page);
    await page.goto('/produtos');
    await expect(page.getByTestId('product-grid')).toBeVisible();
    // UX-14: a pílula "Orçamento" cobria cards e repetia o CTA do cabeçalho
    await expect(page.getByTestId('floating-desktop')).toHaveCount(0);
    await expect(page.getByTestId('mobile-contact-bar')).toBeHidden();
    await page.evaluate(() => window.scrollTo(0, 1500));
    const cta = page.locator('header').getByRole('link', { name: /solicitar orçamento/i });
    await expect(cta).toBeInViewport();
  });
});

test.describe('mobile', () => {
  test('menu em drawer acessível (tela cheia, links visíveis, Esc fecha)', async ({
    page,
    isMobile,
    consoleErrors,
  }) => {
    test.skip(!isMobile, 'apenas no projeto mobile');
    await presetConsent(page);
    await page.goto('/');
    await page.evaluate(() => window.scrollTo(0, 400));
    const toggle = page.getByRole('button', { name: /abrir menu/i });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await toggle.click();
    const drawer = page.getByRole('dialog', { name: 'Menu' });
    await expect(drawer).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');

    // regressão A1: a gaveta ocupa a altura da tela e os links aparecem
    const box = (await drawer.boundingBox())!;
    const viewport = page.viewportSize()!;
    expect(Math.round(box.y)).toBe(0);
    expect(Math.abs(box.height - viewport.height)).toBeLessThanOrEqual(2);
    for (const name of ['Início', 'Catálogo', 'Serviços', 'Sobre', 'Contato']) {
      const link = drawer.getByRole('link', { name, exact: true });
      await expect(link).toBeVisible();
      await expect(link).toBeInViewport();
    }

    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();
    await expect(toggle).toBeFocused();

    await toggle.click();
    await drawer.getByRole('link', { name: 'Serviços', exact: true }).click();
    await expect(page).toHaveURL(/\/servicos$/);
    await expect(drawer).toBeHidden();
    expect(consoleErrors).toEqual([]);
  });

  test('banner de cookies compacto e barra inferior sem cobrir conteúdo', async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, 'apenas no projeto mobile');
    await page.goto('/');
    // O banner aparece antes da Home (lazy) montar: mede só depois do hero existir.
    await expect(page.locator('#hero-title')).toBeVisible();
    const viewport = page.viewportSize()!;
    const banner = page.getByTestId('cookie-banner');
    await expect(banner).toBeVisible();
    const bannerBox = (await banner.boundingBox())!;
    expect(bannerBox.height).toBeLessThan(viewport.height * 0.3);
    const heroCta = page
      .locator('main')
      .getByRole('link', { name: /solicitar orçamento/i })
      .first();
    const ctaBox = (await heroCta.boundingBox())!;
    expect(ctaBox.y + ctaBox.height).toBeLessThanOrEqual(bannerBox.y);
    await page.getByRole('button', { name: /^recusar$/i }).click();

    const bar = page.getByTestId('mobile-contact-bar');
    await expect(bar).toBeVisible();
    await expect(bar.getByRole('link', { name: /pedir orçamento/i })).toBeVisible();
    await expect(bar.getByRole('link', { name: /instagram/i })).toBeVisible();
    // A página cresce enquanto rola (seções reveladas, imagens): rola até o fim estabilizar.
    await expect
      .poll(async () =>
        page.evaluate(() => {
          window.scrollTo(0, document.documentElement.scrollHeight);
          return (
            Math.ceil(window.scrollY + window.innerHeight) >= document.documentElement.scrollHeight
          );
        }),
      )
      .toBe(true);
    const footerBtn = page.getByRole('button', { name: /preferências de cookies/i });
    const fb = (await footerBtn.boundingBox())!;
    const barBox = (await bar.boundingBox())!;
    expect(fb.y + fb.height).toBeLessThanOrEqual(barBox.y + 1);
  });

  test('catálogo: chip da categoria ativa visível', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'apenas no projeto mobile');
    await presetConsent(page);
    await page.goto('/produtos?categoria=estofamentos');
    await expect(page.getByRole('button', { name: 'Estofamentos', exact: true })).toBeInViewport({
      ratio: 0.9,
    });
  });

  test('home: categorias logo após o hero e só 3 destaques', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'apenas no projeto mobile');
    await presetConsent(page);
    await page.goto('/');
    // A Home é carregada sob demanda (lazy): espera sair do placeholder antes de ler as seções.
    await expect(page.locator('#categorias-title')).toBeAttached();
    const sections = await page.$$eval('main > section', (els) =>
      els.map((e) => e.getAttribute('aria-labelledby')),
    );
    expect(sections.slice(0, 2)).toEqual(['hero-title', 'categorias-title']);
    await page.locator('#destaques-title').scrollIntoViewIfNeeded();
    const featured = page.locator('section[aria-labelledby="destaques-title"] ul > li');
    await expect(featured.filter({ visible: true })).toHaveCount(3);
  });

  test('catálogo: resultados e dica de serviço aparecem na primeira tela', async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, 'apenas no projeto mobile');
    await presetConsent(page);
    await page.goto('/produtos');
    await expect(page.getByRole('searchbox', { name: /buscar por nome/i })).toBeInViewport();
    await expect(page.getByTestId('product-grid').locator('li').first()).toBeInViewport();
    await page.goto('/produtos?q=reparo');
    await expect(page.getByTestId('service-hint')).toBeInViewport();
    const hint = (await page.getByTestId('service-hint').boundingBox())!;
    const bar = (await page.getByTestId('mobile-contact-bar').boundingBox())!;
    expect(hint.y + hint.height).toBeLessThanOrEqual(bar.y);
  });

  test('barra inferior a 360px: rótulos em uma linha', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'apenas no projeto mobile');
    await presetConsent(page);
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto('/');
    for (const loc of [
      page.getByTestId('floating-contact'),
      page.getByTestId('mobile-bar-secondary'),
    ]) {
      const box = (await loc.boundingBox())!;
      expect(box.height).toBeLessThanOrEqual(52);
      expect(await loc.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    }
    await expect(page.getByTestId('floating-contact')).toHaveText(/^\s*orçamento\s*$/i, {
      useInnerText: true,
    });
  });

  test('alvos de toque principais têm pelo menos 44px', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'apenas no projeto mobile');
    await presetConsent(page);
    await page.goto('/');
    for (const loc of [
      page.getByRole('button', { name: /abrir menu/i }),
      page
        .locator('main')
        .getByRole('link', { name: /solicitar orçamento/i })
        .first(),
      page.getByTestId('floating-contact'),
      page.getByTestId('mobile-bar-secondary'),
    ]) {
      const box = (await loc.boundingBox())!;
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.width).toBeGreaterThanOrEqual(44);
    }
  });
});
