import type { Product, ProductImage } from '@cn/shared';
import PRODUCT_IMAGES from '@/data/product-images.json';

/**
 * srcset por convenção do script de imagens (scripts/process-images.mjs):
 * /images/x.webp é a maior largura; /images/x-640.webp (e -1280/-1920) as menores.
 */
export function buildSrcSet(
  src: string,
  widths: number[] = [640],
  maxWidth = 1280,
): string | undefined {
  if (!/^\/images\/.+\.webp$/.test(src)) return undefined;
  const base = src.replace(/\.webp$/, '');
  const parts = widths.filter((w) => w < maxWidth).map((w) => `${base}-${w}.webp ${w}w`);
  parts.push(`${src} ${maxWidth}w`);
  return parts.join(', ');
}

const AVAILABLE = new Set<string>(PRODUCT_IMAGES);

/**
 * Fotos de produto que realmente existem em public/images/products (lista gerada
 * por scripts/process-images.mjs). Caminhos fora dessa pasta (ex.: fotos futuras
 * vindas da API/CDN) passam direto. Evita imagem quebrada quando o catálogo
 * referencia uma foto que foi retirada.
 */
export function productImages(p: Pick<Product, 'images'>): ProductImage[] {
  return p.images.filter((i) => !i.src.startsWith('/images/products/') || AVAILABLE.has(i.src));
}
