import type { Prisma } from '@prisma/client';
import type { CategorySlug, Product } from '@cn/shared';

export const productInclude = {
  category: { select: { slug: true } },
  images: { orderBy: { order: 'asc' }, select: { src: true, alt: true } },
  specs: { orderBy: { order: 'asc' }, select: { label: true, value: true } },
} satisfies Prisma.ProductInclude;

export type ProductRow = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

/** Ordem padrão de listagem: ordem das categorias e, dentro delas, a ordem do catálogo. */
export const productOrderBy: Prisma.ProductOrderByWithRelationInput[] = [
  { category: { sortOrder: 'asc' } },
  { sortOrder: 'asc' },
  { name: 'asc' },
];

/** Converte a linha do banco no tipo público `Product` de @cn/shared. */
export function toProduct(row: ProductRow): Product {
  return {
    slug: row.slug,
    name: row.name,
    category: row.category.slug as CategorySlug,
    shortDescription: row.shortDescription,
    description: row.description,
    images: row.images.map((i) => ({ src: i.src, alt: i.alt })),
    specs: row.specs.map((s) => ({ label: s.label, value: s.value })),
    features: [...row.features],
    availability: row.availability,
    featured: row.featured,
    isDemo: row.isDemo,
    // `source` é opcional no tipo Product: só aparece quando informado.
    ...(row.source ? { source: row.source } : {}),
  };
}
