import { afterAll, describe, expect, it } from 'vitest';
import { DEMO_PRODUCTS } from '@cn/shared';
import { seed } from '../prisma/seed.js';
import { prisma } from './helpers.js';

afterAll(async () => {
  await seed(prisma); // garante o catálogo íntegro para os demais arquivos
  await prisma.$disconnect();
});

describe('seed do catálogo', () => {
  it('é idempotente (rodar 2x não duplica nada)', async () => {
    await seed(prisma);
    const before = await Promise.all([
      prisma.category.count(),
      prisma.product.count(),
      prisma.productImage.count(),
      prisma.productSpec.count(),
    ]);
    await seed(prisma);
    const after = await Promise.all([
      prisma.category.count(),
      prisma.product.count(),
      prisma.productImage.count(),
      prisma.productSpec.count(),
    ]);
    expect(after).toEqual(before);
    expect(after[1]).toBe(DEMO_PRODUCTS.length);
  });

  it('remove produtos cujo slug saiu do catálogo', async () => {
    const category = await prisma.category.findFirstOrThrow();
    await prisma.product.create({
      data: {
        slug: 'produto-obsoleto-teste',
        name: 'Obsoleto',
        categoryId: category.id,
        shortDescription: 'x',
        description: 'x',
        images: { create: [{ src: '/x.webp', alt: 'x', order: 0 }] },
      },
    });
    const result = await seed(prisma);
    expect(result.removed).toBe(1);
    expect(await prisma.product.findUnique({ where: { slug: 'produto-obsoleto-teste' } })).toBeNull();
    expect(await prisma.product.count()).toBe(DEMO_PRODUCTS.length);
  });
});
