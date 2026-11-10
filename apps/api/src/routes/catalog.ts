import { Router } from 'express';
import { z } from 'zod';
import type { Prisma, PrismaClient } from '@prisma/client';
import {
  CATEGORIES,
  CATEGORY_SLUGS,
  hasUnsafeChars,
  searchProducts,
  type CategoryWithCount,
  type Product,
} from '@cn/shared';
import { notFound } from '../lib/http-error.js';
import { parseOr400 } from '../lib/validate.js';
import { productInclude, productOrderBy, toProduct } from '../lib/products.js';

const RELATED_LIMIT = 4;

const emptyToUndefined = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? undefined : v);

const productsQuerySchema = z.object({
  category: z.preprocess(
    emptyToUndefined,
    z
      .enum(CATEGORY_SLUGS, {
        error: `Categoria inválida. Use: ${CATEGORY_SLUGS.join(', ')}.`,
      })
      .optional(),
  ),
  q: z.preprocess(
    emptyToUndefined,
    z
      .string({ error: 'Busca inválida.' })
      .trim()
      .max(100, 'Busca muito longa.')
      .refine((s) => !hasUnsafeChars(s), 'Busca inválida.')
      .optional(),
  ),
  featured: z.preprocess(
    emptyToUndefined,
    z
      .enum(['true', 'false', '1', '0'], {
        error: 'Use featured=true ou featured=false.',
      })
      .transform((v) => v === 'true' || v === '1')
      .optional(),
  ),
});

const slugSchema = z
  .string()
  .max(160)
  .regex(/^[a-z0-9-]+$/);

export function catalogRouter(prisma: PrismaClient): Router {
  const router = Router();

  router.get('/categories', async (_req, res) => {
    const rows = await prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
      select: { slug: true, name: true, description: true, _count: { select: { products: true } } },
    });
    const bySlug = new Map(rows.map((r) => [r.slug, r]));
    // A ordem e o conjunto oficiais vêm de @cn/shared; contagem vem do banco.
    const body: CategoryWithCount[] = CATEGORIES.map((c) => ({
      slug: c.slug,
      name: bySlug.get(c.slug)?.name ?? c.name,
      description: bySlug.get(c.slug)?.description ?? c.description,
      productCount: bySlug.get(c.slug)?._count.products ?? 0,
    }));
    res.json(body);
  });

  router.get('/products', async (req, res) => {
    const query = parseOr400(productsQuerySchema, req.query, 'Parâmetros de busca inválidos.');
    const where: Prisma.ProductWhereInput = {};
    if (query.category) where.category = { slug: query.category };
    if (query.featured !== undefined) where.featured = query.featured;
    const rows = await prisma.product.findMany({
      where,
      include: productInclude,
      orderBy: productOrderBy,
    });
    // Busca textual (q) em memória com a MESMA regra do site (`searchProducts`
    // de @cn/shared: sem acento, todas as palavras, sinônimos, 1 erro de
    // digitação). Adequado porque o catálogo é pequeno (dezenas de itens);
    // se crescer para milhares, migrar para busca no banco (unaccent/pg_trgm
    // ou full-text search). Nenhum texto do usuário vai para SQL.
    const body: Product[] = searchProducts(rows.map(toProduct), query.q ?? '');
    res.json(body);
  });

  router.get('/products/:slug', async (req, res) => {
    const slug = slugSchema.safeParse(req.params.slug);
    if (!slug.success) throw notFound('Produto não encontrado.');
    const row = await prisma.product.findUnique({
      where: { slug: slug.data },
      include: productInclude,
    });
    if (!row) throw notFound('Produto não encontrado.');
    res.json(toProduct(row));
  });

  router.get('/products/:slug/related', async (req, res) => {
    const slug = slugSchema.safeParse(req.params.slug);
    if (!slug.success) throw notFound('Produto não encontrado.');
    const base = await prisma.product.findUnique({
      where: { slug: slug.data },
      select: { id: true, categoryId: true },
    });
    if (!base) throw notFound('Produto não encontrado.');
    const rows = await prisma.product.findMany({
      where: { categoryId: base.categoryId, id: { not: base.id } },
      include: productInclude,
      orderBy: [{ featured: 'desc' }, { sortOrder: 'asc' }, { name: 'asc' }],
      take: RELATED_LIMIT,
    });
    const body: Product[] = rows.map(toProduct);
    res.json(body);
  });

  return router;
}
