// Validação final UX — espera REAL do servidor (API "dormindo" no plano grátis).
// Abre /contato direto (sem chamar a API antes) e envia 1 contato real, registrando o que a
// pessoa vê a cada momento. Uso:
//   BASE_URL=https://<site> node e2e/ux/final-espera-real.mjs <pastaSaida> [m390|m360|d1366] [honeypot]
// "honeypot" preenche o campo anti-spam: a API responde 201 sem gravar (mede a espera sem criar lead).
import { chromium } from '@playwright/test';

const OUT = process.argv[2];
const VP = process.argv[3] || 'm390';
const HONEYPOT = process.argv[4] === 'honeypot';
const BASE = process.env.BASE_URL;
if (!BASE) throw new Error('Defina BASE_URL (ex.: BASE_URL=https://site.exemplo)');
const VIEWPORTS = {
  m390: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
  m360: { viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true },
  d1366: { viewport: { width: 1366, height: 768 } },
};
const mobile = VP.startsWith('m');
const b = await chromium.launch();
const ctx = await b.newContext({ ...VIEWPORTS[VP], deviceScaleFactor: 1, locale: 'pt-BR' });
const p = await ctx.newPage();
const tag = HONEYPOT ? 'hp' : 'real';
const shot = (n) => p.screenshot({ path: `${OUT}/e-${VP}-${tag}-${n}.png` });
const click = async (loc) => (mobile ? loc.tap() : loc.click());
const apiCalls = [];
p.on(
  'request',
  (r) =>
    r.url().includes('/api/') &&
    apiCalls.push(
      `${new Date().toISOString().slice(11, 19)} ${r.method()} ${r.url().replace(/^https?:\/\/[^/]+/, '')}`,
    ),
);

const t0 = Date.now();
await p.goto(BASE + '/contato', { waitUntil: 'domcontentloaded', timeout: 120000 });
await p.waitForLoadState('load', { timeout: 120000 }).catch(() => {});
console.log('página /contato carregou em', ((Date.now() - t0) / 1000).toFixed(1), 's');
const banner = p.getByTestId('cookie-banner');
if (await banner.count()) await click(banner.getByRole('button', { name: /recusar/i }));
await p
  .getByLabel(/^nome/i)
  .fill(HONEYPOT ? 'Teste espera (honeypot)' : 'UX QA-TEST contato produção');
await p.getByLabel(/telefone/i).fill('(92) 99999-0000');
await p.getByLabel(/assunto/i).fill('Teste de espera do servidor');
await p
  .getByLabel(/^mensagem/i)
  .fill('Mensagem de teste de experiência (QA-TEST). Por favor, desconsiderar.');
await p.getByRole('checkbox').check();
if (HONEYPOT)
  await p.evaluate(() => {
    const i = document.querySelector('input[name=website]');
    const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    set.call(i, 'x');
    i.dispatchEvent(new Event('input', { bubbles: true }));
  });

const sent = new Date();
console.log(
  'envio às',
  sent.toLocaleTimeString('pt-BR', { timeZone: 'America/Manaus' }),
  '(Manaus) /',
  sent.toISOString(),
);
let tResp = null;
const resp = p.waitForResponse(
  (r) => {
    const m = r.url().includes('/api/contact') && r.request().method() === 'POST';
    if (m) tResp = Date.now();
    return m;
  },
  { timeout: 180000 },
);
await click(p.getByRole('button', { name: /enviar mensagem/i }));
const t1 = Date.now();
for (const s of [1.5, 5, 15, 30]) {
  const wait = s * 1000 - (Date.now() - t1);
  if (wait > 0) await p.waitForTimeout(wait);
  const done = await p.getByText(/mensagem enviada/i).count();
  const formTxt = (await p.locator('main').innerText()).replace(/\s+/g, ' ');
  const btn = p.locator('form button[type=submit]');
  console.log(
    `${s}s: sucesso=${!!done} | botão="${await btn.innerText({ timeout: 1000 }).catch(() => '-')}" desabilitado=${await btn.isDisabled({ timeout: 1000 }).catch(() => '-')} | aviso=${formTxt.match(/Conectando[^.]*\.[^.]*\.[^.]*\./)?.[0] ?? '-'}`,
  );
  await shot(`${String(s).replace('.', '_')}s`);
  if (done) break;
}
const r = await resp.catch((e) => e);
tResp ??= Date.now();
console.log(
  'resposta API:',
  r.status ? r.status() : r.message,
  'após',
  ((tResp - t1) / 1000).toFixed(1),
  's (medido até a resposta)',
);
await p.waitForTimeout(800);
await shot('fim');
console.log('chamadas API:', apiCalls);
await b.close();
