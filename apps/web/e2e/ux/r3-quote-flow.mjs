// Rodada 3 UX — "Trocar" produto, tipos de solicitação, "Corrigir o telefone" após envio.
// Uso: node e2e/ux/r3-quote-flow.mjs <pastaSaida> [m390|m360|d1366] [submit]
import { chromium } from '@playwright/test';

const OUT = process.argv[2];
const VP = process.argv[3] || 'm390';
const SUBMIT = process.argv[4] === 'submit';
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
const shot = (n, o = {}) => p.screenshot({ path: `${OUT}/q-${VP}-${n}.png`, ...o });
const click = async (loc) => (mobile ? loc.tap() : loc.click());
const form = () =>
  p.evaluate(() =>
    [...document.querySelectorAll('form input:not([type=hidden]), form select, form textarea')]
      .filter((e) => e.offsetParent)
      .map((e) => `${e.name}=${e.type === 'checkbox' ? e.checked : e.value}`)
      .join(' | '),
  );

await p.goto(BASE + '/', { waitUntil: 'networkidle' });
await click(p.getByTestId('cookie-banner').getByRole('button', { name: /recusar/i }));

await p.goto(BASE + '/orcamento?produto=lancha-aluminio-7m', { waitUntil: 'networkidle' });
await p.waitForTimeout(400);
console.log('campos visíveis com produto:', await form());
console.log('opções tipo:', await p.locator('select[name=requestType] option').allInnerTexts());
await click(p.getByRole('button', { name: /trocar/i }).first());
await p.waitForTimeout(500);
await shot('01-apos-trocar');
console.log('após Trocar:', await form());

// Motor falhando: fluxo a partir de Serviços > Manutenção
await p.goto(BASE + '/servicos#motores', { waitUntil: 'networkidle' });
await p.waitForTimeout(600);
await shot('02-servicos-motores');
await p.goto(BASE + '/orcamento', { waitUntil: 'networkidle' });
const opts = await p.locator('select[name=requestType] option').allInnerTexts();
const motorOpt = opts.find((o) => /problema|revis/i.test(o));
if (motorOpt) await p.locator('select[name=requestType]').selectOption({ label: motorOpt });
await p.waitForTimeout(300);
console.log('tipo motor problema ->', await form());
await shot('03-tipo-motor-problema');

if (SUBMIT) {
  await p.getByLabel(/^nome/i).fill('Carlos UX QA-TEST');
  await p.getByLabel(/telefone/i).fill('(92) 9 9123-4567');
  await p.getByLabel(/conte o que|mensagem|descreva/i).first().fill('Motor de popa 40 hp falhando na aceleração. Teste UX, desconsiderar.');
  await p.getByRole('checkbox').check();
  const [resp] = await Promise.all([
    p.waitForResponse((r) => r.url().includes('/api/quotes') && r.request().method() === 'POST'),
    click(p.getByRole('button', { name: /solicitar orçamento|enviar/i }).last()),
  ]);
  console.log('envio', resp.status());
  await p.waitForTimeout(700);
  await shot('04-sucesso');
  await click(p.getByRole('button', { name: /corrigir o telefone/i }).or(p.getByRole('link', { name: /corrigir o telefone/i })).first());
  await p.waitForTimeout(700);
  await shot('05-corrigir-telefone');
  console.log('após Corrigir:', await form(), '| foco:', await p.evaluate(() => document.activeElement?.getAttribute('name')));
}
await b.close();
