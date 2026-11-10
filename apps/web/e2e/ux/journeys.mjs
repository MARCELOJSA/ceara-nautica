import { chromium } from '@playwright/test';
const OUT = process.argv[2];
const SUBMIT = process.argv[3] === 'submit';
const b = await chromium.launch();
const ctx = await b.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  deviceScaleFactor: 1,
  locale: 'pt-BR',
  reducedMotion: 'reduce',
});
const p = await ctx.newPage();
const errs = [];
p.on('console', (m) => {
  if (m.type() === 'error') errs.push(m.text());
});
const shot = (n) => p.screenshot({ path: `${OUT}/j-${n}.png` });
let taps = 0;
const tap = async (loc) => {
  taps++;
  await loc.first().tap();
  await p.waitForLoadState('networkidle');
  await p.waitForTimeout(300);
};
await p.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await tap(p.getByRole('button', { name: /recusar/i }));
taps = 0;
// P1 lancha via menu
await tap(p.getByRole('button', { name: /menu/i }));
await shot('menu-mobile');
const menuLinks = await p.locator('nav a, [role=dialog] a').allInnerTexts();
console.log('menu:', menuLinks.join(' | '));
await tap(p.getByRole('link', { name: /^embarca/i }).last());
console.log('P1 url', p.url(), 'taps', taps);
await tap(
  p.getByRole('button', { name: /^lanchas$/i }).or(p.getByRole('link', { name: /^lanchas$/i })),
);
console.log('P1 url', p.url(), 'taps', taps);
await tap(p.getByRole('link', { name: /Lancha de Alumínio 7/i }));
console.log('P1 url', p.url(), 'taps', taps);
await tap(
  p
    .getByRole('link', { name: /solicitar orçamento/i })
    .filter({ hasNotText: 'zzz' })
    .nth(0),
);
console.log('P1 url', p.url(), 'taps', taps);
await shot('p1-orcamento-prefill');
await p.screenshot({ path: `${OUT}/j-p1-orcamento-full.png`, fullPage: true });
// P2 canoa from home categories
await p.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
const y = await p.evaluate(() => {
  const a = [...document.querySelectorAll('a')].find(
    (a) => a.getAttribute('href') === '/produtos?categoria=canoas',
  );
  return a ? a.getBoundingClientRect().top + scrollY : null;
});
console.log('P2 canoas card at y', y, '(scrolls ~', Math.round((y / 844) * 10) / 10, 'telas)');
await p.goto('http://localhost:5173/produtos?categoria=canoas', { waitUntil: 'networkidle' });
const canoes = await p.locator('article, li').filter({ hasText: /canoa/i }).count();
console.log('canoas items', canoes);
await p.locator('a[href^="/produtos/canoa"]').first().tap();
await p.waitForLoadState('networkidle');
console.log('P2 detail', p.url());
await p.screenshot({ path: `${OUT}/j-p2-canoa-detail-full.png`, fullPage: true });
// search
await p.goto('http://localhost:5173/produtos', { waitUntil: 'networkidle' });
for (const q of ['motor', 'yamaha', 'canoa', 'reparo', 'manutenção']) {
  await p.getByPlaceholder(/buscar/i).fill(q);
  await p.waitForTimeout(700);
  console.log(
    'search',
    q,
    '->',
    await p
      .locator('text=/resultado/')
      .first()
      .innerText()
      .catch(() => '?'),
  );
}
await shot('search-reparo');
// P3 motor detail
await p.goto('http://localhost:5173/produtos?categoria=motores-de-popa', {
  waitUntil: 'networkidle',
});
await p.locator('a[href^="/produtos/"]').filter({ hasText: /motor/i }).first().tap();
await p.waitForLoadState('networkidle');
console.log('P3 detail', p.url());
await p.screenshot({ path: `${OUT}/j-p3-motor-detail-full.png`, fullPage: true });
await tap(p.getByRole('link', { name: /solicitar orçamento/i }).first());
console.log('P3 orc url', p.url());
await shot('p3-orcamento');
// P4 manutencao
await p.goto('http://localhost:5173/servicos', { waitUntil: 'networkidle' });
await p
  .getByRole('link', { name: /agendar manuten/i })
  .first()
  .tap();
await p.waitForLoadState('networkidle');
await p.waitForTimeout(400);
console.log('P4 url', p.url());
await p.screenshot({ path: `${OUT}/j-p4-orcamento-manut-full.png`, fullPage: true });
console.log('cat options', await p.locator('select').first().locator('option').allInnerTexts());
// floating button
await p.goto('http://localhost:5173/produtos', { waitUntil: 'networkidle' });
await p.getByTestId('floating-contact').tap();
await p.waitForLoadState('networkidle');
console.log('floating ->', p.url());
// validation errors + submit
await p.goto('http://localhost:5173/orcamento?servico=manutencao', { waitUntil: 'networkidle' });
await p
  .getByRole('button', { name: /solicitar orçamento/i })
  .last()
  .tap();
await p.waitForTimeout(500);
await shot('form-errors');
await p.screenshot({ path: `${OUT}/j-form-errors-full.png`, fullPage: true });
if (SUBMIT) {
  await p.getByLabel(/^nome/i).fill('UX-TEST');
  await p.getByLabel(/telefone/i).fill('92999990000');
  await p
    .getByLabel(/conte o que/i)
    .fill('Teste de UX automatizado — por favor desconsiderar. Manutenção de casco de alumínio.');
  await p.getByRole('checkbox').check();
  const [resp] = await Promise.all([
    p.waitForResponse((r) => r.url().includes('/api/quotes')),
    p
      .getByRole('button', { name: /solicitar orçamento/i })
      .last()
      .tap(),
  ]);
  console.log('submit status', resp.status());
  await p.waitForTimeout(800);
  await shot('form-success');
}
console.log('console errors', errs);
await b.close();
