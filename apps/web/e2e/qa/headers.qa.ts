/**
 * AGENT 03 — headers HTTP do SITE (hospedagem do build estático).
 *
 * Roda só quando QA_HEADERS_URL é informado, ex.:
 *   QA_HEADERS_URL=http://localhost:4174 npx playwright test -c e2e/qa/playwright.qa.config.ts headers
 *   QA_HEADERS_URL=https://www.cearanautica.com.br npx playwright test -c e2e/qa/playwright.qa.config.ts headers
 *
 * O `vite preview` NÃO envia headers de segurança (esperado: não é servidor de produção);
 * por isso, contra localhost, o teste é marcado como falha esperada [SEC-04].
 * Contra o domínio real ele precisa passar.
 */
import { expect, test } from '@playwright/test';

const target = process.env.QA_HEADERS_URL;

test.describe('headers de segurança do site', () => {
  test.skip(!target, 'defina QA_HEADERS_URL');

  test('documento HTML com CSP, HSTS, nosniff, frame-ancestors, Referrer/Permissions-Policy', async ({
    request,
  }) => {
    const isLocal = /localhost|127\.0\.0\.1/.test(target!);
    test.fail(
      isLocal,
      '[SEC-04] vite preview/local não envia headers de segurança — configurar na hospedagem',
    );
    const res = await request.get(`${target}/`);
    const h = res.headers();
    test.info().annotations.push({ type: 'headers recebidos', description: JSON.stringify(h) });
    expect(h['content-security-policy'], 'CSP').toMatch(/default-src/);
    expect(h['content-security-policy']).toMatch(/frame-ancestors 'none'|frame-ancestors 'self'/);
    expect(h['content-security-policy']).not.toMatch(/'unsafe-eval'/);
    expect(h['strict-transport-security'], 'HSTS').toMatch(/max-age=\d{7,}/);
    expect(h['x-content-type-options']).toBe('nosniff');
    expect(h['referrer-policy']).toMatch(/strict-origin-when-cross-origin|no-referrer/);
    expect(h['permissions-policy']).toBeDefined();
    expect(h['x-powered-by']).toBeUndefined();
  });

  test('assets com hash têm cache longo e index.html não é cacheado', async ({ request }) => {
    const isLocal = /localhost|127\.0\.0\.1/.test(target!);
    test.fail(isLocal, '[SEC-04] cache headers são da hospedagem');
    const html = await request.get(`${target}/`);
    expect(html.headers()['cache-control']).toMatch(/no-cache|max-age=0/);
    const asset = (await html.text()).match(/\/assets\/[^"]+\.js/)?.[0];
    expect(asset).toBeTruthy();
    const a = await request.get(`${target}${asset}`);
    expect(a.headers()['cache-control']).toMatch(
      /max-age=31536000.*immutable|immutable.*max-age=31536000/,
    );
  });

  test('arquivos sensíveis não são servidos', async ({ request }) => {
    for (const p of [
      '/.env',
      '/.env.example',
      '/.git/config',
      '/package.json',
      '/src/main.tsx',
      '/vite.config.ts',
    ]) {
      const r = await request.get(`${target}${p}`);
      const body = await r.text();
      // SPA pode devolver index.html (200) — o importante é não devolver o arquivo real
      expect(body, p).not.toMatch(
        /VITE_|DATABASE_URL|\[core\]|"devDependencies"|import React|defineConfig/,
      );
    }
  });

  test('sourcemaps não publicados', async ({ request }) => {
    const html = await (await request.get(`${target}/`)).text();
    const asset = html.match(/\/assets\/[^"]+\.js/)?.[0];
    const js = await (await request.get(`${target}${asset}`)).text();
    expect(js).not.toMatch(/sourceMappingURL=/);
  });
});
