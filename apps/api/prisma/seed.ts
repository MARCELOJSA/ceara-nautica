/**
 * Seed idempotente do catálogo a partir de @cn/shared (CATEGORIES + DEMO_PRODUCTS).
 * Pode ser executado várias vezes: categorias e produtos são "upsert" por slug,
 * imagens/specs do produto são substituídas pelo conteúdo atual do catálogo.
 * O catálogo de @cn/shared é a fonte única: produtos cujo slug saiu do catálogo
 * são removidos do banco (imagens/specs em cascata). Leads não são afetados
 * (guardam apenas o slug como texto).
 */
import 'dotenv/config';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';
import { CATEGORIES, DEMO_PRODUCTS, type Product } from '@cn/shared';

/** Pasta pública do site, onde ficam as imagens declaradas no catálogo. */
export const WEB_PUBLIC_DIR = fileURLToPath(new URL('../../web/public', import.meta.url));

/**
 * Imagens do catálogo que não existem em apps/web/public (QA-08). O seed só
 * avisa: a API não serve as imagens, mas links quebrados devem ser corrigidos
 * no catálogo de @cn/shared.
 */
export function missingImages(products: Product[] = DEMO_PRODUCTS, publicDir = WEB_PUBLIC_DIR) {
  return products.flatMap((p) =>
    p.images
      .filter((img) => !existsSync(`${publicDir}${img.src}`))
      .map((img) => ({ slug: p.slug, src: img.src })),
  );
}

export async function seed(prisma: PrismaClient, products: Product[] = DEMO_PRODUCTS) {
  const categoryIds = new Map<string, string>();
  for (const [index, c] of CATEGORIES.entries()) {
    const row = await prisma.category.upsert({
      where: { slug: c.slug },
      create: { slug: c.slug, name: c.name, description: c.description, sortOrder: index },
      update: { name: c.name, description: c.description, sortOrder: index },
      select: { id: true },
    });
    categoryIds.set(c.slug, row.id);
  }

  for (const [index, p] of products.entries()) {
    const categoryId = categoryIds.get(p.category);
    if (!categoryId) throw new Error(`Categoria desconhecida no produto ${p.slug}: ${p.category}`);
    const fields = {
      name: p.name,
      categoryId,
      shortDescription: p.shortDescription,
      description: p.description,
      features: p.features,
      availability: p.availability,
      featured: p.featured,
      isDemo: p.isDemo,
      source: p.source ?? null,
      sortOrder: index,
    };
    await prisma.$transaction(async (tx) => {
      const product = await tx.product.upsert({
        where: { slug: p.slug },
        create: { slug: p.slug, ...fields },
        update: fields,
        select: { id: true },
      });
      await tx.productImage.deleteMany({ where: { productId: product.id } });
      await tx.productSpec.deleteMany({ where: { productId: product.id } });
      await tx.productImage.createMany({
        data: p.images.map((img, order) => ({
          productId: product.id,
          src: img.src,
          alt: img.alt,
          order,
        })),
      });
      await tx.productSpec.createMany({
        data: p.specs.map((s, order) => ({
          productId: product.id,
          label: s.label,
          value: s.value,
          order,
        })),
      });
    });
  }

  const removed = await prisma.product.deleteMany({
    where: { slug: { notIn: products.map((p) => p.slug) } },
  });

  return { categories: CATEGORIES.length, products: products.length, removed: removed.count };
}

const isDirectRun = process.argv[1] && /seed\.(ts|js|mjs)$/.test(process.argv[1]);

if (isDirectRun) {
  const prisma = new PrismaClient();
  for (const m of missingImages()) {
    console.warn(`Aviso: imagem inexistente em apps/web/public: ${m.src} (produto ${m.slug})`);
  }
  seed(prisma)
    .then((r) => {
      console.log(
        `Seed concluído: ${r.categories} categorias, ${r.products} produtos, ${r.removed} removido(s) por não estarem mais no catálogo.`,
      );
    })
    .catch((err) => {
      console.error('Falha no seed:', err);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
