/**
 * AGENT 03 — QA técnico funcional dos formulários (Rodada 1).
 * Validação campo a campo, foco no primeiro erro, estados de envio, erros de
 * rede/API (simulados com page.route) e envio REAL (nome com "QA-TEST").
 *
 *   QA_BASE_URL=http://localhost:4175 npx playwright test -c e2e/qa/playwright.qa.config.ts forms-functional
 *
 * Testes `[QA-xx]` reproduzem problemas do docs/QA-REPORT.md.
 */
import { expect, test, type Page, type Route } from '@playwright/test';
import { QA_MARK, presetConsent } from './qa-helpers';

const OK_PHONE = '(92) 98888-7777';

async function fillContact(page: Page, name = `${QA_MARK} contato`) {
  await page.getByLabel(/^nome/i).fill(name);
  await page.getByLabel(/telefone/i).fill(OK_PHONE);
  await page.getByLabel(/^assunto/i).fill('Assunto de teste');
  await page.getByLabel(/^mensagem/i).fill('Mensagem automática do QA (AGENT 03). Pode apagar.');
  await page.getByRole('checkbox', { name: /autorizo/i }).check();
}

async function fillQuote(page: Page, name = `${QA_MARK} orçamento`) {
  await page.getByLabel(/^nome/i).fill(name);
  await page.getByLabel(/telefone/i).fill(OK_PHONE);
  await page
    .getByLabel(/conte o que você precisa/i)
    .fill('Pedido automático do QA (AGENT 03). Pode apagar.');
  await page.getByRole('checkbox', { name: /autorizo/i }).check();
}

const submitContact = (page: Page) => page.getByRole('button', { name: /enviar mensagem/i });
const submitQuote = (page: Page) =>
  page.locator('form[aria-label="Formulário de orçamento"] button[type="submit"]');

test.beforeEach(async ({ page }) => presetConsent(page));

test.describe('validação no cliente', () => {
  test('contato vazio: mensagens em todos os obrigatórios e foco no primeiro erro', async ({
    page,
  }) => {
    await page.goto('/contato', { waitUntil: 'networkidle' });
    await submitContact(page).click();
    const errors = await page.locator('.field-error').allInnerTexts();
    expect(errors).toEqual([
      'Informe seu nome.',
      'Informe seu telefone/WhatsApp.',
      'Informe o assunto.',
      'A mensagem deve ter pelo menos 10 caracteres.',
      'É necessário autorizar o contato para enviar.',
    ]);
    await expect(page.getByLabel(/^nome/i)).toBeFocused();
    await expect(page.getByLabel(/^nome/i)).toHaveAttribute('aria-invalid', 'true');
  });

  test('erro some ao corrigir o campo (validação onTouched)', async ({ page }) => {
    await page.goto('/contato', { waitUntil: 'networkidle' });
    await submitContact(page).click();
    await page.getByLabel(/^nome/i).fill('Maria');
    await expect(page.getByText('Informe seu nome.')).toBeHidden();
  });

  test('[QA-03 corrigido] todas as mensagens de validação aparecem em português', async ({
    page,
  }) => {
    await page.goto('/contato', { waitUntil: 'networkidle' });
    await fillContact(page);
    await page.getByLabel(/^e-mail/i).fill(`${'a'.repeat(160)}@exemplo.com`);
    await submitContact(page).click();
    const emailErr = page.locator('.field-error').first();
    await expect(emailErr).toBeVisible();
    await expect(emailErr).not.toHaveText(/too big|expected|string/i);

    await page.goto('/orcamento', { waitUntil: 'networkidle' });
    await fillQuote(page);
    await page.getByLabel(/^cidade/i).fill('M'.repeat(121));
    await submitQuote(page).click();
    const cityErr = page.locator('.field-error').first();
    await expect(cityErr).toBeVisible();
    await expect(cityErr).not.toHaveText(/too big|expected|string/i);
  });

  test('[QA-04 corrigido] telefone em formatos brasileiros comuns é aceito', async ({ page }) => {
    await page.goto('/contato', { waitUntil: 'networkidle' });
    const tel = page.getByLabel(/telefone/i);
    const rejected: string[] = [];
    for (const v of [
      '(92) 99999-9999',
      '92999999999',
      '+55 92 99999-9999',
      '(92) 3234-5678',
      '(92) 9 9999-9999',
      '92 9 9999-9999',
      '+55 (92) 9 9999-9999',
    ]) {
      await tel.fill(v);
      await tel.blur();
      if ((await tel.getAttribute('aria-invalid')) === 'true') rejected.push(v);
    }
    expect(rejected, `recusados: ${rejected.join(' | ')}`).toEqual([]);
  });

  test('mensagens específicas do telefone e do assunto (rodada 2)', async ({ page }) => {
    await page.goto('/contato', { waitUntil: 'networkidle' });
    await fillContact(page);
    const tel = page.getByLabel(/telefone/i);
    const err = page.locator('.field-error');
    const cases: [string, string][] = [
      ['', 'Informe seu telefone/WhatsApp.'],
      ['(92) 9999', 'Número incompleto. Ex.: (92) 99999-9999'],
      ['99999-9999', 'Inclua o DDD. Ex.: (92) 99999-9999'],
      ['(00) 99999-9999', 'Telefone inválido. Ex.: (92) 99999-9999'],
      ['(92) 99999-99999', 'Telefone inválido. Ex.: (92) 99999-9999'],
    ];
    for (const [value, msg] of cases) {
      await tel.fill(value);
      await submitContact(page).click();
      await expect(err.filter({ hasText: msg }), value || '(vazio)').toBeVisible();
    }
    await tel.fill('(92) 99999-9999');
    await page.getByLabel(/^assunto/i).fill('a');
    await submitContact(page).click();
    await expect(page.getByText('Assunto muito curto (mín. 2 caracteres).')).toBeVisible();
    await page.getByLabel(/^assunto/i).fill('');
    await submitContact(page).click();
    await expect(page.getByText('Informe o assunto.')).toBeVisible();
  });

  test('limites: nome > 120 e mensagem > 2000 mostram o máximo', async ({ page }) => {
    await page.goto('/contato', { waitUntil: 'networkidle' });
    await fillContact(page, 'N'.repeat(121));
    await page.getByLabel(/^mensagem/i).fill('x'.repeat(2001));
    await submitContact(page).click();
    await expect(page.getByText('Máximo de 120 caracteres.')).toBeVisible();
    await expect(page.getByText('Máximo de 2000 caracteres.')).toBeVisible();
  });

  test('todos os campos visíveis dos formulários têm nome acessível', async ({ page }) => {
    for (const path of ['/contato', '/orcamento']) {
      await page.goto(path, { waitUntil: 'networkidle' });
      const unnamed = await page
        .locator(
          'main form input:not([type=hidden]):not([tabindex="-1"]), main form select, main form textarea',
        )
        .evaluateAll((els) =>
          els
            .filter((e) => {
              const id = e.id;
              return (
                !(id && document.querySelector(`label[for="${CSS.escape(id)}"]`)) &&
                !e.getAttribute('aria-label')
              );
            })
            .map((e) => e.outerHTML.slice(0, 80)),
        );
      expect(unnamed, path).toEqual([]);
    }
  });
});

test.describe('estados de envio (API simulada)', () => {
  test('envio: botão desabilitado com "Enviando…", sem duplo POST, sucesso com foco e reset', async ({
    page,
  }) => {
    let posts = 0;
    await page.route('**/api/contact', async (r: Route) => {
      posts++;
      await new Promise((res) => setTimeout(res, 1200));
      await r.fulfill({
        status: 201,
        contentType: 'application/json',
        body: '{"ok":true,"id":"c1"}',
      });
    });
    await page.goto('/contato', { waitUntil: 'networkidle' });
    await fillContact(page);
    const btn = submitContact(page);
    await btn.click();
    const sending = page.getByRole('button', { name: /enviando/i });
    await expect(sending).toBeDisabled();
    await sending.click({ force: true }).catch(() => {});
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { name: /mensagem enviada/i })).toBeVisible();
    expect(posts).toBe(1);
    await expect(page.getByRole('status').filter({ hasText: /mensagem enviada/i })).toBeFocused();
    await page.getByRole('button', { name: /enviar outra mensagem/i }).click();
    await expect(page.getByLabel(/^nome/i)).toHaveValue('');
    await expect(page.getByRole('checkbox', { name: /autorizo/i })).not.toBeChecked();
  });

  test('API fora do ar: mensagem amigável, dados preservados e reenvio funciona', async ({
    page,
  }) => {
    let fail = true;
    await page.route('**/api/quotes', (r) =>
      fail
        ? r.abort('connectionrefused')
        : r.fulfill({
            status: 201,
            contentType: 'application/json',
            body: '{"ok":true,"id":"q1"}',
          }),
    );
    await page.goto('/orcamento?produto=canoa-aluminio-7m', { waitUntil: 'networkidle' });
    await fillQuote(page);
    await submitQuote(page).click();
    await expect(page.getByText(/não foi possível conectar ao servidor/i)).toBeVisible();
    await expect(page.getByLabel(/^nome/i)).toHaveValue(`${QA_MARK} orçamento`);
    await expect(page.getByLabel(/modelo de referência/i)).toHaveValue('canoa-aluminio-7m');
    await expect(page.getByRole('checkbox', { name: /autorizo/i })).toBeChecked();
    await expect(submitQuote(page)).toBeEnabled();
    fail = false;
    await submitQuote(page).click();
    await expect(page.getByRole('heading', { name: /orçamento enviado/i })).toBeVisible();
  });

  test('429: mensagem amigável de muitas tentativas', async ({ page }) => {
    await page.route('**/api/contact', (r) =>
      r.fulfill({
        status: 429,
        contentType: 'application/json',
        body: '{"error":"Muitas requisições. Tente novamente em instantes."}',
      }),
    );
    await page.goto('/contato', { waitUntil: 'networkidle' });
    await fillContact(page);
    await submitContact(page).click();
    await expect(page.getByText(/muitas tentativas em pouco tempo/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /@cearanautica/i }).last()).toBeVisible();
  });

  test('400 com details: erro do servidor aparece no campo correspondente', async ({ page }) => {
    await page.route('**/api/contact', (r) =>
      r.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Dados inválidos.',
          details: { phone: ['Telefone inválido no servidor.'] },
        }),
      }),
    );
    await page.goto('/contato', { waitUntil: 'networkidle' });
    await fillContact(page);
    await submitContact(page).click();
    await expect(page.getByText('Telefone inválido no servidor.')).toBeVisible();
    await expect(page.getByText(/revise os campos destacados/i)).toBeVisible();
  });

  test('resposta não-JSON (proxy/HTML) vira erro amigável', async ({ page }) => {
    await page.route('**/api/contact', (r) =>
      r.fulfill({ status: 502, contentType: 'text/html', body: '<html>Bad gateway</html>' }),
    );
    await page.goto('/contato', { waitUntil: 'networkidle' });
    await fillContact(page);
    await submitContact(page).click();
    await expect(page.getByText(/não foi possível enviar agora/i)).toBeVisible();
  });
});

test.describe.serial('envio REAL para a API (grava lead QA-TEST)', () => {
  test('contato real → 201 e mensagem de sucesso', async ({ page }) => {
    await page.goto('/contato', { waitUntil: 'networkidle' });
    await fillContact(page, `${QA_MARK} funcional contato`);
    await page.getByLabel(/^e-mail/i).fill('qa-test@example.com');
    const [res] = await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/api/contact') && r.request().method() === 'POST',
      ),
      submitContact(page).click(),
    ]);
    expect([201, 429]).toContain(res.status());
    if (res.status() === 201)
      await expect(page.getByRole('heading', { name: /mensagem enviada/i })).toBeVisible();
    else await expect(page.getByText(/muitas tentativas/i)).toBeVisible();
  });

  test('orçamento real com serviço → 201 e payload coerente', async ({ page }) => {
    await page.goto('/orcamento?servico=reparos', { waitUntil: 'networkidle' });
    await fillQuote(page, `${QA_MARK} funcional orçamento`);
    await page.getByLabel(/^cidade/i).fill('Manaus');
    const [req, res] = await Promise.all([
      page.waitForRequest((r) => r.url().includes('/api/quotes') && r.method() === 'POST'),
      page.waitForResponse(
        (r) => r.url().includes('/api/quotes') && r.request().method() === 'POST',
      ),
      submitQuote(page).click(),
    ]);
    const sent = req.postDataJSON();
    expect(sent).toMatchObject({ requestType: 'reparo', city: 'Manaus', consent: true });
    expect([201, 429]).toContain(res.status());
    if (res.status() === 201)
      await expect(page.getByRole('heading', { name: /orçamento enviado/i })).toBeVisible();
  });
});
