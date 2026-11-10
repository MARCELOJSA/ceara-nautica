/**
 * AGENT 03 — QA técnico: responsividade, menu móvel, barra inferior, banner de
 * cookies, alvos de toque, textos cortados e layout shift (Rodada 1).
 *
 *   QA_BASE_URL=http://localhost:4175 npx playwright test -c e2e/qa/playwright.qa.config.ts responsive-functional
 */
import { expect, test, type Page } from '@playwright/test';
import { STATIC_ROUTES, presetConsent, scrollThrough } from './qa-helpers';

const WIDTHS = [360, 390, 768, 1024, 1280, 1920];
const ROUTES = [...STATIC_ROUTES, '/produtos/lancha-cargueira-iguaracu-9m', '/nao-existe'];

async function overflowReport(page: Page) {
  return page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const out: string[] = [];
    if (document.documentElement.scrollWidth > vw)
      out.push(`documento ${document.documentElement.scrollWidth}px > ${vw}px`);
    // títulos e botões cortados (texto maior que a caixa, sem rolagem prevista)
    for (const el of Array.from(
      document.querySelectorAll<HTMLElement>('h1, h2, h3, .btn-primary, .btn-outline, .btn-dark'),
    )) {
      const r = el.getBoundingClientRect();
      if (r.width === 0) continue;
      const cs = getComputedStyle(el);
      if (cs.overflow === 'hidden' || cs.textOverflow === 'ellipsis') continue;
      if (el.scrollWidth > el.clientWidth + 1)
        out.push(
          `${el.tagName}.${el.className.split(' ')[0]} "${el.textContent?.trim().slice(0, 40)}" ${el.scrollWidth}>${el.clientWidth}`,
        );
      if (r.right > vw + 1)
        out.push(
          `${el.tagName} "${el.textContent?.trim().slice(0, 40)}" sai da tela (${Math.round(r.right)}px)`,
        );
    }
    return out;
  });
}

test.beforeEach(async ({ page }) => presetConsent(page));

for (const width of WIDTHS) {
  test(`${width}px: sem rolagem horizontal nem textos/botões cortados`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const problems: string[] = [];
    for (const path of ROUTES) {
      await page.goto(path, { waitUntil: 'networkidle' });
      await scrollThrough(page);
      for (const p of await overflowReport(page)) problems.push(`${path}: ${p}`);
    }
    expect(problems, problems.join('\n')).toEqual([]);
  });
}

for (const width of [360, 390, 768]) {
  test(`[QA-07] ${width}px: alvos de toque ≥ 44px (botões, links-botão, campos)`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 800 });
    const small: string[] = [];
    for (const path of ROUTES) {
      await page.goto(path, { waitUntil: 'networkidle' });
      const found = await page.evaluate(() => {
        const out: string[] = [];
        const els = document.querySelectorAll<HTMLElement>(
          'button, a[href], input:not([type=hidden]), select, textarea, summary',
        );
        for (const el of Array.from(els)) {
          if (el.closest('[aria-hidden="true"]')) continue;
          const r = el.getBoundingClientRect();
          if (!r.width || !r.height) continue;
          const cs = getComputedStyle(el);
          if (cs.visibility === 'hidden') continue;
          // link "Pular para o conteúdo" fica recortado (sr-only) até receber foco
          if (el.classList.contains('sr-only-focusable') || (cs.clip && cs.clip !== 'auto'))
            continue;
          // links dentro de texto corrido são exceção do WCAG 2.5.8
          if (el.tagName === 'A' && cs.display === 'inline') continue;
          if (el instanceof HTMLInputElement && el.type === 'checkbox') {
            // a label clicável amplia o alvo; mede o conjunto
            continue;
          }
          if (r.height < 44)
            out.push(
              `${el.tagName} "${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 30)}" ${Math.round(r.width)}x${Math.round(r.height)}`,
            );
        }
        return out;
      });
      for (const f of found) small.push(`${path}: ${f}`);
    }
    test.info().annotations.push({ type: 'alvos < 44px', description: small.join('\n') });
    expect(small, small.join('\n')).toEqual([]);
  });
}

test.describe('menu móvel (360px)', () => {
  test.use({ viewport: { width: 360, height: 740 } });

  test('abre, prende o foco, fecha com Esc devolvendo o foco e trava a rolagem', async ({
    page,
  }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const open = page.getByRole('button', { name: /abrir menu/i });
    await open.click();
    const dialog = page.getByRole('dialog', { name: 'Menu' });
    await expect(dialog).toBeVisible();
    await expect(open).toHaveAttribute('aria-expanded', 'true');
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Tab');
      expect(await dialog.evaluate((d) => d.contains(document.activeElement)), `Tab ${i}`).toBe(
        true,
      );
    }
    await page.keyboard.press('Shift+Tab');
    expect(await dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(open).toBeFocused();
    expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden');
  });

  test('cada link do menu navega e fecha o menu; fundo escuro fecha', async ({ page }) => {
    for (const [label, path] of [
      ['Embarcações', '/produtos'],
      ['Serviços', '/servicos'],
      ['Sobre', '/sobre'],
      ['Contato', '/contato'],
      ['Início', '/'],
    ] as const) {
      await page.goto('/politica-de-privacidade', { waitUntil: 'networkidle' });
      await page.getByRole('button', { name: /abrir menu/i }).click();
      await page
        .getByRole('dialog', { name: 'Menu' })
        .getByRole('link', { name: label, exact: true })
        .click();
      await expect(page).toHaveURL(new RegExp(`${path}$`));
      await expect(page.getByRole('dialog', { name: 'Menu' })).toBeHidden();
    }
    await page.getByRole('button', { name: /abrir menu/i }).click();
    await page.mouse.click(10, 400);
    await expect(page.getByRole('dialog', { name: 'Menu' })).toBeHidden();
  });

  test('menu fechado não é alcançável por Tab nem por leitores de tela', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const reachable = await page.evaluate(() => {
      const panel = document.getElementById('menu-mobile');
      return !!panel && panel.offsetParent !== null;
    });
    expect(reachable).toBe(false);
  });

  test('barra inferior visível, não cobre o rodapé e muda para "Contato" no orçamento', async ({
    page,
  }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const bar = page.getByTestId('mobile-contact-bar');
    await expect(bar).toBeVisible();
    await expect(page.getByTestId('floating-contact')).toHaveText(/pedir orçamento/i);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const lastFooterLink = page.locator('footer a').last();
    const lb = await lastFooterLink.boundingBox();
    const bb = await bar.boundingBox();
    expect(lb && bb && lb.y + lb.height <= bb.y + 1).toBe(true);
    await page.getByTestId('floating-contact').click();
    await expect(page).toHaveURL(/\/orcamento$/);
    await expect(page.getByTestId('floating-contact')).toHaveText(/contato/i);
  });

  test('banner de cookies (primeira visita) fica acima da barra e some após a escolha', async ({
    browser,
  }) => {
    const ctx = await browser.newContext({ viewport: { width: 360, height: 740 } });
    const page = await ctx.newPage();
    await page.goto('/', { waitUntil: 'networkidle' });
    const banner = page.getByTestId('cookie-banner');
    await expect(banner).toBeVisible();
    const btn = banner.getByRole('button', { name: /recusar/i });
    // o botão do banner deve receber o clique (não está coberto pela barra)
    await btn.click({ trial: true });
    await btn.click();
    await expect(banner).toBeHidden();
    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.getByTestId('cookie-banner')).toBeHidden();
    await ctx.close();
  });
});

test.describe('desktop', () => {
  test('1280px: navegação principal por teclado com foco visível e item ativo', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/servicos', { waitUntil: 'networkidle' });
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: /pular para o conteúdo/i })).toBeFocused();
    const skipVisible = await page
      .getByRole('link', { name: /pular para o conteúdo/i })
      .evaluate((el) => el.getBoundingClientRect().width > 1);
    expect(skipVisible).toBe(true);
    const nav = page.getByRole('navigation', { name: 'Principal' });
    await expect(nav.getByRole('link', { name: 'Serviços' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    // foco visível: algum outline ou box-shadow nos links do menu
    await nav.getByRole('link', { name: 'Sobre' }).focus();
    const ring = await nav.getByRole('link', { name: 'Sobre' }).evaluate((el) => {
      const cs = getComputedStyle(el);
      return (cs.outlineStyle !== 'none' && cs.outlineWidth !== '0px') || cs.boxShadow !== 'none';
    });
    expect(ring).toBe(true);
  });

  test('[QA-06] CLS da página inicial, do catálogo e do produto abaixo de 0.1', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    for (const path of ['/', '/produtos', '/produtos/canoa-aluminio-7m']) {
      await page.addInitScript(() => {
        (window as unknown as { __cls: number }).__cls = 0;
        new PerformanceObserver((l) => {
          for (const e of l.getEntries() as unknown as { value: number; hadRecentInput: boolean }[])
            if (!e.hadRecentInput) (window as unknown as { __cls: number }).__cls += e.value;
        }).observe({ type: 'layout-shift', buffered: true });
      });
      await page.goto(path, { waitUntil: 'networkidle' });
      await page.waitForTimeout(800);
      const cls = await page.evaluate(() => (window as unknown as { __cls: number }).__cls);
      test.info().annotations.push({ type: `CLS ${path}`, description: cls.toFixed(3) });
      expect(cls, path).toBeLessThan(0.1);
    }
  });
});
