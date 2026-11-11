// Rodada 2 UX — menu mobile, banner de cookies, barra inferior, FAQ, galeria/lightbox.
// Uso: node e2e/ux/r2-widgets.mjs <pastaSaida> [m360|m390|d1366]
import { chromium } from '@playwright/test';

const OUT = process.argv[2];
const VP = process.argv[3] || 'm360';
const BASE = process.env.BASE_URL || 'http://localhost:5173';
const VIEWPORTS = {
  m390: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
  m360: { viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true },
  d1366: { viewport: { width: 1366, height: 768 } },
};
const mobile = VP.startsWith('m');
const b = await chromium.launch();
const ctx = await b.newContext({ ...VIEWPORTS[VP], deviceScaleFactor: 1, locale: 'pt-BR' });
const p = await ctx.newPage();
const errs = [];
p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
const shot = (n, o = {}) => p.screenshot({ path: `${OUT}/w-${VP}-${n}.png`, ...o });
const click = async (loc) => (mobile ? loc.tap() : loc.click());

// 1) Cookie banner: abrir preferências
await p.goto(BASE + '/', { waitUntil: 'networkidle' });
await p.waitForTimeout(500);
await shot('01-cookie');
const banner = p.getByTestId('cookie-banner');
const pref = banner.getByRole('button', { name: /prefer/i }).first();
if (await pref.count()) {
  await click(pref);
  await p.waitForTimeout(400);
  await shot('02-cookie-prefs');
  console.log('prefs texto:', (await banner.innerText().catch(() => '?')).slice(0, 600));
}
const salvar = banner.getByRole('button', { name: /salvar|confirmar|recusar/i }).first();
await click(salvar);
await p.waitForTimeout(400);
await shot('03-home-sem-banner');

if (mobile) {
  // 2) Menu mobile
  await click(p.getByRole('button', { name: /menu/i }).first());
  await p.waitForTimeout(500);
  await shot('04-menu-aberto');
  const box = await p
    .locator('#menu-mobile')
    .boundingBox()
    .catch(() => null);
  console.log('menu box', box);
  console.log(
    'links menu:',
    (await p.locator('#menu-mobile a, #menu-mobile button').allInnerTexts())
      .map((t) => t.trim())
      .join(' | '),
  );
  await click(p.locator('#menu-mobile').getByRole('link', { name: /servi/i }).first());
  await p.waitForLoadState('networkidle');
  await p.waitForTimeout(400);
  console.log(
    'após menu->Serviços',
    p.url(),
    'menu ainda visível?',
    await p
      .locator('#menu-mobile')
      .isVisible()
      .catch(() => false),
  );

  // 3) Barra inferior: o que cobre?
  const bar = await p.evaluate(() => {
    const els = [...document.querySelectorAll('a,button')].filter((e) => {
      const r = e.getBoundingClientRect();
      return (
        getComputedStyle(e.closest('[class*=fixed]') || e).position === 'fixed' &&
        r.bottom > innerHeight - 120
      );
    });
    return els.map((e) => e.innerText.trim());
  });
  console.log('barra inferior:', bar);
}

// 4) FAQ em Serviços
await p.goto(BASE + '/servicos', { waitUntil: 'networkidle' });
const faqQ = p.locator('summary', { hasText: /prazo de fabrica/i }).first();
await faqQ.scrollIntoViewIfNeeded();
await click(faqQ);
await p.waitForTimeout(400);
await click(p.locator('summary', { hasText: /tipos de reparo/i }).first());
await p.waitForTimeout(400);
await shot('05-faq-aberto');

// 5) Serviços: chips âncora (Reparos)
await p.goto(BASE + '/servicos', { waitUntil: 'networkidle' });
await click(p.getByRole('link', { name: /^reparos$/i }).first());
await p.waitForTimeout(800);
await shot('06-servicos-ancora-reparos');

// 6) Galeria da Home + lightbox
await p.goto(BASE + '/', { waitUntil: 'networkidle' });
const g = p
  .locator('section', { hasText: /a vida no rio/i })
  .locator('button, a')
  .first();
await g.scrollIntoViewIfNeeded();
await p.waitForTimeout(500);
await click(g);
await p.waitForTimeout(600);
await shot('07-lightbox');
console.log(
  'lightbox texto:',
  (
    await p
      .locator('[role=dialog]')
      .first()
      .innerText()
      .catch(() => 'sem dialog')
  )
    .replace(/\s+/g, ' ')
    .slice(0, 300),
);
const next = p.getByRole('button', { name: /próxim|seguinte|next/i }).first();
if (await next.count()) {
  await click(next);
  await p.waitForTimeout(400);
  await shot('08-lightbox-next');
}
if (mobile) {
  // swipe
  const vp = p.viewportSize();
  await p.mouse.move(vp.width - 40, vp.height / 2);
  await p.touchscreen.tap(vp.width / 2, vp.height / 2).catch(() => {});
}
await p.keyboard.press('Escape');
await p.waitForTimeout(300);
console.log(
  'dialog fechado?',
  !(await p
    .locator('[role=dialog]')
    .first()
    .isVisible()
    .catch(() => false)),
);

// 7) Produto: galeria/ampliar
await p.goto(BASE + '/produtos/canoa-aluminio-6m', { waitUntil: 'networkidle' });
await shot('09-produto-canoa6-top');
const amp = p.getByRole('button', { name: /ampliar/i }).first();
if (await amp.count()) {
  await click(amp);
  await p.waitForTimeout(500);
  await shot('10-produto-lightbox');
  await p.keyboard.press('Escape');
}
console.log(
  'miniaturas produto:',
  await p.locator('button[aria-label*="foto" i], button[aria-label*="imagem" i]').count(),
);

// 8) Hero strip (B5) clicável?
await p.goto(BASE + '/', { waitUntil: 'networkidle' });
const strip = await p.evaluate(() =>
  [...document.querySelectorAll('a')]
    .filter((a) => /^0\d/.test(a.innerText.trim()))
    .map((a) => `${a.innerText.replace(/\s+/g, ' ').trim()} -> ${a.getAttribute('href')}`),
);
console.log('itens numerados clicáveis:', strip);
await p.evaluate(() => window.scrollTo(0, 0));
await shot('11-hero');

console.log('erros console:', errs.length ? errs : 'nenhum');
await b.close();
