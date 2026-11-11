// Rodada 2 UX — formulários com erros de propósito e envio real (nome com "QA-TEST").
// Uso: node e2e/ux/r2-forms.mjs <pastaSaida> [m390|m360|d1366] [submit]
// Depois de usar "submit", apague os leads de teste (ver docs/UX-REPORT.md).
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
const errs = [];
p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
const shot = (n, o = {}) => p.screenshot({ path: `${OUT}/f-${VP}-${n}.png`, ...o });
const click = async (loc) => (mobile ? loc.tap() : loc.click());
const errors = async () =>
  (await p.locator('[role=alert], [id$="-error"], .text-red-700, [aria-live]').allInnerTexts())
    .map((t) => t.trim())
    .filter(Boolean);
const focused = () =>
  p.evaluate(() => document.activeElement?.getAttribute('name') || document.activeElement?.tagName);

await p.goto(BASE + '/', { waitUntil: 'networkidle' });
await click(p.getByTestId('cookie-banner').getByRole('button', { name: /recusar/i }));

// ---- ORÇAMENTO: pescador vindo da canoa 6 m
await p.goto(BASE + '/produtos/canoa-aluminio-6m', { waitUntil: 'networkidle' });
await click(p.getByRole('link', { name: /solicitar orçamento/i }).first());
await p.waitForLoadState('networkidle');
await p.waitForTimeout(500);
console.log('URL orçamento:', p.url());
await shot('q01-prefill');
const vals = await p.evaluate(() =>
  [...document.querySelectorAll('form select, form textarea')].map((e) => `${e.name}=${e.value}`),
);
console.log('pré-preenchido:', vals);

const submitQ = p.getByRole('button', { name: /solicitar orçamento/i }).last();
// 1) envia vazio
await click(submitQ);
await p.waitForTimeout(500);
console.log('vazio -> erros:', await errors(), 'foco:', await focused());
await shot('q02-vazio');
await shot('q02-vazio-full', { fullPage: true });
// 2) telefone incompleto, mensagem curta, sem consentimento
await p.getByLabel(/^nome/i).fill('João QA-TEST');
await p.getByLabel(/telefone/i).fill('9299');
await p.getByLabel(/conte o que/i).fill('oi');
await click(submitQ);
await p.waitForTimeout(500);
console.log('tel curto/msg curta -> erros:', await errors(), 'foco:', await focused());
await shot('q03-erros', { fullPage: true });
// 3) telefone com formatação variada
for (const tel of ['(92) 99999-000', '92 9 9999 0000', '+55 92 99999-0000', '999990000', 'abc']) {
  await p.getByLabel(/telefone/i).fill(tel);
  await click(submitQ);
  await p.waitForTimeout(300);
  const e = (await errors()).filter((t) => /telefone|fone|número/i.test(t));
  console.log(
    `tel "${tel}" ->`,
    e.length ? e : 'aceito',
    '| valor no campo:',
    await p.getByLabel(/telefone/i).inputValue(),
  );
}
await p.getByLabel(/telefone/i).fill('(92) 99999-0000');
await p
  .getByLabel(/conte o que/i)
  .fill('Quero uma canoa de uns 6 metros para pesca, com capota. Quanto fica e qual o prazo?');
await click(submitQ);
await p.waitForTimeout(500);
console.log('sem consentimento -> erros:', await errors(), 'foco:', await focused());
await shot('q04-sem-consent');

if (SUBMIT) {
  await p.getByRole('checkbox').check();
  const [resp] = await Promise.all([
    p.waitForResponse((r) => r.url().includes('/api/quotes') && r.request().method() === 'POST'),
    click(submitQ),
  ]);
  console.log('envio orçamento status', resp.status());
  await p.waitForTimeout(800);
  await shot('q05-sucesso');
  console.log(
    'sucesso texto:',
    (await p.locator('main').innerText()).replace(/\s+/g, ' ').slice(0, 500),
  );
  // voltar no celular após enviar
  await p.goBack();
  await p.waitForTimeout(800);
  console.log('voltar após envio ->', p.url());
}

// ---- CONTATO: erros
await p.goto(BASE + '/contato', { waitUntil: 'networkidle' });
const submitC = p.getByRole('button', { name: /enviar mensagem/i });
await click(submitC);
await p.waitForTimeout(500);
console.log('contato vazio -> erros:', await errors(), 'foco:', await focused());
await p.getByLabel(/^nome/i).fill('Maria QA-TEST');
await p.getByLabel(/telefone/i).fill('92 99999');
await p.getByLabel(/e-mail/i).fill('maria@gmail');
await p.getByLabel(/assunto/i).fill('a');
await p.getByLabel(/^mensagem/i).fill('ok');
await click(submitC);
await p.waitForTimeout(500);
console.log('contato inválido -> erros:', await errors());
await shot('c01-erros', { fullPage: true });
if (SUBMIT) {
  await p.getByLabel(/telefone/i).fill('92999990000');
  await p.getByLabel(/e-mail/i).fill('');
  await p.getByLabel(/assunto/i).fill('Motor de popa falhando');
  await p
    .getByLabel(/^mensagem/i)
    .fill(
      'Meu motor de popa está falhando na aceleração. Vocês fazem revisão de motor? Teste QA, desconsiderar.',
    );
  await p.getByRole('checkbox').check();
  const [resp] = await Promise.all([
    p.waitForResponse((r) => r.url().includes('/api/contact') && r.request().method() === 'POST'),
    click(submitC),
  ]);
  console.log('envio contato status', resp.status());
  await p.waitForTimeout(800);
  await shot('c02-sucesso');
  console.log(
    'contato sucesso texto:',
    (await p.locator('main').innerText()).replace(/\s+/g, ' ').slice(0, 400),
  );
}

// ---- Orçamento de manutenção/estofamento vindos de Serviços
for (const s of ['manutencao', 'estofamento', 'motores', 'reparos']) {
  await p.goto(`${BASE}/servicos#${s}`, { waitUntil: 'networkidle' });
  await p.goto(`${BASE}/orcamento?servico=${s}`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(400);
  const v = await p.evaluate(() =>
    [...document.querySelectorAll('form select, form textarea')]
      .map((e) => `${e.name}=${e.value}`)
      .join(' | '),
  );
  console.log(`?servico=${s}:`, v);
}
await shot('q06-estofamento-or-reparos');
console.log('erros console:', errs.length ? errs : 'nenhum');
await b.close();
