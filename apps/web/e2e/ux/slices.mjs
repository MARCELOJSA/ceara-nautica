import { chromium } from '@playwright/test';
const [OUT, vpArg, ...names] = process.argv.slice(2);
const map = {
  home: '/',
  produtos: '/produtos',
  lanchas: '/produtos?categoria=lanchas',
  canoas: '/produtos?categoria=canoas',
  motores: '/produtos?categoria=motores-de-popa',
  servicos: '/servicos',
  sobre: '/sobre',
  contato: '/contato',
  orcamento: '/orcamento',
  'detalhe-lancha': '/produtos/lancha-cargueira-iguaracu-9m',
};
const vps = {
  desk: { viewport: { width: 1440, height: 900 } },
  mob: {
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 1,
  },
};
const b = await chromium.launch();
const ctx = await b.newContext({ ...vps[vpArg], locale: 'pt-BR', reducedMotion: 'reduce' });
const p = await ctx.newPage();
await p.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
const rec = p.getByRole('button', { name: /recusar/i });
if (await rec.count()) await rec.first().click();
const H = vpArg === 'desk' ? 1600 : 1500;
for (const n of names) {
  await p.goto('http://localhost:5173' + map[n], { waitUntil: 'networkidle' });
  await p.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 300) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 50));
    }
    window.scrollTo(0, 0);
  });
  await p.waitForTimeout(500);
  const h = await p.evaluate(() => document.body.scrollHeight);
  const w = vps[vpArg].viewport.width;
  for (let y = 0, i = 0; y < h; y += H, i++)
    await p.screenshot({
      path: `${OUT}/${vpArg}-${n}-s${i}.png`,
      fullPage: true,
      clip: { x: 0, y, width: w, height: Math.min(H, h - y) },
    });
  console.log(n, h, Math.ceil(h / H));
}
await b.close();
