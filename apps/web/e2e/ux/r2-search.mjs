// Rodada 2 UX — busca com erro de digitação, filtros e botão "voltar" do celular.
// Uso: node e2e/ux/r2-search.mjs <pastaSaida> [m390|m360|d1366]
import { chromium } from '@playwright/test';

const OUT = process.argv[2];
const VP = process.argv[3] || 'm390';
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
const shot = (n, o = {}) => p.screenshot({ path: `${OUT}/s-${VP}-${n}.png`, ...o });
const click = async (loc) => (mobile ? loc.tap() : loc.click());
const state = async (label) => {
  const r = await p.evaluate(() => ({
    url: location.pathname + location.search,
    q: document.querySelector('input[type=search], input[placeholder*="Buscar" i]')?.value ?? null,
    count: [...document.querySelectorAll('p,span,div')].find((e) => /^\d+ resultados?$|nenhum/i.test(e.innerText?.trim() ?? ''))?.innerText ?? null,
    active: [...document.querySelectorAll('[aria-pressed=true], [aria-current=true], [aria-selected=true]')].map((e) => e.innerText.trim()).join(','),
    y: Math.round(scrollY),
  }));
  console.log(label.padEnd(28), JSON.stringify(r));
};

await p.goto(BASE + '/', { waitUntil: 'networkidle' });
await click(p.getByTestId('cookie-banner').getByRole('button', { name: /recusar/i }));
await click(p.getByRole('link', { name: /ver embarca/i }).first());
await p.waitForLoadState('networkidle');
await state('catálogo');
const input = p.getByPlaceholder(/buscar/i);
for (const q of ['reparo', 'repraro', 'manutencao', 'concerto', 'cano', 'canoa 6', 'canoa aluminio', 'motor', 'motr', 'lancha familia', 'estofado', 'yamaha']) {
  await input.fill(q);
  await p.waitForTimeout(800);
  await state(`busca "${q}"`);
  if (['repraro', 'reparo', 'motr', 'estofado'].includes(q)) await shot(`busca-${q}`);
}
// teclado: Enter na busca
await input.fill('canoa');
await input.press('Enter');
await p.waitForTimeout(800);
await state('Enter "canoa"');

// filtros: limpar busca, chip Canoas, abrir produto, voltar
await input.fill('');
await p.waitForTimeout(600);
await click(p.getByRole('button', { name: /^canoas$/i }).or(p.getByRole('link', { name: /^canoas$/i })).first());
await p.waitForTimeout(800);
await state('chip Canoas');
await p.evaluate(() => window.scrollTo(0, 900));
await p.waitForTimeout(300);
await click(p.locator('a[href="/produtos/canoa-aluminio-6m"]').first());
await p.waitForLoadState('networkidle');
await state('produto canoa 6m');
await p.goBack();
await p.waitForLoadState('networkidle');
await p.waitForTimeout(600);
await state('VOLTAR -> catálogo');
await shot('voltar-catalogo');

// busca + filtro juntos, abrir produto, voltar
await input.fill('7');
await p.waitForTimeout(800);
await state('Canoas + "7"');
await click(p.locator('a[href^="/produtos/canoa"]').first());
await p.waitForLoadState('networkidle');
await p.goBack();
await p.waitForLoadState('networkidle');
await p.waitForTimeout(600);
await state('VOLTAR (busca+filtro)');

// deep link motores: chip ativo visível?
await p.goto(BASE + '/produtos?categoria=motores-de-popa', { waitUntil: 'networkidle' });
await p.waitForTimeout(700);
await shot('motores-chip');
const chip = await p.evaluate(() => {
  const el = [...document.querySelectorAll('button,a')].find((e) => /motores de popa/i.test(e.innerText) && (e.getAttribute('aria-pressed') === 'true' || e.getAttribute('aria-current')));
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { left: Math.round(r.left), right: Math.round(r.right), vw: innerWidth };
});
console.log('chip motores ativo', chip);
await state('deep link motores');

// estado vazio de reparo: segue link para serviços
await input.fill('reparo');
await p.waitForTimeout(800);
const emptyLinks = await p.locator('main a').evaluateAll((as) => as.filter((a) => a.offsetParent).map((a) => `${a.innerText.trim()} -> ${a.getAttribute('href')}`));
console.log('links visíveis com busca reparo:', emptyLinks.filter((t) => /servi|orça|instagram|reparo/i.test(t)));

// 404
await p.goto(BASE + '/produtos/canoa-de-8m', { waitUntil: 'networkidle' });
await p.waitForTimeout(600);
await shot('produto-inexistente');
console.log('produto inexistente texto:', (await p.locator('main').innerText()).replace(/\s+/g, ' ').slice(0, 300));
await b.close();
