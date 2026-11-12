// Validação final UX (site publicado ou local). Uso:
//   BASE_URL=https://<site> node e2e/ux/final-validacao.mjs <pastaSaida> [m390|m360|d1366] [espera|espera-real]
//   - sem 3º argumento: só navegação (buscas, orçamento por tipo, Sobre, Home). Nenhum lead é criado:
//     o teste "enviar sem descrever" intercepta /api/quotes e responde localmente.
//   - "espera": simula servidor lento (20 s) em contato e orçamento SEM gravar nada (resposta falsa 201),
//     e testa recarregar a página no meio da espera.
//   - "espera-real": igual, mas o orçamento segue para a API real depois de 20 s (cria 1 lead
//     "UXF QA-TEST orçamento" — apague depois).
import { chromium } from '@playwright/test';

const OUT = process.argv[2];
const VP = process.argv[3] || 'm390';
const MODE = process.argv[4] || '';
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
const cerr = [];
p.on('console', (m) => m.type() === 'error' && cerr.push(m.text()));
const shot = (n, o = {}) => p.screenshot({ path: `${OUT}/v-${VP}-${n}.png`, ...o });
const click = async (loc) => (mobile ? loc.tap() : loc.click());
const errs = async () =>
  (await p.locator('[id$="-error"], [role=alert]').allInnerTexts()).map((t) => t.trim()).filter(Boolean);
const main = async () => (await p.locator('main').innerText()).replace(/\s+/g, ' ');
const fake201 = (route) =>
  route.fulfill({ status: 201, contentType: 'application/json', body: '{"ok":true,"id":"ux-local"}' });

await p.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 120000 });
const banner = p.getByTestId('cookie-banner');
if (await banner.count()) await click(banner.getByRole('button', { name: /recusar/i }));

if (!MODE) {
  // UX-27: buscas com sintomas
  for (const q of ['motor falhando', 'motor não liga', 'barco furado']) {
    await p.goto(BASE + '/produtos?q=' + encodeURIComponent(q), { waitUntil: 'networkidle' });
    await p.waitForTimeout(500);
    const t = await main();
    const links = await p.locator('main a').evaluateAll((as) =>
      as
        .filter((a) => a.offsetParent)
        .map((a) => `${a.innerText.replace(/\s+/g, ' ').trim()} -> ${a.getAttribute('href')}`)
        .filter((s) => /servi|motor/i.test(s)),
    );
    console.log(`busca "${q}":`, t.match(/\d+ resultados?[^.]{0,40}/)?.[0], '| links:', links);
    await shot('busca-' + q.replace(/\s+/g, '-'));
  }

  // UX-30 / UX-28: orçamento por tipo
  for (const s of ['', '?servico=reparos', '?servico=motor-revisao', '?servico=motores']) {
    await p.goto(BASE + '/orcamento' + s, { waitUntil: 'networkidle' });
    await p.waitForTimeout(400);
    const head = await p.evaluate(() => {
      const h1 = document.querySelector('h1');
      const ta = document.querySelector('textarea');
      return {
        h1: h1?.innerText,
        sub: h1?.parentElement?.querySelector('p')?.innerText,
        how: [...document.querySelectorAll('main ol li')].map((e) => e.innerText.replace(/\s+/g, ' ')).slice(0, 3),
        msg: ta?.value,
        ph: ta?.placeholder,
        type: document.querySelector('select[name=requestType]')?.value,
      };
    });
    console.log(`orcamento${s || ' (sem parâmetro)'}:`, JSON.stringify(head));
    await shot('orc' + (s.replace(/[?=]/g, '-') || '-padrao'), { fullPage: true });
  }
  // UX-28: enviar sem descrever (resposta interceptada: nada é gravado)
  await p.route('**/api/quotes', fake201);
  await p.goto(BASE + '/orcamento?servico=motor-revisao', { waitUntil: 'networkidle' });
  await p.getByLabel(/^nome/i).fill('Teste local');
  await p.getByLabel(/telefone/i).fill('(92) 99999-0000');
  await p.getByRole('checkbox').check();
  await click(p.getByRole('button', { name: /solicitar orçamento|enviar/i }).last());
  await p.waitForTimeout(500);
  console.log('enviar sem descrever ->', await errs(), '| foco:', await p.evaluate(() => document.activeElement?.getAttribute('name')));
  await shot('sem-descrever');
  await p.unroute('**/api/quotes');

  // UX-29: Sobre
  await p.goto(BASE + '/sobre', { waitUntil: 'networkidle' });
  const tl = p.locator('main a[href^="/produtos/"]').first();
  await tl.scrollIntoViewIfNeeded();
  await p.waitForTimeout(500);
  await shot('sobre-linha-do-tempo');
  console.log(
    'sobre 1º projeto:',
    await tl.evaluate((a) => ({
      txt: a.innerText.replace(/\s+/g, ' '),
      deco: getComputedStyle(a).textDecorationLine,
      svg: !!a.querySelector('svg'),
    })),
  );

  // Home: destaques e capas
  await p.goto(BASE + '/', { waitUntil: 'networkidle' });
  const home = await p.evaluate(() => {
    const imgs = [...document.querySelectorAll('main img')].map((i) =>
      (i.currentSrc || i.src).split('/').pop().replace(/-\d+\.webp.*$/, ''),
    );
    const c = {};
    imgs.forEach((s) => (c[s] = (c[s] || 0) + 1));
    const sec = document.querySelector('section[aria-labelledby="destaques-title"]');
    return {
      repetidas: Object.entries(c).filter(([, n]) => n > 1),
      destaques: sec ? [...sec.querySelectorAll('h3')].map((h) => h.innerText) : [],
    };
  });
  console.log('home:', JSON.stringify(home));
  await p.locator('section[aria-labelledby="destaques-title"]').scrollIntoViewIfNeeded();
  await p.waitForTimeout(500);
  await shot('home-destaques');
} else {
  const realQuote = MODE === 'espera-real';
  const slow = (real) => async (route) => {
    await new Promise((r) => setTimeout(r, 20000));
    if (real) await route.continue().catch(() => {});
    else await fake201(route).catch(() => {});
  };
  const watch = async (label, okRe) => {
    const t0 = Date.now();
    for (const s of [1.5, 5, 12]) {
      const w = s * 1000 - (Date.now() - t0);
      if (w > 0) await p.waitForTimeout(w);
      const btn = p.locator('form button[type=submit]');
      const txt = (await p.locator('main').innerText()).replace(/\s+/g, ' ');
      console.log(
        `${label} ${s}s | botão="${await btn.innerText({ timeout: 800 }).catch(() => '-')}" desabilitado=${await btn.isDisabled({ timeout: 800 }).catch(() => '-')} | aviso=${txt.match(/Conectando[^.]*[.…][^.]*\.[^.]*\./)?.[0] ?? '-'}`,
      );
      await shot(`${label}-${String(s).replace('.', '_')}s`);
    }
    // clique repetido durante a espera
    await p.locator('form button[type=submit]').click({ force: true, timeout: 1500 }).catch(() => {});
    await p.getByText(okRe).first().waitFor({ timeout: 60000 });
    console.log(`${label}: sucesso após ${((Date.now() - t0) / 1000).toFixed(1)} s`);
    await shot(`${label}-sucesso`);
  };
  let posts = 0;
  p.on('request', (r) => /\/api\/(quotes|contact)$/.test(r.url()) && r.method() === 'POST' && posts++);

  // Contato lento (simulado, sem gravar)
  await p.route('**/api/contact', slow(false));
  await p.goto(BASE + '/contato', { waitUntil: 'networkidle' });
  await p.getByLabel(/^nome/i).fill('Teste espera');
  await p.getByLabel(/telefone/i).fill('(92) 99999-0000');
  await p.getByLabel(/assunto/i).fill('Teste de espera');
  await p.getByLabel(/^mensagem/i).fill('Teste de espera do servidor, desconsiderar.');
  await p.getByRole('checkbox').check();
  await click(p.getByRole('button', { name: /enviar mensagem/i }));
  await watch('contato', /mensagem enviada/i);

  // Orçamento lento (real ou simulado)
  await p.route('**/api/quotes', slow(realQuote));
  await p.goto(BASE + '/orcamento?produto=lancha-aluminio-7m', { waitUntil: 'networkidle' });
  await p.getByLabel(/^nome/i).fill(realQuote ? 'UXF QA-TEST orçamento' : 'Teste espera');
  await p.getByLabel(/telefone/i).fill('(92) 99999-0000');
  await p.locator('textarea').fill('Lancha para passeio com a família. Teste de experiência (QA-TEST), desconsiderar.');
  await p.getByRole('checkbox').check();
  if (realQuote) console.log('orçamento real enviado às', new Date().toISOString());
  await click(p.getByRole('button', { name: /solicitar orçamento/i }).last());
  await watch('orcamento', /pedido de orçamento enviado/i);
  console.log('POSTs feitos (contato+orçamento):', posts);

  // Recarregar no meio da espera (simulado, sem gravar)
  await p.unroute('**/api/quotes');
  await p.route('**/api/quotes', slow(false));
  await p.goto(BASE + '/orcamento?servico=reparos', { waitUntil: 'networkidle' });
  await p.getByLabel(/^nome/i).fill('Teste recarregar');
  await p.getByLabel(/telefone/i).fill('(92) 99999-0000');
  await p.locator('textarea').fill('Teste de recarregar a página durante o envio, desconsiderar.');
  await p.getByRole('checkbox').check();
  await click(p.getByRole('button', { name: /solicitar orçamento/i }).last());
  await p.waitForTimeout(5500);
  let dialog = null;
  p.once('dialog', async (d) => {
    dialog = `${d.type()}: ${d.message()}`;
    await d.dismiss();
  });
  await p.reload({ waitUntil: 'networkidle', timeout: 20000 }).catch((e) => console.log('reload:', e.message.split('\n')[0]));
  console.log('aviso do navegador ao recarregar:', dialog);
  await p.waitForTimeout(800);
  await shot('apos-recarregar');
  console.log(
    'após recarregar:',
    p.url(),
    '| nome:',
    JSON.stringify(await p.getByLabel(/^nome/i).inputValue().catch(() => '?')),
    '| mensagem:',
    JSON.stringify(await p.locator('textarea').inputValue().catch(() => '?')),
  );
}
console.log('erros console:', cerr.length ? cerr.slice(0, 5) : 'nenhum');
await b.close();
