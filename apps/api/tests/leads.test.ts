import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createHash } from 'node:crypto';
import { makeApp, prisma, validContact, validQuote } from './helpers.js';
import type { LeadNotification } from '../src/lib/notify.js';

const notifications: LeadNotification[] = [];
const app = makeApp({}, (lead) => notifications.push(lead));

beforeEach(async () => {
  notifications.length = 0;
  await prisma.contactMessage.deleteMany();
  await prisma.quoteRequest.deleteMany();
});

afterAll(async () => {
  await prisma.contactMessage.deleteMany();
  await prisma.quoteRequest.deleteMany();
  await prisma.$disconnect();
});

describe('POST /api/contact', () => {
  it('grava a mensagem com UTM, ipHash e userAgent → 201 { ok, id }', async () => {
    const res = await request(app)
      .post('/api/contact')
      .set('User-Agent', 'vitest-agent/1.0')
      .send(validContact);
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ ok: true, id: expect.any(String) });

    const row = await prisma.contactMessage.findUniqueOrThrow({ where: { id: res.body.id } });
    expect(row).toMatchObject({
      name: 'Maria Teste',
      phone: '(92) 99999-9999',
      email: 'maria@example.com',
      subject: 'Dúvida sobre lanchas',
      consent: true,
      utmSource: 'google',
      utmMedium: 'cpc',
      utmCampaign: 'teste',
      gclid: 'abc123',
      userAgent: 'vitest-agent/1.0',
    });
    expect(row.ipHash).toMatch(/^[a-f0-9]{64}$/);
    // nunca o IP cru
    expect(row.ipHash).not.toContain('127.0.0.1');
    expect(notifications).toHaveLength(1);
    expect(notifications[0]).toMatchObject({ type: 'contact', id: res.body.id });
  });

  it('ipHash é SHA-256 com o salt configurado', async () => {
    const res = await request(app).post('/api/contact').send(validContact);
    const row = await prisma.contactMessage.findUniqueOrThrow({ where: { id: res.body.id } });
    const candidates = ['::ffff:127.0.0.1', '127.0.0.1', '::1'].map((ip) =>
      createHash('sha256').update(`salt-de-teste:${ip}`).digest('hex'),
    );
    expect(candidates).toContain(row.ipHash);
  });

  it('trunca userAgent muito longo', async () => {
    const res = await request(app)
      .post('/api/contact')
      .set('User-Agent', 'A'.repeat(1000))
      .send(validContact);
    expect(res.status).toBe(201);
    const row = await prisma.contactMessage.findUniqueOrThrow({ where: { id: res.body.id } });
    expect(row.userAgent).toHaveLength(300);
  });

  it('dados inválidos → 400 com details por campo e nada gravado', async () => {
    const res = await request(app)
      .post('/api/contact')
      .send({ ...validContact, name: 'A', phone: '123', email: 'nao-e-email', message: 'curta' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeTypeOf('string');
    expect(Object.keys(res.body.details)).toEqual(
      expect.arrayContaining(['name', 'phone', 'email', 'message']),
    );
    expect(await prisma.contactMessage.count()).toBe(0);
  });

  it('consentimento ausente → 400 em consent', async () => {
    const { consent: _consent, ...semConsent } = validContact;
    const res = await request(app).post('/api/contact').send(semConsent);
    expect(res.status).toBe(400);
    expect(res.body.details.consent).toEqual(['É necessário autorizar o contato para enviar.']);
  });

  it('consentimento false → 400', async () => {
    const res = await request(app).post('/api/contact').send({ ...validContact, consent: false });
    expect(res.status).toBe(400);
    expect(res.body.details.consent).toBeDefined();
  });

  it('honeypot preenchido → 201 falso sem gravar nem notificar', async () => {
    const res = await request(app)
      .post('/api/contact')
      .send({ ...validContact, website: 'http://spam.example' });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ ok: true, id: expect.any(String) });
    expect(await prisma.contactMessage.count()).toBe(0);
    expect(notifications).toHaveLength(0);
  });

  it('honeypot preenchido mesmo com dados inválidos → 201 falso', async () => {
    const res = await request(app).post('/api/contact').send({ website: 'x' });
    expect(res.status).toBe(201);
    expect(await prisma.contactMessage.count()).toBe(0);
  });

  it('JSON malformado → 400', async () => {
    const res = await request(app)
      .post('/api/contact')
      .set('Content-Type', 'application/json')
      .send('{"name": "Maria",');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'JSON malformado.' });
  });

  it('corpo vazio / sem JSON → 400', async () => {
    const res = await request(app).post('/api/contact');
    expect(res.status).toBe(400);
  });

  it('payload maior que 20kb → 413', async () => {
    const res = await request(app)
      .post('/api/contact')
      .send({ ...validContact, message: 'x'.repeat(25 * 1024) });
    expect(res.status).toBe(413);
    expect(res.body.error).toBeTypeOf('string');
    expect(await prisma.contactMessage.count()).toBe(0);
  });
});

describe('POST /api/quotes', () => {
  it('grava o orçamento → 201 { ok, id }', async () => {
    const res = await request(app).post('/api/quotes').send(validQuote);
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ ok: true, id: expect.any(String) });
    const row = await prisma.quoteRequest.findUniqueOrThrow({ where: { id: res.body.id } });
    expect(row).toMatchObject({
      name: 'João Teste',
      phone: '92999999999',
      email: null,
      category: validQuote.category,
      productSlug: validQuote.productSlug,
      city: 'Manaus',
      consent: true,
      utmSource: 'instagram',
      landingPage: validQuote.utm.landing_page,
    });
    expect(notifications[0]).toMatchObject({ type: 'quote', id: res.body.id });
  });

  it('aceita orçamento mínimo (sem categoria/produto/utm)', async () => {
    const res = await request(app).post('/api/quotes').send({
      name: 'Ana',
      phone: '+55 92 98888-7777',
      message: 'Preciso de reparo no casco do meu barco.',
      consent: true,
    });
    expect(res.status).toBe(201);
    expect(await prisma.quoteRequest.count()).toBe(1);
  });

  it('categoria inválida → 400 em category', async () => {
    const res = await request(app).post('/api/quotes').send({ ...validQuote, category: 'iates' });
    expect(res.status).toBe(400);
    expect(res.body.details.category).toBeDefined();
    expect(await prisma.quoteRequest.count()).toBe(0);
  });

  it('productSlug inválido → 400', async () => {
    const res = await request(app)
      .post('/api/quotes')
      .send({ ...validQuote, productSlug: '../../etc/passwd' });
    expect(res.status).toBe(400);
    expect(res.body.details.productSlug).toBeDefined();
  });

  it('consentimento ausente → 400', async () => {
    const { consent: _consent, ...semConsent } = validQuote;
    const res = await request(app).post('/api/quotes').send(semConsent);
    expect(res.status).toBe(400);
    expect(res.body.details.consent).toBeDefined();
  });

  it('UTM com valor longo demais → 400 em utm.utm_source', async () => {
    const res = await request(app)
      .post('/api/quotes')
      .send({ ...validQuote, utm: { utm_source: 'x'.repeat(201) } });
    expect(res.status).toBe(400);
    expect(res.body.details['utm.utm_source']).toBeDefined();
  });

  it('honeypot preenchido → 201 falso sem gravar', async () => {
    const res = await request(app).post('/api/quotes').send({ ...validQuote, website: 'spam' });
    expect(res.status).toBe(201);
    expect(await prisma.quoteRequest.count()).toBe(0);
  });
});

describe('rate limit dos POST', () => {
  it('excede o limite → 429 JSON', async () => {
    const limited = makeApp({ RATE_LIMIT_DISABLED: 'false', RATE_LIMIT_MAX: '2' }, () => {});
    const r1 = await request(limited).post('/api/contact').send(validContact);
    const r2 = await request(limited).post('/api/quotes').send(validQuote);
    const r3 = await request(limited).post('/api/contact').send(validContact);
    expect([r1.status, r2.status]).toEqual([201, 201]);
    expect(r3.status).toBe(429);
    expect(r3.body.error).toBeTypeOf('string');
    expect(r3.headers['ratelimit-policy'] ?? r3.headers['ratelimit']).toBeDefined();
  });

  it('JSON malformado e payload grande também contam no limite', async () => {
    const limited = makeApp({ RATE_LIMIT_DISABLED: 'false', RATE_LIMIT_MAX: '2' }, () => {});
    const bad = await request(limited)
      .post('/api/contact')
      .set('Content-Type', 'application/json')
      .send('{"x":');
    const big = await request(limited)
      .post('/api/quotes')
      .send({ ...validQuote, message: 'x'.repeat(25 * 1024) });
    const third = await request(limited).post('/api/contact').send(validContact);
    expect([bad.status, big.status, third.status]).toEqual([400, 413, 429]);
  });

  it('GET não é limitado', async () => {
    const limited = makeApp({ RATE_LIMIT_DISABLED: 'false', RATE_LIMIT_MAX: '1' });
    for (let i = 0; i < 3; i++) {
      const res = await request(limited).get('/api/health');
      expect(res.status).toBe(200);
    }
  });
});

describe('webhook de lead', () => {
  it('falha do webhook não quebra a requisição', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('rede fora'));
    const withHook = makeApp({ LEAD_WEBHOOK_URL: 'https://hooks.example/lead' });
    const res = await request(withHook).post('/api/quotes').send(validQuote);
    expect(res.status).toBe(201);
    await vi.waitFor(() => expect(fetchSpy).toHaveBeenCalledOnce());
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe('https://hooks.example/lead');
    const payload = JSON.parse(String((init as RequestInit).body));
    expect(payload).toMatchObject({ type: 'quote', id: res.body.id });
    // sem dados pessoais no webhook
    expect(JSON.stringify(payload)).not.toContain('92999999999');
    fetchSpy.mockRestore();
  });
});
