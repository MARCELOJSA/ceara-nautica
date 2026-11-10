import { afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { CATEGORIES, DEMO_PRODUCTS, matchesSearch, type Product } from '@cn/shared';
import { makeApp, prisma } from './helpers.js';

const app = makeApp();

/** Resultado esperado de uma busca, calculado com a regra compartilhada (@cn/shared). */
const expectedSlugs = (q: string, category?: string) =>
  DEMO_PRODUCTS.filter((p) => (!category || p.category === category) && matchesSearch(p, q))
    .map((p) => p.slug)
    .sort();

const slugsOf = (body: Product[]) => body.map((p) => p.slug).sort();

/** Categoria com mais de um produto (para testar "related"). */
const multiCategory = CATEGORIES.map((c) => c.slug).find(
  (slug) => DEMO_PRODUCTS.filter((p) => p.category === slug).length > 1,
)!;
const first = DEMO_PRODUCTS[0]!;
const withSource = DEMO_PRODUCTS.find((p) => p.source);
const withoutSource = DEMO_PRODUCTS.find((p) => !p.source);

afterAll(async () => {
  await prisma.$disconnect();
});

describe('GET /api/health', () => {
  it('responde ok com o banco conectado', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', db: 'ok' });
  });
});

describe('GET /api/categories', () => {
  it('lista as categorias oficiais na ordem com contagem de produtos', async () => {
    const res = await request(app).get('/api/categories');
    expect(res.status).toBe(200);
    expect(res.body.map((c: { slug: string }) => c.slug)).toEqual(CATEGORIES.map((c) => c.slug));
    const lanchas = res.body.find((c: { slug: string }) => c.slug === 'lanchas');
    expect(lanchas.productCount).toBe(DEMO_PRODUCTS.filter((p) => p.category === 'lanchas').length);
  });
});

describe('GET /api/products', () => {
  it('lista todos os produtos no formato Product', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toHaveLength(DEMO_PRODUCTS.length);
    for (const expected of DEMO_PRODUCTS) {
      const got = (res.body as Product[]).find((p) => p.slug === expected.slug);
      expect(got).toEqual(expected);
      // Nenhum campo interno (id, categoryId, sortOrder...) vaza
      expect(Object.keys(got!).sort()).toEqual(Object.keys(expected).sort());
    }
  });

  it('inclui `source` quando informado e omite quando ausente', async () => {
    const res = await request(app).get('/api/products');
    const body = res.body as Product[];
    if (withSource) {
      expect(body.find((p) => p.slug === withSource.slug)!.source).toBe(withSource.source);
    }
    if (withoutSource) {
      expect(body.find((p) => p.slug === withoutSource.slug)).not.toHaveProperty('source');
    }
  });

  it('filtra por categoria', async () => {
    for (const c of CATEGORIES) {
      const res = await request(app).get(`/api/products?category=${c.slug}`);
      expect(res.status).toBe(200);
      expect(slugsOf(res.body)).toEqual(
        DEMO_PRODUCTS.filter((p) => p.category === c.slug)
          .map((p) => p.slug)
          .sort(),
      );
    }
  });

  it('categoria inválida → 400 com details', async () => {
    const res = await request(app).get('/api/products?category=iates');
    expect(res.status).toBe(400);
    expect(res.body.error).toBeTypeOf('string');
    expect(res.body.details.category).toBeInstanceOf(Array);
  });

  it('filtra por destaque', async () => {
    const res = await request(app).get('/api/products?featured=true');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(DEMO_PRODUCTS.filter((p) => p.featured).length);
    expect((res.body as Product[]).every((p) => p.featured)).toBe(true);
  });

  it('featured inválido → 400', async () => {
    const res = await request(app).get('/api/products?featured=talvez');
    expect(res.status).toBe(400);
    expect(res.body.details.featured).toBeDefined();
  });

  it('busca q sem diferenciar maiúsculas, em nome e descrição curta', async () => {
    // termo do nome em CAIXA ALTA
    const nameTerm = first.name.split(' ')[0]!.toUpperCase();
    const byName = await request(app).get(`/api/products?q=${encodeURIComponent(nameTerm)}`);
    expect(byName.status).toBe(200);
    expect(slugsOf(byName.body)).toEqual(expectedSlugs(nameTerm));
    expect(slugsOf(byName.body)).toContain(first.slug);

    // trecho da descrição curta
    const shortTerm = first.shortDescription.slice(0, 25).toUpperCase();
    const byShort = await request(app).get(`/api/products?q=${encodeURIComponent(shortTerm)}`);
    expect(byShort.status).toBe(200);
    expect(slugsOf(byShort.body)).toEqual(expectedSlugs(shortTerm));
    expect(slugsOf(byShort.body)).toContain(first.slug);
  });

  it('combina categoria e busca', async () => {
    const res = await request(app).get(`/api/products?category=${first.category}&q=alum`);
    expect(res.status).toBe(200);
    expect(slugsOf(res.body)).toEqual(expectedSlugs('alum', first.category));
  });

  it('curingas (% e _) não funcionam como curinga: busca só com símbolos não retorna tudo', async () => {
    for (const q of ['%', '_', '\\', 'alum%nio', '%%%']) {
      const res = await request(app).get(`/api/products?q=${encodeURIComponent(q)}`);
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    }
  });

  // QA-05 / UX-03: a API usa a mesma busca do site.
  const hasAluminio = (p: Product) =>
    /alumínio/i.test(`${p.name} ${p.shortDescription} ${p.description}`);
  const searchCases: Array<[string, (p: Product) => boolean]> = [
    ['aluminio', hasAluminio],
    ['ALUMÍNIO', hasAluminio],
    ['canoa aluminio', (p) => p.category === 'canoas'],
    ['aluminio canoa', (p) => p.category === 'canoas'],
    ['canoa 6', (p) => p.slug === 'canoa-aluminio-6m'],
    ['canoa 6m', (p) => p.slug === 'canoa-aluminio-6m'],
    ['canoa 6 metros', (p) => p.slug === 'canoa-aluminio-6m'],
    ['estofado', (p) => p.category === 'estofamentos'],
    ['motr', (p) => p.category === 'motores-de-popa'],
    ['motores', (p) => p.category === 'motores-de-popa'],
    ['lanchas', (p) => p.category === 'lanchas'],
  ];

  it.each(searchCases)('q=%s retorna os produtos esperados', async (q, expected) => {
    const res = await request(app).get(`/api/products?q=${encodeURIComponent(q)}`);
    expect(res.status).toBe(200);
    const want = DEMO_PRODUCTS.filter(expected)
      .map((p) => p.slug)
      .sort();
    expect(want.length).toBeGreaterThan(0);
    expect(slugsOf(res.body)).toEqual(want);
  });

  it('"aluminio" e "alumínio" dão o mesmo resultado (QA-05)', async () => {
    const a = await request(app).get('/api/products?q=aluminio');
    const b = await request(app).get(`/api/products?q=${encodeURIComponent('alumínio')}`);
    expect(a.body.length).toBeGreaterThan(0);
    expect(slugsOf(a.body)).toEqual(slugsOf(b.body));
  });

  it('busca sem sentido não retorna tudo', async () => {
    for (const q of ['xyzw', 'qwerty asdf', 'canoa xyzw', 'lancha submarino']) {
      const res = await request(app).get(`/api/products?q=${encodeURIComponent(q)}`);
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    }
  });

  it('busca combinada com categoria e destaque', async () => {
    const res = await request(app).get('/api/products?category=canoas&featured=true&q=aluminio');
    expect(res.status).toBe(200);
    const want = DEMO_PRODUCTS.filter((p) => p.category === 'canoas' && p.featured)
      .map((p) => p.slug)
      .sort();
    expect(slugsOf(res.body)).toEqual(want);
  });

  it('busca sem resultado → lista vazia', async () => {
    const res = await request(app).get('/api/products?q=submarino');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('parâmetro repetido (array) → 400', async () => {
    const res = await request(app).get('/api/products?q=a&q=b');
    expect(res.status).toBe(400);
  });
});

describe('GET /api/products/:slug', () => {
  it('retorna o produto', async () => {
    for (const p of DEMO_PRODUCTS) {
      const res = await request(app).get(`/api/products/${p.slug}`);
      expect(res.status).toBe(200);
      expect(res.body).toEqual(p);
    }
  });

  it('slug inexistente → 404 JSON', async () => {
    const res = await request(app).get('/api/products/nao-existe');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Produto não encontrado.' });
  });

  it('slug com caracteres inválidos → 404', async () => {
    const res = await request(app).get('/api/products/' + encodeURIComponent("x' OR 1=1--"));
    expect(res.status).toBe(404);
  });
});

describe('GET /api/products/:slug/related', () => {
  it('retorna até 4 produtos da mesma categoria, sem o próprio', async () => {
    const base = DEMO_PRODUCTS.find((p) => p.category === multiCategory)!;
    const res = await request(app).get(`/api/products/${base.slug}/related`);
    expect(res.status).toBe(200);
    const body = res.body as Product[];
    const sameCategory = DEMO_PRODUCTS.filter(
      (p) => p.category === multiCategory && p.slug !== base.slug,
    );
    expect(body).toHaveLength(Math.min(4, sameCategory.length));
    expect(body.every((p) => p.category === multiCategory)).toBe(true);
    expect(body.some((p) => p.slug === base.slug)).toBe(false);
  });

  it('produto único na categoria → lista vazia', async () => {
    const lonely = DEMO_PRODUCTS.find(
      (p) => DEMO_PRODUCTS.filter((o) => o.category === p.category).length === 1,
    );
    if (!lonely) return;
    const res = await request(app).get(`/api/products/${lonely.slug}/related`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('slug inexistente → 404', async () => {
    const res = await request(app).get('/api/products/nao-existe/related');
    expect(res.status).toBe(404);
  });
});

describe('infraestrutura HTTP', () => {
  it('rota desconhecida → 404 JSON', async () => {
    const res = await request(app).get('/api/nada');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Rota não encontrada.' });
  });

  it('envia headers de segurança do helmet e não expõe X-Powered-By', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['content-security-policy']).toContain("default-src 'none'");
  });

  it('CORS libera apenas as origens configuradas', async () => {
    const ok = await request(app).get('/api/health').set('Origin', 'http://localhost:5173');
    expect(ok.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    const preview = await request(app).get('/api/health').set('Origin', 'http://localhost:4173');
    expect(preview.headers['access-control-allow-origin']).toBe('http://localhost:4173');
    const evil = await request(app).get('/api/health').set('Origin', 'https://evil.example');
    expect(evil.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('aceita WEB_ORIGIN como lista separada por vírgula', async () => {
    const custom = makeApp({ WEB_ORIGIN: 'https://cearanautica.com.br, https://www.cearanautica.com.br/' });
    const res = await request(custom)
      .get('/api/health')
      .set('Origin', 'https://www.cearanautica.com.br');
    expect(res.headers['access-control-allow-origin']).toBe('https://www.cearanautica.com.br');
    const local = await request(custom).get('/api/health').set('Origin', 'http://localhost:5173');
    expect(local.headers['access-control-allow-origin']).toBeUndefined();
  });
});
