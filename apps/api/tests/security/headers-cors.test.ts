/**
 * AGENT 03 — Security QA: headers HTTP (helmet/CSP) e CORS.
 * OWASP A05 (Security Misconfiguration).
 */
import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { makeApp } from '../helpers.js';

const app = makeApp();
const ALLOWED = 'http://localhost:5173';
const EVIL = 'https://evil.example.com';

describe('headers de segurança (helmet)', () => {
  it.each(['/api/health', '/api/products', '/api/rota-inexistente'])(
    '%s traz headers obrigatórios',
    async (path) => {
      const res = await request(app).get(path);
      expect(res.headers['content-security-policy']).toBe(
        "default-src 'none';frame-ancestors 'none'",
      );
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['strict-transport-security']).toMatch(/max-age=\d{7,}/);
      expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
      expect(res.headers['referrer-policy']).toBe('no-referrer');
      expect(res.headers['cross-origin-resource-policy']).toBe('same-site');
      expect(res.headers['x-powered-by']).toBeUndefined();
      expect(res.headers['content-type']).toMatch(/^application\/json/);
    },
  );

  it('POST de lead também recebe os headers (mesmo com 400)', async () => {
    const res = await request(app).post('/api/contact').send({});
    expect(res.status).toBe(400);
    expect(res.headers['content-security-policy']).toContain("default-src 'none'");
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});

describe('CORS', () => {
  it('origem permitida recebe Access-Control-Allow-Origin exato (sem curinga)', async () => {
    const res = await request(app).get('/api/products').set('Origin', ALLOWED);
    expect(res.headers['access-control-allow-origin']).toBe(ALLOWED);
    expect(res.headers['access-control-allow-credentials']).toBeUndefined();
    expect(res.headers.vary).toMatch(/Origin/i);
  });

  it.each([
    EVIL,
    'null',
    'http://localhost:5173.evil.com',
    'http://evil-localhost:5173',
    'HTTP://LOCALHOST:5173',
  ])('origem não autorizada (%s) NÃO recebe ACAO', async (origin) => {
    const res = await request(app).get('/api/products').set('Origin', origin);
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('preflight de origem maliciosa não libera POST', async () => {
    const res = await request(app)
      .options('/api/contact')
      .set('Origin', EVIL)
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'content-type');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('preflight da origem permitida libera só GET/POST/OPTIONS e Content-Type', async () => {
    const res = await request(app)
      .options('/api/contact')
      .set('Origin', ALLOWED)
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'content-type');
    expect(res.status).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe(ALLOWED);
    expect(res.headers['access-control-allow-methods']).toBe('GET,POST,OPTIONS');
    expect(res.headers['access-control-allow-headers']).toBe('Content-Type');
    expect(res.headers['access-control-allow-methods']).not.toMatch(/PUT|DELETE|PATCH/);
  });

  it('POST "simples" (CSRF via form text/plain ou urlencoded) não é aceito', async () => {
    const asText = await request(app)
      .post('/api/contact')
      .set('Origin', EVIL)
      .set('Content-Type', 'text/plain')
      .send(
        '{"name":"QA-TEST csrf","phone":"92999999999","subject":"x","message":"xxxxxxxxxxxx","consent":true}',
      );
    expect(asText.status).toBe(400);
    const asForm = await request(app).post('/api/quotes').set('Origin', EVIL).type('form').send({
      name: 'QA-TEST csrf',
      phone: '92999999999',
      message: 'xxxxxxxxxxxx',
      consent: 'true',
    });
    expect(asForm.status).toBe(400);
  });
});

describe('métodos não suportados', () => {
  it.each(['put', 'delete', 'patch'] as const)(
    '%s em /api/contact → 404 JSON sem detalhes',
    async (m) => {
      const res = await request(app)[m]('/api/contact').send({});
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Rota não encontrada.' });
    },
  );

  it('TRACE não é refletido', async () => {
    const res = await request(app).trace('/api/health');
    expect(res.status).toBe(404);
  });
});
