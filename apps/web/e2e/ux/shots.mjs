import { chromium } from '@playwright/test';
const OUT = process.argv[2];
const pages = [
  ['home', '/'],
  ['produtos', '/produtos'],
  ['lanchas', '/produtos?categoria=lanchas'],
  ['canoas', '/produtos?categoria=canoas'],
  ['motores', '/produtos?categoria=motores-de-popa'],
  ['servicos', '/servicos'],
  ['sobre', '/sobre'],
  ['contato', '/contato'],
  ['orcamento', '/orcamento'],
  ['detalhe-lancha', '/produtos/lancha-cargueira-iguaracu-9m'],
];
const b = await chromium.launch();
for (const [vp, opts] of [
  ['desk', { viewport: { width: 1440, height: 900 } }],
  [
    'mob',
    { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 },
  ],
]) {
  const ctx = await b.newContext({ ...opts, locale: 'pt-BR' });
  const p = await ctx.newPage();
  const errs = [];
  p.on('console', (m) => {
    if (m.type() === 'error') errs.push(m.text());
  });
  for (const [n, u] of pages) {
    await p.goto('http://localhost:5173' + u, { waitUntil: 'networkidle' });
    await p.waitForTimeout(600);
    // scroll para disparar reveals
    await p.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 400) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 60));
      }
      window.scrollTo(0, 0);
    });
    await p.waitForTimeout(500);
    await p.screenshot({ path: `${OUT}/${vp}-${n}-fold.png` });
    await p.screenshot({ path: `${OUT}/${vp}-${n}-full.png`, fullPage: true });
    const h = await p.evaluate(() => document.body.scrollHeight);
    console.log(vp, n, 'height', h);
  }
  console.log(vp, 'console errors', errs);
  await ctx.close();
}
await b.close();
