/**
 * Baixa as fotos listadas em images.manifest.mjs (Unsplash), recorta e converte
 * em WebP responsivo dentro de public/. Também gera favicons a partir da logo.
 *
 * Uso: npm run images -w apps/web   (requer internet apenas para o download)
 * Os originais ficam em .image-cache/ (ignorado no git).
 */
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { IMAGES } from './images.manifest.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pub = path.join(root, 'public');
const cache = path.join(root, '.image-cache');

const exists = (p) =>
  access(p).then(
    () => true,
    () => false,
  );

async function download(id) {
  const file = path.join(cache, `${id}.jpg`);
  if (await exists(file)) return readFile(file);
  const url = `https://images.unsplash.com/photo-${id}?fm=jpg&q=85&w=2600`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Falha ao baixar ${url}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(file, buf);
  return buf;
}

async function processImage(img) {
  const src = await download(img.id);
  const widths = [...img.widths].sort((a, b) => a - b);
  const max = widths[widths.length - 1];
  await mkdir(path.dirname(path.join(pub, img.out)), { recursive: true });
  let input = src;
  if (img.extract) {
    const meta = await sharp(src).metadata();
    const W = meta.width ?? 0;
    const H = meta.height ?? 0;
    input = await sharp(src)
      .extract({
        left: Math.round(img.extract.left * W),
        top: Math.round(img.extract.top * H),
        width: Math.round(img.extract.width * W),
        height: Math.round(img.extract.height * H),
      })
      .toBuffer();
  }
  for (const w of widths) {
    const h = Math.round(w / img.ratio);
    const name = w === max ? `${img.out}.webp` : `${img.out}-${w}.webp`;
    await sharp(input)
      .resize(w, h, { fit: 'cover', position: img.position ?? 'centre', withoutEnlargement: false })
      .webp({ quality: w >= 1280 ? 72 : 70, effort: 5 })
      .toFile(path.join(pub, name));
  }
  console.log('ok', img.out);
}

async function favicons() {
  // ícones PNG gerados a partir do favicon.svg (marca vetorial recriada da logo)
  const svg = await readFile(path.join(pub, 'favicon.svg'));
  for (const size of [32, 180, 192, 512]) {
    const name = size === 180 ? 'apple-touch-icon.png' : `favicon-${size}.png`;
    await sharp(svg, { density: Math.max(72, Math.ceil((72 * size) / 560) * 2) })
      .resize(size, size)
      .png()
      .toFile(path.join(pub, name));
  }
  // imagem padrão de compartilhamento (Open Graph) 1200x630 a partir do hero
  await sharp(path.join(pub, 'images', 'hero.webp'))
    .resize(1200, 630, { fit: 'cover' })
    .jpeg({ quality: 80 })
    .toFile(path.join(pub, 'og-image.jpg'));
  console.log('ok favicons/og');
}

/** Lista das fotos de produto existentes — o front exibe só o que existe (src/data/product-images.json). */
async function writeProductImageList() {
  const list = IMAGES.filter((i) => i.out.startsWith('images/products/'))
    .map((i) => `/${i.out}.webp`)
    .sort();
  await writeFile(
    path.join(root, 'src', 'data', 'product-images.json'),
    `${JSON.stringify(list, null, 2)}
`,
    'utf8',
  );
}

await mkdir(cache, { recursive: true });
await writeProductImageList();
const only = process.argv[2];
if (only === '--icons') {
  await favicons();
  process.exit(0);
}
for (const img of IMAGES) {
  if (only && !img.out.includes(only)) continue;
  await processImage(img);
}
await favicons();
