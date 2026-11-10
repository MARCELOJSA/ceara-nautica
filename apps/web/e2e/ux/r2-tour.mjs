// Rodada 2 UX — tour de páginas (somente leitura). Uso:
//   node e2e/ux/r2-tour.mjs <pastaSaida> [m390|m360|d1366|d1920] [rotas separadas por vírgula]
import { chromium } from '@playwright/test';

const OUT = process.argv[2];
const VP = process.argv[3] || 'm390';
const ROUTES = (
  process.argv[4] ||
  '/,/produtos,/produtos/lancha-aluminio-7m,/servicos,/sobre,/contato,/orcamento,/politica-de-privacidade,/nao-existe'
).split(',');
const BASE = process.env.BASE_URL || 'http://localhost:5173';
const VIEWPORTS = {
  m390: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
  m360: { viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true },
  d1366: { viewport: { width: 1366, height: 768 } },
  d1920: { viewport: { width: 1920, height: 1080 } },
};

const b = await chromium.launch();
const ctx = await b.newContext({ ...VIEWPORTS[VP], deviceScaleFactor: 1, locale: 'pt-BR' });
const p = await ctx.newPage();
const errs = [];
p.on('console', (m) => m.type() === 'error' && errs.push(`${p.url()} :: ${m.text()}`));
p.on('pageerror', (e) => errs.push(`${p.url()} :: ${e.message}`));

let first = true;
for (const r of ROUTES) {
  await p.goto(BASE + r, { waitUntil: 'networkidle' });
  await p.waitForTimeout(600);
  const name = `${VP}${r.replace(/[/?=&]+/g, '_') || '_home'}`;
  if (first) {
    await p.screenshot({ path: `${OUT}/${name}-cookie.png` });
    const btn = p.getByRole('button', { name: /recusar/i });
    if (await btn.count()) await btn.first().click();
    first = false;
    await p.waitForTimeout(300);
  }
  await p.screenshot({ path: `${OUT}/${name}-top.png` });
  // rola até o fim para disparar animações/lazy e captura a página inteira
  const h = await p.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 500) {
    await p.evaluate((yy) => window.scrollTo(0, yy), y);
    await p.waitForTimeout(80);
  }
  await p.evaluate(() => window.scrollTo(0, 0));
  await p.waitForTimeout(400);
  await p.screenshot({ path: `${OUT}/${name}-full.png`, fullPage: true });
  const vw = await p.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
  console.log(r, 'altura', h, 'telas', (h / VIEWPORTS[VP].viewport.height).toFixed(1), 'overflowX', vw[0] > vw[1]);
}
console.log('erros console:', errs.length ? errs : 'nenhum');
await b.close();
