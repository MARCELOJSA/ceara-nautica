// Rodada 2 UX — galeria/lightbox da Home, estado vazio da busca e trechos específicos.
// Uso: node e2e/ux/r2-extra.mjs <pastaSaida>
import { chromium } from '@playwright/test';

const OUT = process.argv[2];
const BASE = process.env.BASE_URL || 'http://localhost:5173';
const b = await chromium.launch();
const ctx = await b.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  deviceScaleFactor: 1,
  locale: 'pt-BR',
});
const p = await ctx.newPage();
const shot = (n, o = {}) => p.screenshot({ path: `${OUT}/x-${n}.png`, ...o });
await p.goto(BASE + '/', { waitUntil: 'networkidle' });
await p.getByTestId('cookie-banner').getByRole('button', { name: /recusar/i }).tap();

// faixa numerada do hero no 1º scroll (fica atrás da barra inferior?)
await p.evaluate(() => window.scrollTo(0, 260));
await p.waitForTimeout(300);
await shot('hero-faixa');

// galeria
const gal = p.locator('section[aria-labelledby="galeria-title"]');
await gal.scrollIntoViewIfNeeded();
await p.waitForTimeout(600);
await shot('galeria');
await gal.locator('button').first().tap();
await p.waitForTimeout(700);
await shot('lightbox-1');
console.log('dialog:', (await p.locator('[role=dialog]').last().innerText()).replace(/\s+/g, ' ').slice(0, 200));
// swipe para a próxima
await p.evaluate(async () => {
  const el = document.querySelector('[role=dialog] img') || document.querySelector('[role=dialog]');
  const r = el.getBoundingClientRect();
  const mk = (type, x) =>
    new TouchEvent(type, {
      bubbles: true,
      cancelable: true,
      touches: type === 'touchend' ? [] : [new Touch({ identifier: 1, target: el, clientX: x, clientY: r.top + r.height / 2 })],
      changedTouches: [new Touch({ identifier: 1, target: el, clientX: x, clientY: r.top + r.height / 2 })],
    });
  el.dispatchEvent(mk('touchstart', r.right - 30));
  el.dispatchEvent(mk('touchmove', r.left + 60));
  el.dispatchEvent(mk('touchend', r.left + 30));
});
await p.waitForTimeout(500);
console.log('após swipe:', (await p.locator('[role=dialog]').last().innerText()).replace(/\s+/g, ' ').slice(0, 120));
await shot('lightbox-swipe');
const close = p.locator('[role=dialog]').last().getByRole('button', { name: /fechar/i });
await close.tap();
await p.waitForTimeout(300);

// estado vazio da busca (rolado até a mensagem)
await p.goto(BASE + '/produtos?q=concerto', { waitUntil: 'networkidle' });
await p.getByText(/nenhum produto/i).scrollIntoViewIfNeeded();
await p.evaluate(() => window.scrollBy(0, 120));
await p.waitForTimeout(300);
await shot('vazio-concerto');
await p.goto(BASE + '/produtos?q=reparo', { waitUntil: 'networkidle' });
await p.getByText(/nenhum produto/i).scrollIntoViewIfNeeded();
await p.evaluate(() => window.scrollBy(0, 120));
await p.waitForTimeout(300);
await shot('vazio-reparo');

// motor: produto -> CTA de orçamento: o que vem pré-preenchido
await p.goto(BASE + '/produtos/motores-de-popa', { waitUntil: 'networkidle' });
await p.getByRole('link', { name: /solicitar orçamento/i }).first().tap();
await p.waitForLoadState('networkidle');
await p.waitForTimeout(400);
console.log('motor -> ', p.url(), await p.evaluate(() => [...document.querySelectorAll('form select, form textarea')].map((e) => `${e.name}=${e.value}`).join(' | ')));
await shot('orc-motor');
await b.close();
