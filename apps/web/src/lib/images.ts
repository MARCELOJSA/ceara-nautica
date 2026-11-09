/**
 * srcset por convenção do script de imagens (scripts/process-images.mjs):
 * /images/x.webp é a maior largura; /images/x-640.webp (e -1280/-1920) as menores.
 */
export function buildSrcSet(src: string, widths: number[] = [640], maxWidth = 1280): string | undefined {
  if (!/^\/images\/.+\.webp$/.test(src)) return undefined;
  const base = src.replace(/\.webp$/, '');
  const parts = widths.filter((w) => w < maxWidth).map((w) => `${base}-${w}.webp ${w}w`);
  parts.push(`${src} ${maxWidth}w`);
  return parts.join(', ');
}
