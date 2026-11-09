import { DEMO_PRODUCTS } from '@cn/shared';
import { expect, presetConsent, test } from './fixtures';

test.describe('fluxos principais', () => {
  test('banner de cookies aparece na primeira visita e some após recusar', async ({ page, consoleErrors }) => {
    await page.goto('/');
    const banner = page.getByRole('heading', { name: /privacidade e cookies/i });
    await expect(banner).toBeVisible();
    await page.getByRole('button', { name: /^recusar$/i }).click();
    await expect(banner).toBeHidden();
    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(banner).toBeHidden();
    expect(consoleErrors).toEqual([]);
  });

  test('catálogo filtra por categoria e busca, sincronizando a URL', async ({ page, consoleErrors }) => {
    await presetConsent(page);
    await page.goto('/produtos');
    await page.getByRole('button', { name: 'Canoas', exact: true }).click();
    await expect(page).toHaveURL(/categoria=canoas/);
    const cards = page.getByTestId('product-grid').getByRole('heading', { level: 2 });
    await expect(cards).toHaveCount(DEMO_PRODUCTS.filter((p) => p.category === 'canoas').length);
    await page.getByRole('searchbox', { name: /buscar por nome/i }).fill('6 m');
    await expect(page).toHaveURL(/q=6\+m|q=6%20m/);
    await expect(cards).toHaveCount(1);
    await page.getByRole('searchbox', { name: /buscar por nome/i }).fill('zzz');
    await expect(page.getByTestId('empty-state')).toBeVisible();
    expect(consoleErrors).toEqual([]);
  });

  test('produto: galeria com lightbox acessível e CTA de orçamento pré-preenchido', async ({ page, consoleErrors }) => {
    await presetConsent(page);
    const product = DEMO_PRODUCTS.find((p) => p.images.length > 1)!;
    await page.goto(`/produtos/${product.slug}`);
    await page.getByRole('button', { name: /ampliar/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await page.keyboard.press('ArrowRight');
    await expect(dialog.getByText(`2 / ${product.images.length}`)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();

    await page.locator('main').getByRole('link', { name: /solicitar orçamento/i }).first().click();
    await expect(page).toHaveURL(new RegExp(`/orcamento\\?produto=${product.slug}`));
    await expect(page.getByText('Produto selecionado', { exact: true })).toBeVisible();
    await expect(page.getByLabel(/modelo de referência/i)).toHaveValue(product.slug);
    expect(consoleErrors).toEqual([]);
  });

  test('orçamento: envio com sucesso (POST /api/quotes)', async ({ page, consoleErrors }) => {
    await presetConsent(page);
    await page.goto('/orcamento?categoria=botes');
    await expect(page.getByLabel(/categoria/i)).toHaveValue('botes');
    await page.getByLabel(/^nome/i).fill('Cliente Teste');
    await page.getByLabel(/telefone/i).fill('(92) 98888-7777');
    await page.getByLabel(/conte o que você precisa/i).fill('Preciso de um bote para pesca esportiva.');
    await page.getByRole('checkbox', { name: /autorizo/i }).check();
    const [req] = await Promise.all([
      page.waitForRequest((r) => r.url().endsWith('/api/quotes') && r.method() === 'POST'),
      page.getByRole('button', { name: /solicitar orçamento/i }).last().click(),
    ]);
    expect(req.postDataJSON()).toMatchObject({ category: 'botes', consent: true, name: 'Cliente Teste' });
    await expect(page.getByRole('heading', { name: /pedido de orçamento enviado/i })).toBeVisible();
    expect(consoleErrors).toEqual([]);
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
    expect(consoleErrors).toEqual([]);
  });

  test('sem número de WhatsApp os CTAs levam para páginas do site', async ({ page }) => {
    await presetConsent(page);
    await page.goto('/');
    await expect(page.locator('a[href*="wa.me"]')).toHaveCount(0);
    await expect(page.getByTestId('floating-contact')).toHaveAttribute('href', '/orcamento');
  });
});

test.describe('mobile', () => {
  test('menu em drawer acessível (abre, prende foco, fecha com Esc)', async ({ page, isMobile, consoleErrors }) => {
    test.skip(!isMobile, 'apenas no projeto mobile');
    await presetConsent(page);
    await page.goto('/');
    const toggle = page.getByRole('button', { name: /abrir menu/i });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await toggle.click();
    const drawer = page.getByRole('dialog', { name: 'Menu' });
    await expect(drawer).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();
    await expect(toggle).toBeFocused();

    await toggle.click();
    await drawer.getByRole('link', { name: 'Serviços' }).click();
    await expect(page).toHaveURL(/\/servicos$/);
    await expect(drawer).toBeHidden();
    expect(consoleErrors).toEqual([]);
  });

  test('alvos de toque principais têm pelo menos 44px', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'apenas no projeto mobile');
    await presetConsent(page);
    await page.goto('/');
    for (const loc of [
      page.getByRole('button', { name: /abrir menu/i }),
      page.locator('main').getByRole('link', { name: /solicitar orçamento/i }).first(),
      page.getByTestId('floating-contact'),
    ]) {
      const box = await loc.boundingBox();
      expect(box!.height).toBeGreaterThanOrEqual(44);
      expect(box!.width).toBeGreaterThanOrEqual(44);
    }
  });
});
