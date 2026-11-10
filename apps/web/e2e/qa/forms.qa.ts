/**
 * AGENT 03 — formulários: validação no cliente, honeypot, tratamento de erros
 * e envio REAL para a API (leads marcados com "QA-TEST" — apagar após o QA).
 */
import { expect, test, type Page } from '@playwright/test';
import { QA_MARK, presetConsent, productSlugs, watchPage } from './qa-helpers';

function trackPosts(page: Page) {
  const posts: string[] = [];
  page.on('request', (r) => {
    if (r.method() === 'POST' && r.url().includes('/api/')) posts.push(r.url());
  });
  return posts;
}

test.describe('validação no cliente (nenhum POST com dados inválidos)', () => {
  test.beforeEach(async ({ page }) => presetConsent(page));

  test('contato: vazio, telefone inválido, e-mail inválido, mensagem > 2000', async ({ page }) => {
    const posts = trackPosts(page);
    await page.goto('/contato', { waitUntil: 'networkidle' });
    const send = page.getByRole('button', { name: /enviar mensagem/i });
    await send.click();
    await expect(page.getByText('Informe seu nome.')).toBeVisible();

    await page.getByLabel(/^nome/i).fill(`${QA_MARK} front`);
    await page.getByLabel(/telefone/i).fill('123<script>');
    await page.getByLabel(/e-mail/i).fill('nao-e-email');
    await page.getByLabel(/assunto/i).fill('Teste');
    await page.getByLabel(/mensagem/i).fill('x'.repeat(2001));
    await send.click();
    // mensagens do telefone mudaram na rodada 2 (QA-04): '123<script>' é incompleto
    await expect(
      page.getByText(/número incompleto|telefone inválido|apenas números/i),
    ).toBeVisible();
    await expect(page.getByText(/e-mail inválido/i)).toBeVisible();
    await expect(page.getByText(/máximo de 2000/i)).toBeVisible();
    await expect(page.getByText(/autorizar o contato/i)).toBeVisible();
    expect(posts).toEqual([]);
  });

  test('orçamento: sem consentimento LGPD não envia', async ({ page }) => {
    const posts = trackPosts(page);
    await page.goto('/orcamento', { waitUntil: 'networkidle' });
    await page.getByLabel(/^nome/i).fill(`${QA_MARK} front`);
    await page.getByLabel(/telefone/i).fill('(92) 98888-7777');
    await page.getByLabel(/conte o que você precisa/i).fill('Preciso de um orçamento de teste QA.');
    await page
      .getByRole('button', { name: /solicitar orçamento/i })
      .last()
      .click();
    await expect(page.getByText(/autorizar o contato/i)).toBeVisible();
    expect(posts).toEqual([]);
  });

  test('honeypot "website" está fora da tela, fora do tab e oculto para leitores de tela', async ({
    page,
  }) => {
    for (const path of ['/contato', '/orcamento']) {
      await page.goto(path, { waitUntil: 'networkidle' });
      const hp = page.locator('input[name="website"]');
      await expect(hp).toHaveCount(1);
      await expect(hp).toHaveAttribute('tabindex', '-1');
      await expect(hp).toHaveAttribute('autocomplete', 'off');
      expect(await hp.evaluate((el) => !!el.closest('[aria-hidden="true"]'))).toBe(true);
      const box = await hp.boundingBox();
      expect(box === null || box.x + box.width < 0).toBe(true);
    }
  });

  test('erro 500 da API mostra mensagem amigável, sem detalhes técnicos', async ({ page }) => {
    await page.route('**/api/contact', (r) =>
      r.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Erro interno do servidor: Invalid prisma.contactMessage.create() at C:\\app',
        }),
      }),
    );
    await page.goto('/contato', { waitUntil: 'networkidle' });
    await page.getByLabel(/^nome/i).fill(`${QA_MARK} erro`);
    await page.getByLabel(/telefone/i).fill('(92) 98888-7777');
    await page.getByLabel(/assunto/i).fill('Teste');
    await page.getByLabel(/mensagem/i).fill('Mensagem de teste do QA com mais de dez caracteres.');
    await page.getByRole('checkbox', { name: /autorizo/i }).check();
    await page.getByRole('button', { name: /enviar mensagem/i }).click();
    await expect(page.getByText(/não foi possível enviar agora/i)).toBeVisible();
    await expect(page.locator('main')).not.toContainText(/prisma|C:\\/i);
  });
});

test.describe.serial('envio REAL para a API (grava lead QA-TEST)', () => {
  test('contato com payload XSS/unicode é aceito e a UI não executa nada', async ({ page }) => {
    await presetConsent(page);
    const issues = watchPage(page);
    let xss = false;
    page.on('dialog', async (d) => {
      xss = true;
      await d.dismiss();
    });
    await page.goto('/contato', { waitUntil: 'networkidle' });
    await page.getByLabel(/^nome/i).fill(`${QA_MARK} <img src=x onerror=alert(1)> Conceição 🚤`);
    await page.getByLabel(/telefone/i).fill('(92) 98888-7777');
    await page.getByLabel(/e-mail/i).fill('qa-test@example.com');
    await page.getByLabel(/assunto/i).fill('QA segurança <script>alert(2)</script>');
    await page
      .getByLabel(/mensagem/i)
      .fill('Mensagem automática do AGENT 03 (QA). Pode apagar. "\'><svg onload=alert(3)>');
    await page.getByRole('checkbox', { name: /autorizo/i }).check();
    const [res] = await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/api/contact') && r.request().method() === 'POST',
      ),
      page.getByRole('button', { name: /enviar mensagem/i }).click(),
    ]);
    test.info().annotations.push({ type: 'POST /api/contact', description: String(res.status()) });
    expect([201, 429]).toContain(res.status());
    if (res.status() === 201) {
      await expect(page.getByRole('heading', { name: /mensagem enviada/i })).toBeVisible();
      const body = await res.json();
      expect(Object.keys(body).sort()).toEqual(['id', 'ok']);
    } else {
      await expect(page.getByText(/muitas tentativas/i)).toBeVisible();
    }
    expect(xss).toBe(false);
    expect(issues.console.filter((c) => !/429/.test(c))).toEqual([]);
  });

  test('orçamento a partir de um produto real é aceito (201) com UTM anexada', async ({
    page,
    request,
  }) => {
    await presetConsent(page);
    const [slug] = await productSlugs(request);
    await page.goto(`/orcamento?produto=${slug}&utm_source=qa-test&utm_campaign=agent03`, {
      waitUntil: 'networkidle',
    });
    await page.getByLabel(/^nome/i).fill(`${QA_MARK} orçamento e2e`);
    await page.getByLabel(/telefone/i).fill('92988887777');
    await page
      .getByLabel(/conte o que você precisa/i)
      .fill('Pedido automático do AGENT 03 (QA). Pode apagar.');
    await page.getByRole('checkbox', { name: /autorizo/i }).check();
    const [req, res] = await Promise.all([
      page.waitForRequest((r) => r.url().includes('/api/quotes') && r.method() === 'POST'),
      page.waitForResponse(
        (r) => r.url().includes('/api/quotes') && r.request().method() === 'POST',
      ),
      page
        .getByRole('button', { name: /solicitar orçamento/i })
        .last()
        .click(),
    ]);
    const sent = req.postDataJSON();
    expect(sent).toMatchObject({ productSlug: slug, consent: true, website: '' });
    expect(sent.utm).toMatchObject({ utm_source: 'qa-test', utm_campaign: 'agent03' });
    test.info().annotations.push({ type: 'POST /api/quotes', description: String(res.status()) });
    expect([201, 429]).toContain(res.status());
    if (res.status() === 201)
      await expect(page.getByRole('heading', { name: /orçamento enviado/i })).toBeVisible();
  });
});
