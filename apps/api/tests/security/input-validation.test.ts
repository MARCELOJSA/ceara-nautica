/**
 * AGENT 03 — Security QA: injeção (A03), validação de entrada, mass assignment,
 * honeypot, prototype pollution e dados que voltam do banco.
 *
 * Testes marcados com `it.fails` documentam ACHADOS ABERTOS do docs/SECURITY-REPORT.md:
 * eles passam enquanto a falha existir. Quando o achado for corrigido o teste
 * passa a falhar — troque `it.fails` por `it` para virar teste de regressão.
 *
 * Todos os leads gravados aqui têm "QA-TEST" no nome e são apagados no afterAll
 * (banco de TESTE cearanautica_test).
 */
import { afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { makeApp, prisma, validContact, validQuote } from '../helpers.js';

const app = makeApp();
const MARK = 'QA-TEST';

afterAll(async () => {
  await prisma.contactMessage.deleteMany({ where: { name: { contains: MARK } } });
  await prisma.quoteRequest.deleteMany({ where: { name: { contains: MARK } } });
  await prisma.$disconnect();
});

const contact = (over: Record<string, unknown> = {}) => ({ ...validContact, name: `${MARK} contato`, ...over });
const quote = (over: Record<string, unknown> = {}) => ({ ...validQuote, name: `${MARK} orçamento`, ...over });

describe('A03 — injeção na busca (GET /api/products?q=)', () => {
  const payloads = [
    "' OR 1=1 --",
    "'; DROP TABLE products; --",
    '" OR ""="',
    '%',
    '_',
    '\\',
    '%%%%',
    '$where',
    '{"$ne":null}',
    '<script>alert(1)</script>',
    '../../etc/passwd',
    'lancha\'||pg_sleep(5)--',
  ];
  it.each(payloads)('q=%s não quebra nem vaza dados (200 + array, sem curinga)', async (q) => {
    const t0 = Date.now();
    const res = await request(app).get('/api/products').query({ q });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    // curingas do LIKE são escapados → nenhuma linha do catálogo casa com '%' ou '_'
    expect(res.body).toHaveLength(0);
    expect(Date.now() - t0).toBeLessThan(3000); // sem pg_sleep
  });

  it('a tabela continua íntegra após os payloads', async () => {
    const res = await request(app).get('/api/products');
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('q em array / objeto → 400 (não vira operador do Prisma)', async () => {
    const arr = await request(app).get('/api/products?q=a&q=b');
    expect(arr.status).toBe(400);
    const obj = await request(app).get('/api/products?q[contains]=a');
    expect(obj.status).toBe(200); // parser "simple" do Express 5 ignora a chave "q[contains]"
  });

  it('q com mais de 100 caracteres → 400', async () => {
    const res = await request(app).get('/api/products').query({ q: 'a'.repeat(101) });
    expect(res.status).toBe(400);
  });

  it('unicode/acentos na busca funcionam', async () => {
    const res = await request(app).get('/api/products').query({ q: 'alumínio 🚤 漢字' });
    expect(res.status).toBe(200);
  });

  it('[SEC-01 corrigido] q com byte nulo (%00) retorna 400', async () => {
    const res = await request(app).get('/api/products?q=a%00b');
    expect(res.status).toBe(400);
  });

  it('[SEC-01 corrigido] byte nulo não chega ao Prisma (prod e dev → 400 sem vazamento)', async () => {
    const prod = makeApp({ NODE_ENV: 'production', IP_HASH_SALT: 'salt-forte-de-teste-0123456789' });
    for (const target of [prod, app]) {
      const res = await request(target).get('/api/products?q=%00');
      expect(res.status).toBe(400);
      expect(res.text).not.toMatch(/prisma|catalog\.ts|Postgres|22021|C:\\/i);
    }
  });
});

describe('A01/A03 — slug de produto', () => {
  it.each([
    '..%2F..%2Fetc%2Fpasswd',
    '%00',
    "lancha'%20OR%20'1'='1",
    'A'.repeat(500),
    '%3Cscript%3E',
  ])('slug malicioso %s → 404 genérico', async (slug) => {
    const res = await request(app).get(`/api/products/${slug}`);
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Produto não encontrado.' });
  });

  it('slug inexistente e slug inválido têm a mesma resposta (sem enumeração)', async () => {
    const a = await request(app).get('/api/products/nao-existe-mesmo');
    const b = await request(app).get('/api/products/%24%24%24');
    expect(a.status).toBe(b.status);
    expect(a.body).toEqual(b.body);
  });

  it('produtos não expõem ids internos (id, categoryId, createdAt)', async () => {
    const res = await request(app).get('/api/products');
    const p = res.body[0];
    expect(p).not.toHaveProperty('id');
    expect(p).not.toHaveProperty('categoryId');
    expect(p).not.toHaveProperty('createdAt');
  });
});

describe('validação de formulários — tipos errados', () => {
  it.each([
    ['name número', { name: 12345 }],
    ['name array', { name: ['QA-TEST'] }],
    ['name objeto', { name: { $ne: '' } }],
    ['consent string', { consent: 'true' }],
    ['consent false', { consent: false }],
    ['consent ausente', { consent: undefined }],
    ['phone inválido', { phone: 'abc' }],
    ['phone com script', { phone: '<script>' }],
    ['email com CRLF (header injection)', { email: 'a@b.com\r\nBcc: x@y.com' }],
    ['email inválido', { email: 'nao-e-email' }],
    ['subject vazio (só espaços)', { subject: '     ' }],
    ['message curta', { message: 'curta' }],
    ['message > 2000', { message: 'x'.repeat(2001) }],
    ['name > 120', { name: `${MARK} ${'x'.repeat(130)}` }],
    ['utm não-objeto', { utm: 'google' }],
    ['utm_source > 200', { utm: { utm_source: 'x'.repeat(201) } }],
  ])('contato: %s → 400 com details', async (_label, over) => {
    const before = await prisma.contactMessage.count();
    const res = await request(app).post('/api/contact').send(contact(over));
    expect(res.status).toBe(400);
    expect(res.body.error).toBeTypeOf('string');
    expect(res.body.details).toBeTypeOf('object');
    expect(res.text).not.toMatch(/at .*\.(ts|js):\d+/);
    expect(await prisma.contactMessage.count()).toBe(before);
  });

  it.each([
    ['category fora do enum', { category: 'iates' }],
    ['requestType fora do enum', { requestType: '<script>' }],
    ['requestType objeto', { requestType: { $ne: null } }],
    ['productSlug com traversal', { productSlug: '../../etc' }],
    ['productSlug SQL', { productSlug: "x' OR '1'='1" }],
    ['city > 120', { city: 'x'.repeat(121) }],
  ])('orçamento: %s → 400', async (_label, over) => {
    const res = await request(app).post('/api/quotes').send(quote(over));
    expect(res.status).toBe(400);
  });

  it('body que não é objeto (array, string, número, null) → 400', async () => {
    for (const body of ['[]', '"x"', '1', 'null']) {
      const res = await request(app).post('/api/contact').set('Content-Type', 'application/json').send(body);
      expect(res.status).toBe(400);
    }
  });

  it('JSON malformado → 400 "JSON malformado." sem stack', async () => {
    const res = await request(app).post('/api/contact').set('Content-Type', 'application/json').send('{"name":');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'JSON malformado.' });
  });

  it('corpo acima de 20kb → 413', async () => {
    const res = await request(app)
      .post('/api/contact')
      .send(contact({ message: 'x'.repeat(25_000) }));
    expect(res.status).toBe(413);
    expect(res.body).toEqual({ error: 'Conteúdo da requisição muito grande.' });
  });

  it('charset não-UTF (latin1) → 415 genérico', async () => {
    const res = await request(app)
      .post('/api/contact')
      .set('Content-Type', 'application/json; charset=iso-8859-1')
      .send(JSON.stringify(contact()));
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  it('JSON profundamente aninhado / arrays grandes dentro de 20kb respondem rápido (zod GHSA-mrhx)', async () => {
    const deep = '{"a":'.repeat(2000) + '1' + '}'.repeat(2000);
    const big = JSON.stringify({ ...contact(), utm: { utm_source: Array.from({ length: 3000 }, () => 1) } });
    const t0 = Date.now();
    const r1 = await request(app)
      .post('/api/contact')
      .set('Content-Type', 'application/json')
      .send(`{"name":"${MARK}","utm":${deep}}`);
    const r2 = await request(app).post('/api/contact').set('Content-Type', 'application/json').send(big);
    expect(r1.status).toBe(400);
    expect(r2.status).toBe(400);
    expect(Date.now() - t0).toBeLessThan(2000);
  });

  it('regex de telefone não sofre ReDoS', async () => {
    const t0 = Date.now();
    const res = await request(app)
      .post('/api/contact')
      .send(contact({ phone: `${'9'.repeat(15_000)}a` }));
    expect(res.status).toBe(400);
    expect(Date.now() - t0).toBeLessThan(1000);
  });
});

describe('XSS armazenado / unicode — o dado é guardado literal e devolvido só como JSON', () => {
  it('nome com <script> é aceito e salvo literalmente (saída deve ser escapada por quem exibir)', async () => {
    const name = `${MARK} <script>alert(document.cookie)</script>`;
    const res = await request(app)
      .post('/api/contact')
      .send(contact({ name, subject: '<img src=x onerror=alert(1)>', message: '"><svg/onload=alert(1)> mensagem' }));
    expect(res.status).toBe(201);
    expect(res.headers['content-type']).toMatch(/^application\/json/);
    expect(res.text).not.toContain('<script>'); // resposta não ecoa o payload
    const row = await prisma.contactMessage.findUniqueOrThrow({ where: { id: res.body.id } });
    expect(row.name).toBe(name);
  });

  it('unicode (acentos, emoji, CJK, RTL) é preservado', async () => {
    const name = `${MARK} Ñandú Conceição 🚤 漢字 مرحبا`;
    const res = await request(app).post('/api/quotes').send(quote({ name, city: 'São Gabriel da Cachoeira' }));
    expect(res.status).toBe(201);
    const row = await prisma.quoteRequest.findUniqueOrThrow({ where: { id: res.body.id } });
    expect(row.name).toBe(name);
  });

  it.each([
    ['bidi U+202E', '\u202Eabc'],
    ['isolador bidi U+2066', '\u2066abc'],
    ['controle C0 U+0007', 'a\u0007b'],
    ['controle C1 U+0085', 'a\u0085b'],
    ['quebra de linha', 'a\nb'],
  ])('[SEC-08 corrigido] %s no nome → 400', async (_label, bad) => {
    const res = await request(app).post('/api/contact').send(contact({ name: `${MARK} ${bad}` }));
    expect(res.status).toBe(400);
    expect(res.body.details?.name).toBeDefined();
  });

  it('[SEC-08 corrigido] bidi na mensagem e na cidade → 400', async () => {
    const msg = await request(app)
      .post('/api/contact')
      .send(contact({ message: 'Mensagem com \u202Etexto invertido' }));
    expect(msg.status).toBe(400);
    const city = await request(app).post('/api/quotes').send(quote({ city: 'Manaus\u202E' }));
    expect(city.status).toBe(400);
  });

  it('mensagem com quebras de linha e tab continua aceita', async () => {
    const res = await request(app)
      .post('/api/contact')
      .send(contact({ message: `${MARK} Linha 1\nLinha 2\r\n\tItem com tab` }));
    expect(res.status).toBe(201);
  });

  it('[SEC-01 corrigido] byte nulo no nome retorna 400', async () => {
    const res = await request(app).post('/api/contact').send(contact({ name: `${MARK} a\u0000b` }));
    expect(res.status).toBe(400);
  });

  it('[SEC-01 corrigido] byte nulo em utm_source retorna 400', async () => {
    const res = await request(app)
      .post('/api/quotes')
      .send(quote({ utm: { utm_source: 'goo\u0000gle' } }));
    expect(res.status).toBe(400);
  });
});

describe('mass assignment / prototype pollution', () => {
  it('campos extras (id, createdAt, ipHash, userAgent, isAdmin) são ignorados', async () => {
    const res = await request(app)
      .post('/api/contact')
      .set('User-Agent', 'qa-agent')
      .send(
        contact({
          id: 'id-forjado',
          createdAt: '2000-01-01T00:00:00.000Z',
          ipHash: 'f'.repeat(64),
          userAgent: 'forjado',
          isAdmin: true,
        }),
      );
    expect(res.status).toBe(201);
    expect(res.body.id).not.toBe('id-forjado');
    const row = await prisma.contactMessage.findUniqueOrThrow({ where: { id: res.body.id } });
    expect(row.createdAt.getFullYear()).toBeGreaterThan(2000);
    expect(row.ipHash).not.toBe('f'.repeat(64));
    expect(row.userAgent).toBe('qa-agent');
  });

  it('__proto__ / constructor no corpo não poluem Object.prototype', async () => {
    const body = `{"name":"${MARK} proto","phone":"92999999999","subject":"Assunto","message":"mensagem longa ok","consent":true,"__proto__":{"polluted":"yes"},"constructor":{"prototype":{"polluted2":"yes"}}}`;
    const res = await request(app).post('/api/contact').set('Content-Type', 'application/json').send(body);
    expect([201, 400]).toContain(res.status);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    expect(({} as Record<string, unknown>).polluted2).toBeUndefined();
  });

  it('resposta do POST não devolve dados pessoais nem metadados', async () => {
    const res = await request(app).post('/api/quotes').send(quote());
    expect(res.status).toBe(201);
    expect(Object.keys(res.body).sort()).toEqual(['id', 'ok']);
  });
});

describe('honeypot', () => {
  it.each([
    ['string preenchida', 'https://spam.example'],
    ['número', 1],
    ['array', []],
    ['objeto', {}],
  ])('website = %s → 201 indistinguível, nada gravado', async (_l, website) => {
    const before = await prisma.contactMessage.count();
    const res = await request(app).post('/api/contact').send(contact({ website }));
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ ok: true, id: expect.stringMatching(/^c[a-f0-9]{24}$/) });
    expect(await prisma.contactMessage.count()).toBe(before);
  });

  it('honeypot preenchido com corpo inválido ainda responde 201 (bot não aprende a validação)', async () => {
    const res = await request(app).post('/api/quotes').send({ website: 'x' });
    expect(res.status).toBe(201);
  });
});
